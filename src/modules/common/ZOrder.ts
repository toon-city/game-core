export enum ZPriority {
  WALL = 0,
  FLOOR = 1,
  FURNITURE = 2,
  AVATAR = 3,
  EFFECT = 4
}

export interface ZEntity {
  x?: number;
  y?: number;
  layer?: ZPriority;
  offset?: number;
}

/**
 * Compute a stable z-index for an entity.
 * Combines vertical position (y) and a priority layer to give stable ordering.
 * Higher values = rendered on top.
 */
export function compute(entity: ZEntity): number {
  const y = Math.round((entity.y ?? 0) * 100);
  const layer = (entity.layer ?? ZPriority.FURNITURE) & 0xff;
  const offset = Math.floor((entity.offset ?? 0) & 0xff);

  // Layer has highest significance, then y, then offset
  // Multiply layer to keep large gaps between priorities
  return layer * 1000000 + y * 10 + offset;
}

/**
 * Find an available z-index near the computed value to avoid conflicts
 */
export function findAvailable(baseZIndex: number, existingZIndices: number[]): number {
  let zIndex = baseZIndex;
  const existingSet = new Set(existingZIndices);
  
  while (existingSet.has(Math.round(zIndex))) {
    zIndex += 1;
  }
  
  return Math.round(zIndex);
}