import { Point } from "../core/types/Point";
import { Wall } from "../core/models/Wall";
import { Door } from "../core/models/Door";

const WALL_THICKNESS = 20;
const DOOR_MARGIN = 8;

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
 * Vérifie si un point se trouve sur un segment [A, B] avec une tolérance.
 */
function pointOnSegment(p: Point, a: Point, b: Point, tol = 4): boolean {
  const len2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y) <= tol;

  const t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / len2;
  if (t < 0 || t > 1) return false;

  const px = a.x + t * (b.x - a.x);
  const py = a.y + t * (b.y - a.y);
  return Math.hypot(p.x - px, p.y - py) <= tol;
}

/**
 * Crée les polygones de collision pour tous les murs (en tenant compte des ouvertures de portes).
 * - Murs cachés (extérieurs) : épaisseur doublée (barrière plus solide)
 * - Murs visibles (internes) et plinthes : épaisseur normale
 */
export function buildWallPolygons(walls: Wall[], doors: Door[]): Point[][] {
  const result: Point[][] = [];

  for (const wall of walls) {
    const thickness = wall.hidden ? WALL_THICKNESS * 2 : WALL_THICKNESS;

    // Portes situées sur ce mur
    const wallDoors = doors.filter(
      (d) =>
        pointOnSegment(d.p1, wall.p1, wall.p2) &&
        pointOnSegment(d.p2, wall.p1, wall.p2)
    );

    if (wallDoors.length === 0) {
      const poly = segmentToPolygon(wall.p1, wall.p2, thickness);
      if (poly.length > 0) result.push(poly);
      continue;
    }

    // Trier les portes par position le long du mur
    const dx = wall.p2.x - wall.p1.x;
    const dy = wall.p2.y - wall.p1.y;
    const len2 = dx * dx + dy * dy;
    const getT = (p: Point) =>
      ((p.x - wall.p1.x) * dx + (p.y - wall.p1.y) * dy) / len2;

    wallDoors.sort((a, b) => getT(a.p1) - getT(b.p1));

    // Construire les segments autour des ouvertures de porte
    const nx = dx / Math.sqrt(len2);
    const ny = dy / Math.sqrt(len2);

    let cursor: Point = wall.p1;
    for (const door of wallDoors) {
      const d1: Point = {
        x: door.p1.x - nx * DOOR_MARGIN,
        y: door.p1.y - ny * DOOR_MARGIN,
      };
      if (Math.hypot(d1.x - cursor.x, d1.y - cursor.y) > 1) {
        const seg = segmentToPolygon(cursor, d1, thickness);
        if (seg.length > 0) result.push(seg);
      }
      cursor = {
        x: door.p2.x + nx * DOOR_MARGIN,
        y: door.p2.y + ny * DOOR_MARGIN,
      };
    }

    // Segment après la dernière porte
    if (Math.hypot(wall.p2.x - cursor.x, wall.p2.y - cursor.y) > 1) {
      const seg = segmentToPolygon(cursor, wall.p2, thickness);
      if (seg.length > 0) result.push(seg);
    }
  }

  return result;
}