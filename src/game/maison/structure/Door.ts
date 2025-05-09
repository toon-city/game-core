import { Graphics } from "pixi.js";
import { Point } from "../types";

export class Door {
  constructor(
    public p1: Point,
    public p2: Point,
    public p1Top: Point,
    public p2Top: Point
  ) {}

  draw(graphics: Graphics) {
    const ep = 2;
    const g = new Graphics();

    // --- Porte noire ---
    g.moveTo(this.p1.x, this.p1.y);
    g.lineTo(this.p2.x, this.p2.y);
    g.lineTo(this.p2Top.x, this.p2Top.y);
    g.lineTo(this.p1Top.x, this.p1Top.y);
    g.closePath();
    g.fill(0x000000);

    // Dessiner uniquement les contours gauche et droite
    g.setStrokeStyle({width: ep, color: 0x888888});
    g.moveTo(this.p1.x, this.p1.y);
    g.lineTo(this.p1Top.x, this.p1Top.y); // Contour gauche
    g.stroke();

    g.moveTo(this.p2.x, this.p2.y);
    g.lineTo(this.p2Top.x, this.p2Top.y);
    g.stroke();

    g.moveTo(this.p1Top.x, this.p1Top.y);
    g.lineTo(this.p2Top.x, this.p2Top.y);
    g.stroke();

    graphics.addChild(g);
  }
}