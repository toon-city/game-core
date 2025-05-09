import { Container } from "pixi.js";

export interface Drawable {
    get container(): Container;

    draw(): Container;
}