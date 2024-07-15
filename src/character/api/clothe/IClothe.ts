import { Sprite } from "pixi.js";

export interface IClothe extends Sprite {
    name: string;
    readonly walking: boolean;
    direction: number;

    walk(): void;
    stopWalk(): void;
}