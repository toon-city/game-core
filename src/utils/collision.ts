import { Point } from "../core/types/Point";
import { Wall } from "../core/models/Wall";

/**
 * Collision band width for a wall segment, in world px.
 *
 * The band is centred on the wall's own base line (see segmentToPolygon), so
 * half of it sits on the floor side and that half is dead space nothing can
 * enter: at 20 it kept furniture and avatars a visible 10px off every wall,
 * and doubled for hidden walls that was 20px. Reported as "collision happens
 * too early, I should be able to push things right up against the wall".
 *
 * 8 leaves a 4px inside margin — about a pixel on screen once the isometric
 * foreshortening is applied, so a piece reads as touching the wall — while
 * still being wider than a single movement step (GameCore.MOVE_INTERVAL
 * advances the avatar by moveSpeed = 5px at most), so nothing can step over
 * a band between two collision checks.
 */
const WALL_THICKNESS = 8;

export interface AABB {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Calcule l’AABB (axe‐aligned bounding box) d’un polygone donné.
 */
export function getAABB(points: Point[]): AABB {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

/**
 * Teste le chevauchement de deux AABB.
 */
export function aabbOverlap(a: AABB, b: AABB): boolean {
  return !(
    a.maxX < b.minX ||
    b.maxX < a.minX ||
    a.maxY < b.minY ||
    b.maxY < a.minY
  );
}

/**
 * Projet d’un polygone sur un axe (vecteur), renvoie l’intervalle [min, max].
 */
export function project(points: Point[], axis: Point): [number, number] {
  const dots = points.map(p => p.x * axis.x + p.y * axis.y);
  return [Math.min(...dots), Math.max(...dots)];
}

/**
 * Retourne true si deux intervalles [minA,maxA] et [minB,maxB] se chevauchent.
 */
export function overlapInterval(a: [number, number], b: [number, number]): boolean {
  return !(a[1] < b[0] || b[1] < a[0]);
}

/**
 * Test SAT (Separating Axis Theorem) pour deux polygones convexes.
 * Renvoie false dès qu’un axe de séparation est trouvé.
 */
export function polygonsIntersect(polyA: Point[], polyB: Point[]): boolean {
  // On teste tous les axes normaux de chaque arête de A et B
  const polygons = [polyA, polyB];
  for (const pts of polygons) {
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      // vecteur arête
      const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
      // axe normal
      const axis = { x: -edge.y, y: edge.x };

      const projA = project(polyA, axis);
      const projB = project(polyB, axis);
      if (!overlapInterval(projA, projB)) {
        // axe de séparation trouvé
        return false;
      }
    }
  }
  // aucun axe de séparation => collision
  return true;
}

/**
 * Convex hull (monotone chain), returned in counter-clockwise order.
 *
 * `polygonsIntersect` is a SAT test, and SAT only holds if the polygon's
 * points are given in hull order: it derives its candidate separating axes
 * from each *consecutive* pair of points. Furniture ground-anchor points come
 * out of the SWF in the artist's marker order ("pt1, pt2, ..." = the order the
 * markers sit at in the Flash timeline's depth list), which is not a winding —
 * on every jardin item checked it is top-right, top-left, bottom-right,
 * bottom-left, i.e. a self-crossing bowtie. Walking that order hands SAT two
 * diagonals instead of the quad's real left and right edges, so those two
 * separating axes are never tested and pieces collide with walls/each other
 * well before they actually touch. Re-ordering here fixes the axes without
 * touching the authored data.
 */
export function convexHull(points: Point[]): Point[] {
  if (points.length < 3) return points;

  const pts = [...points].sort((a, b) => (a.x - b.x) || (a.y - b.y));
  const cross = (o: Point, a: Point, b: Point) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const build = (seq: Point[]): Point[] => {
    const chain: Point[] = [];
    for (const p of seq) {
      while (chain.length >= 2 && cross(chain[chain.length - 2], chain[chain.length - 1], p) <= 0) {
        chain.pop();
      }
      chain.push(p);
    }
    chain.pop(); // shared with the other chain's first point
    return chain;
  };

  const hull = [...build(pts), ...build([...pts].reverse())];
  // Degenerate input (all points collinear) collapses to fewer than 3 points
  // and would make SAT meaningless — keep the original set in that case.
  return hull.length >= 3 ? hull : points;
}

export function isAnyPointOutside(polyA: Point[], polyB: Point[]): boolean {
  // Pour chaque point de polyA, vérifier s'il est à l'extérieur de polyB
  for (const point of polyA) {
    if (!pointInPolygon(point, polyB)) {
      return true;
    }
  }
  return false;
}

/**
 * Détermine si un point est à l'intérieur d'un polygone (algorithme du rayon).
 */
function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// ─── Collision de murs ───────────────────────────────────────────────────────

/**
 * Convertit un segment de mur en polygone de collision (rectangle fin perpendiculaire au mur).
 * @param p1 Point de départ du segment
 * @param p2 Point d'arrivée du segment
 * @param thickness Épaisseur du rectangle de collision (défaut = WALL_THICKNESS)
 */
function segmentToPolygon(p1: Point, p2: Point, thickness: number = WALL_THICKNESS): Point[] {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return [];

  // vecteur normal perpendiculaire
  const nx = -dy / len;
  const ny = dx / len;
  const half = thickness / 2;

  return [
    { x: p1.x + nx * half, y: p1.y + ny * half },
    { x: p2.x + nx * half, y: p2.y + ny * half },
    { x: p2.x - nx * half, y: p2.y - ny * half },
    { x: p1.x - nx * half, y: p1.y - ny * half },
  ];
}

/**
 * Crée les polygones de collision pour tous les murs.
 * - Murs cachés (extérieurs) : épaisseur doublée (barrière plus solide)
 * - Murs visibles (internes) et plinthes : épaisseur normale
 *
 * Les portes NE carvent plus de trou dans le mur : une porte bloque le
 * passage exactement comme le reste du mur (voir Door — elle ne sert plus
 * qu'à afficher le décor de porte et à calculer le point de spawn
 * d'entrée côté serveur, RoomStateService.join/HouseGeometry). Avant ce
 * changement, le mur avait un vrai trou grand ouvert à chaque porte : rien
 * n'empêchait de sortir de la room par là et de continuer indéfiniment dans
 * l'espace non défini au-delà — on n'entre dans une maison qu'en étant
 * téléporté (spawn) au centre de la porte, jamais en marchant à travers
 * elle, donc rien ne doit jamais pouvoir la traverser dans l'autre sens non
 * plus.
 */
export function buildWallPolygons(walls: Wall[]): Point[][] {
  const result: Point[][] = [];

  for (const wall of walls) {
    const thickness = wall.hidden ? WALL_THICKNESS * 2 : WALL_THICKNESS;
    const poly = segmentToPolygon(wall.p1, wall.p2, thickness);
    if (poly.length > 0) result.push(poly);
  }

  return result;
}