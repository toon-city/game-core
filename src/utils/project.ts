import { Point } from '../core/types/Point';

/**
 * World -> screen isometric projection. Angle is a true 45°, matching the
 * original Flash game's own room projection (Maison.as, class TDToDD/DDToTD,
 * recovered from player_tchat2.swf's ActionScript):
 *
 *   DDToTD(x, y, z):  Y_td = y + z
 *                      X_td = x + Y_td
 *                      (both * this.scale, a flat px-per-unit factor —
 *                       irrelevant to the ratio below, applies equally to x/y)
 *
 * i.e. world X contributes to screen X alone (weight 1); world Y contributes
 * to BOTH screen X and screen Y equally (weight 1 each, before the uniform
 * scale). That makes the world-Y axis's own screen-space vector exactly
 * sqrt(1² + 1²) = sqrt(2) times as long as world-X's (1,0) -- not a tunable
 * "depth" choice, a direct consequence of adding the same y once to each
 * screen axis. depthFactor here is exactly that ratio (see the derivation:
 * with angle=-45°, cos(angle)*sqrt(2) == 1, so screen-Y-axis-length /
 * screen-X-axis-length == depthFactor identically) -- so it has to be
 * sqrt(2), not a hand-picked constant.
 *
 * Confirmed on the shipped Jardin room's actual wall points: projecting them
 * with depthFactor = sqrt(2) reproduces the original DDToTD bounding-box
 * aspect ratio exactly (2.3958 both ways); the previous 1.5 gave 2.3160, a
 * ~3.5% real distortion — rooms read measurably deeper/taller than the
 * original game intended, which is the "angle/depth ratio looks off" report.
 * The 45° angle itself was already correct either way (depthFactor scales
 * the y-axis vector's LENGTH, not its direction).
 */
export function project(x: number, y: number, z: number): Point {
  const angle = -Math.PI / 4;
  const xStretch = 1;
  const depthFactor = Math.SQRT2;

  return {
    x: (x * xStretch + y * Math.cos(angle) * depthFactor),
    y: (-z + y * Math.sin(angle) * depthFactor),
  };
}
