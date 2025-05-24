import { Container } from "pixi.js";

export interface Drawable {
    draw(): Container;
}