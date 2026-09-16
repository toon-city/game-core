import { Sprite, Texture } from "pixi.js";
import { Point } from "../../../core/types/Point";

/**
 * A single 1x1 scratch canvas shared by every PrecisionSprite on the page.
 * containsPoint runs on every pointermove over a piece of furniture, and
 * allocating a frame-sized canvas per call (the previous behaviour) meant one
 * allocation + one GC-able bitmap per mouse event.
 */
let probeCtx: CanvasRenderingContext2D | null = null;

function getProbeCtx(): CanvasRenderingContext2D | null {
  if (!probeCtx) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    probeCtx = canvas.getContext('2d', { willReadFrequently: true });
  }
  return probeCtx;
}

/**
 * Sprite whose hit area is its own opaque pixels rather than its bounding box,
 * so overlapping furniture picks the piece actually under the cursor instead
 * of whichever transparent corner happens to be on top.
 */
export class PrecisionSprite extends Sprite {
  constructor(texture: Texture) {
    super(texture);
  }

  override containsPoint(point: Point) {
    const texture = this.texture;

    // `point` is in the sprite's own local space, which spans the *untrimmed*
    // frame; a trimmed frame's artwork starts at `trim.x/y` inside it.
    const localX = point.x - (texture.trim?.x ?? 0);
    const localY = point.y - (texture.trim?.y ?? 0);
    if (
      localX < 0 ||
      localY < 0 ||
      localX > texture.frame.width ||
      localY > texture.frame.height
    ) {
      return false;
    }

    const ctx = getProbeCtx();
    const imgSource = texture.source.resource;
    if (!ctx || !imgSource) return true;

    // `frame` is already divided by the sheet's resolution (PixiJS normalizes
    // it from `meta.scale` when the spritesheet loads, which is also why the
    // sprite's own width/height are resolution-independent) — but
    // `source.resource` is the raw atlas bitmap, in un-normalized pixels.
    // Scaling back up before sampling is what makes the hit zone line up with
    // what's drawn: without it only the top-left 1/resolution of the frame was
    // ever read, stretched over the whole sprite, so the clickable shape had
    // nothing to do with the visible artwork.
    const resolution = texture.source.resolution || 1;
    const px = Math.floor((texture.frame.x + localX) * resolution);
    const py = Math.floor((texture.frame.y + localY) * resolution);

    try {
      ctx.clearRect(0, 0, 1, 1);
      ctx.drawImage(imgSource as CanvasImageSource, px, py, 1, 1, 0, 0, 1, 1);
      return ctx.getImageData(0, 0, 1, 1).data[3] > 0;
    } catch {
      // A cross-origin atlas taints the canvas and makes getImageData throw.
      // Falling back to the plain bounding box keeps the piece clickable
      // instead of making it silently inert.
      return true;
    }
  }
}
