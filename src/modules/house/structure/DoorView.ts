// src/modules/house/structure/AreaView.ts

import {Container, Graphics} from 'pixi.js';
import {Drawable} from '../../../core/abstract/Drawable';
import {autorun} from 'mobx';
import {Door} from '../../../core/models/Door';
import * as ZOrder from '../../common/ZOrder';

export class DoorView extends Container implements Drawable {
  constructor(private readonly model: Door) {
    super();

    // Set consistent z-index for doors (higher than walls)
    this.zIndex = ZOrder.compute({
      x: (model.p1.x + model.p2.x) / 2,
      y: (model.p1.y + model.p2.y) / 2,
      layer: ZOrder.ZPriority.WALL,
      offset: 10 // Slightly above walls
    });

    autorun(() => {
      this.draw();
    });
  }

  draw(): Container {
    this.removeChildren();

    const ep = 2;
    const g = new Graphics();

    // --- Porte noire ---
    g.moveTo(this.model.p1.x, this.model.p1.y);
    g.lineTo(this.model.p2.x, this.model.p2.y);
    g.lineTo(this.model.p2Top.x, this.model.p2Top.y);
    g.lineTo(this.model.p1Top.x, this.model.p1Top.y);
    g.closePath();
    g.fill(0x000000);

    // Dessiner uniquement les contours gauche et droite
    g.setStrokeStyle({width: ep, color: 0x888888});
    g.moveTo(this.model.p1.x, this.model.p1.y);
    g.lineTo(this.model.p1Top.x, this.model.p1Top.y); // Contour gauche
    g.stroke();

    g.moveTo(this.model.p2.x, this.model.p2.y);
    g.lineTo(this.model.p2Top.x, this.model.p2Top.y);
    g.stroke();

    g.moveTo(this.model.p1Top.x, this.model.p1Top.y);
    g.lineTo(this.model.p2Top.x, this.model.p2Top.y);
    g.stroke();

    this.zIndex = 8;
    this.addChild(g);

    return this;
  }
}
