import {Container, Graphics} from 'pixi.js';
import {autorun} from 'mobx';
import type {Drawable} from '../../core/abstract/Drawable';
import type {House} from '../../core/models/House';
import {WallView} from './structure/WallView';
import {DoorView} from './structure/DoorView';
import {AreaView} from './structure/AreaView';
import {FurnitureView} from '../furniture/FurnitureView';
import {Point} from '../../core/types/Point';

export class HouseView extends Container implements Drawable {
  private maxPoints: Point[] = [];

  constructor(private readonly model: House) {
    super();
    autorun(() => {
      this.maxPoints = this.model.maxPoints;
      this.render();
    });
  }

  private render(): void {
    this.removeChildren();

    for (const area of this.model.areas) {
      const view = new AreaView(area);
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
      const view = new FurnitureView(furn, this);
      this.addChild(view.draw());
    }
  }

  draw(): Container {
    return this;
  }

  public getDepthAtPointClip(points: Point[]): number {
    let zIndex = 0;

    for (const point of points) {
      zIndex += this.getDepthAtPoint(point);
    }

    const divider = points.length > 1 ? points.length - 1 : 1;
    for (zIndex = Math.round(zIndex / divider); this.children.some(child => (child as any).zIndex === Math.round(zIndex)); ++zIndex);

    console.log(zIndex);
    return zIndex;
  }

  public getDepthAtPoint(point: Point): number {
    const minPoint = this.maxPoints[0];
    const maxPoint = this.maxPoints[2];
    const deltaX = point.x - minPoint.x;
    const deltaY = point.y - minPoint.y;
    const width = maxPoint.x - minPoint.x;
    let zIndex = (deltaX * 2 + deltaY * 7) * width + deltaY;
    zIndex = zIndex / 10;
    if (zIndex < 0) {
      return 0;
    }


    for (zIndex = Math.round(zIndex); this.children.some(child => (child as any).zIndex === Math.round(zIndex)); ++zIndex);

    return zIndex;
  }
}
