import { Sprite } from "pixi.js";

export interface IBodyPart extends Sprite {
    readonly walking: boolean;
    readonly bdPartId: string;
    readonly direction: number;

    /**
     * Change the skin color.
     *
     * @param tint 
     */
    setTint(tint: number): void;

    walk(): void;
    stopWalk(): void;
}