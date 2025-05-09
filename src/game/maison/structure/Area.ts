import {
  buildGeometryFromPath,
  Container,
  Graphics,
  GraphicsPath,
  Mesh,
  Texture,
  WRAP_MODES,
} from 'pixi.js';
import {Drawable} from '../../../core/abstract/drawable';
import {Point} from '../types';

export interface IArea {
  points: Point[];
  texture: Texture;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export class Area implements IArea, Drawable {
  public points: Point[];
  public texture: Texture;
  public minX: number;
  public minY: number;
  public maxX: number;
  public maxY: number;
  private _container: Container;

  get container(): Container {
    return this._container;
  }

  constructor(options: IArea) {
    this.points = options.points;
    this.texture = options.texture;
    this.minX = options.minX;
    this.minY = options.minY;
    this.maxX = options.maxX;
    this.maxY = options.maxY;
    this._container = new Container();
  }

  private createFloorMesh(
    options: {
      repeatX?: boolean;
      repeatY?: boolean;
    } = {repeatX: true, repeatY: true}
  ): Container {
    const container = new Container();

    const {repeatX: enableRepeatX = true, repeatY: enableRepeatY = true} =
      options;

    this.texture.baseTexture.wrapMode = WRAP_MODES.REPEAT;

    const normalPoints = [
      {x: this.minX, y: this.minY},
      {x: this.maxX, y: this.minY},
      {x: this.maxX, y: this.maxY},
      {x: this.minX, y: this.maxY},
    ];

    const path = new GraphicsPath();
    path.moveTo(normalPoints[0].x, normalPoints[0].y);
    normalPoints.forEach((p) => path.lineTo(p.x, p.y));
    path.closePath();

    const mask = new Graphics();
    mask.moveTo(this.points[0].x, this.points[0].y);
    this.points.forEach((p) => mask.lineTo(p.x, p.y));
    mask.closePath();
    mask.fill(0xffffff);

    const geometry = buildGeometryFromPath(path);
    const mesh = new Mesh({geometry, texture: this.texture, x: 0, y: 0});

    const dx1 = normalPoints[1].x - normalPoints[0].x;
    const dy1 = normalPoints[1].y - normalPoints[0].y;
    const len1 = Math.hypot(dx1, dy1);

    const dx2 = normalPoints[2].x - normalPoints[1].x;
    const dy2 = normalPoints[2].y - normalPoints[1].y;
    const len2 = Math.hypot(dx2, dy2);

    const brickW = this.texture.width;
    const brickH = this.texture.height;

    const repeatX = enableRepeatX ? len1 / brickW : 1;
    const repeatY = enableRepeatY ? len2 / brickH : 1;

    const uvBuf = mesh.geometry.getBuffer('aUV').data;

    const initialUV: [number, number][] = [
      [0, 0],
      [repeatX, 0],
      [repeatX, repeatY],
      [0, repeatY],
    ];
    for (let i = 0; i < 4; i++) {
      uvBuf[2 * i] = initialUV[i][0];
      uvBuf[2 * i + 1] = initialUV[i][1];
    }

    const uC = repeatX / 2,
      vC = repeatY / 2;

    for (let i = 0; i < uvBuf.length; i += 2) {
      const u = uvBuf[i] - uC;
      const v = uvBuf[i + 1] - vC;
      uvBuf[i] = u + uC;
      uvBuf[i + 1] = v + vC;
    }

    mesh.geometry.getBuffer('aUV').update();

    mesh.mask = mask;

    container.addChild(mesh, mask);

    return container;
  }

  draw(container: Container): void {
    this._container.removeChildren();
    this._container.addChild(this.createFloorMesh());
    container.addChild(this._container);
  }
}
