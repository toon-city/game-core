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
  /** Set by HouseView.setZoneEditMode — only selectable as a flooring target
   *  while true (mirrors WallView/FurnitureView's editMode gate). */
  private zoneInteractive = false;

  constructor(
    private readonly model: Area,
    /** Called with this area's own zone index on a tap while `interactive`. */
    private readonly onClick?: (zoneIndex: number) => void
  ) {
    super();

    this.texture = Texture.from(model.texture);

    autorun(() => {
      this.texture = Texture.from(this.model.texture);
      this.draw();
    });
  }

  /** Toggle zone-click selection for flooring. */
  setInteractionMode(interactive: boolean): void {
    if (this.zoneInteractive === interactive) return;
    this.zoneInteractive = interactive;
    this.draw();
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

    const dx1 = this.model.maxPoints[1].x - this.model.maxPoints[0].x;
    const dy1 = this.model.maxPoints[1].y - this.model.maxPoints[0].y;
    const len1 = Math.hypot(dx1, dy1);

    const dx2 = this.model.maxPoints[2].x - this.model.maxPoints[1].x;
    const dy2 = this.model.maxPoints[2].y - this.model.maxPoints[1].y;
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

    // Selectable only in zone-edit mode, and only for a real flooring target
    // (Area.zoneIndex is always set today — every Area comes from a floorDef
    // in HouseParser — but the check mirrors WallView's for symmetry and in
    // case that ever changes). Hit-testing uses the mesh's own (rectangular)
    // geometry bounds, not the mask's polygon — a click just outside the
    // floor's actual shape but still inside its bounding mesh can register;
    // acceptable for a click-to-select action, unlike a mis-placed visual.
    const zoneIndex = this.model.zoneIndex;
    if (this.zoneInteractive && zoneIndex !== undefined) {
      mesh.eventMode = 'static';
      mesh.cursor = 'pointer';
      mesh.on('pointertap', (evt) => {
        this.onClick?.(zoneIndex);
        evt.stopPropagation();
      });
    }

    container.addChild(mesh, mask);

    return container;
  }

  draw(): Container {
    this.removeChildren();
    this.addChild(this.createFloorMesh());
    return this;
  }
}
