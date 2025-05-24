import { Point } from '../core/types/Point';

export function project(x: number, y: number, z: number): Point {
  const angle = -Math.PI / 4;
  const xStretch = 1;
  const depthFactor = 1.5; // 1.5

  return {
    x: (x * xStretch + y * Math.cos(angle) * depthFactor),
    y: (-z + y * Math.sin(angle) * depthFactor),
  };
}
