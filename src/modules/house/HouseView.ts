import { Container } from 'pixi.js';
import { autorun } from 'mobx';
import type { Drawable } from '../../core/abstract/Drawable';
import type { House } from '../../core/models/House';
import { WallView } from './structure/WallView';
import { DoorView } from './structure/DoorView';
import { AreaView } from './structure/AreaView';
import { FurnitureView } from '../furniture/FurnitureView';

export class HouseView extends Container implements Drawable {

  constructor(private readonly model: House) {
    super();
    autorun(() => this.render());
  }

  private render(): void {
    this.removeChildren();

    for (const area of this.model.areas) {
      const view = new AreaView(area);
      console.log('Drawing area', area);
      this.addChild(view.draw());
    }

    for (const wall of this.model.walls) {
      const view = new WallView(wall);
      this.addChild(view.draw());
    }

    for (const door of this.model.doors) {
      const view = new DoorView(door);
      this.addChild(view.draw());
    }

    for (const furn of this.model.furnitures) {
      const view = new FurnitureView(furn);
      this.addChild(view.draw());
    }
  }

  draw(): Container {
    return this;
  }
}
