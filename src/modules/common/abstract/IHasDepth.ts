import { IHasDepthCalculator } from "./IHasDepthCalculator";
import { IHasPoints } from "./IHasPoints";

export interface IHasDepth extends IHasPoints {
    get depthCalculator(): IHasDepthCalculator;
}