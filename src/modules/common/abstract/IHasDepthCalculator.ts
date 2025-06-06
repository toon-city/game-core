import { Point } from "../../../core/types/Point";

export interface IHasDepthCalculator {
  getDepthAtPoint(point: Point): number;
  getDepthAtPointClip(points: Point[]): number;
};