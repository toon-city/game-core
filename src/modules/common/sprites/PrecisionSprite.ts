import { Sprite, Texture } from "pixi.js";
import { Point } from "../../../core/types/Point";

export class PrecisionSprite extends Sprite {
  constructor(texture: Texture) {
    super(texture);
  }

  override containsPoint(point: Point) {
    if (
      point.x < 0 ||
      point.y < 0 ||
      point.x > this.texture.width ||
      point.y > this.texture.height
    ) {
      return false;
    }

    const w = this.texture.width;
    const h = this.texture.height;

    const imgSource = this.texture.source.resource;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const px = Math.floor(this.texture.frame.x + point.x);
    const py = Math.floor(this.texture.frame.y + point.y);

    ctx!.drawImage(imgSource, px, py, 1, 1, 0, 0, 1, 1);
    const imageData = ctx!.getImageData(0, 0, 1, 1).data;

    const alpha = imageData[3];

    return alpha != null && alpha > 0;
  }
}