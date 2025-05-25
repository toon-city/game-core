// src/modules/house/structure/AreaView.ts

import {
  buildGeometryFromPath,
  Container,
  Graphics,
  GraphicsPath,
  Mesh,
  Texture,
} from 'pixi.js';
import {Drawable} from '../../../core/abstract/Drawable';
import {Area} from '../../../core/models/Area';
import {autorun} from 'mobx';

export class AreaView extends Container implements Drawable {
  private texture: Texture;

  constructor(private readonly model: Area) {
    super();

    this.texture = Texture.from(model.texture);

    autorun(() => {
      this.texture = Texture.from(this.model.texture);
      this.draw();
    });
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

    const {points, maxPoints} = this.model;
    this.texture.source.wrapMode = 'repeat';

    const path = new GraphicsPath();
    path.moveTo(maxPoints[0].x, maxPoints[0].y);
    maxPoints.forEach((p) => path.lineTo(p.x, p.y));
    path.closePath();

    const mask = new Graphics();
    mask.moveTo(points[0].x, points[0].y);
    points.forEach((p) => mask.lineTo(p.x, p.y));
    mask.closePath();
    mask.fill(0xffffff);

    const geometry = buildGeometryFromPath(path);
    const mesh = new Mesh({geometry, texture: this.texture, x: 0, y: 0});

    const dx1 = maxPoints[1].x - maxPoints[0].x;
    const dy1 = maxPoints[1].y - maxPoints[0].y;
    const len1 = Math.hypot(dx1, dy1);

    const dx2 = maxPoints[2].x - maxPoints[1].x;
    const dy2 = maxPoints[2].y - maxPoints[1].y;
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

  draw(): Container {
    this.removeChildren();
    this.addChild(this.createFloorMesh());
    return this;
  }
}
