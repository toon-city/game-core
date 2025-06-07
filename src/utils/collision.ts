import { Point } from "../core/types/Point";

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