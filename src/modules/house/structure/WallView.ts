// src/modules/house/structure/AreaView.ts

import {Container, MeshPlane, Texture} from 'pixi.js';
import {Drawable} from '../../../core/abstract/Drawable';
import {Wall} from '../../../core/models/Wall';
import {autorun} from 'mobx';
import {Point} from '../../../core/types/Point';

export interface WallPlaneOptions {
  repeatX?: boolean;
  repeatY?: boolean;
  fitHeight?: boolean;
}

export class WallView extends Container implements Drawable {
  private texture: Texture;

  constructor(private readonly model: Wall) {
    super();

    this.texture = Texture.from(model.texture);

    autorun(() => {
      this.texture = Texture.from(this.model.texture);
      this.draw();
    });
  }

  private createWallPlane(
    texture: Texture,
    p1: Point,
    p2: Point,
    p1Top: Point,
    p2Top: Point,
    options: WallPlaneOptions = {}
  ): MeshPlane {
    const {
      repeatX: enableRepeatX = true,
      repeatY: enableRepeatY = true,
      fitHeight = false,
    } = options;

    texture.source.wrapMode = 'repeat';

    const plane = new MeshPlane({texture, verticesX: 2, verticesY: 2});

    // --- Positions projetées (aPosition) ---
    const posBuffer = plane.geometry.getBuffer('aPosition').data;
    posBuffer[0] = p1.x;
    posBuffer[1] = p1.y;
    posBuffer[2] = p2.x;
    posBuffer[3] = p2.y;
    posBuffer[4] = p1Top.x;
    posBuffer[5] = p1Top.y;
    posBuffer[6] = p2Top.x;
    posBuffer[7] = p2Top.y;
    plane.geometry.getBuffer('aPosition').update();

    // --- Dimensions projetées (écran) ---
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const projectedLength = Math.sqrt(dx * dx + dy * dy);
    const projectedHeight = Math.abs(p1.y - p1Top.y);

    // --- Taille apparente d’un motif à l’écran ---
    const brickScreenWidth = texture.width;
    const brickScreenHeight = texture.height;

    // --- Calcul des répétitions ---
    const repeatX = enableRepeatX ? projectedLength / brickScreenWidth : 1;
    const repeatY =
      !fitHeight || !enableRepeatY ? projectedHeight / brickScreenHeight : 1;

    // --- UVs (aUV) ---
    const uvBuffer = plane.geometry.getBuffer('aUV').data;
    uvBuffer[0] = 0;
    uvBuffer[1] = 0;
    uvBuffer[2] = repeatX;
    uvBuffer[3] = 0;
    uvBuffer[4] = 0;
    uvBuffer[5] = -repeatY;
    uvBuffer[6] = repeatX;
    uvBuffer[7] = -repeatY;
    plane.geometry.getBuffer('aUV').update();

    return plane;
  }

  draw(): Container {
    this.removeChildren();
    if (this.model.hidden) {
      return this;
    }

    const isBaseBoard = this.height == 10;

    this.addChild(
      this.createWallPlane(
        this.texture,
        this.model.p1,
        this.model.p2,
        this.model.p1Top,
        this.model.p2Top,
        {
          repeatX: true,
          repeatY: true,
          fitHeight: isBaseBoard,
        }
      )
    );

    this.zIndex = isBaseBoard ? Math.min(this.model.p1.y, this.model.p2.y) : 0;

    return this;
  }
}
