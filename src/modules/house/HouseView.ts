import {Container} from 'pixi.js';
import type {Drawable} from '../../core/abstract/Drawable';
import type {House} from '../../core/models/House';
import {WallView} from './structure/WallView';
import {DoorView} from './structure/DoorView';
import {AreaView} from './structure/AreaView';
import {FurnitureView} from '../furniture/FurnitureView';
import {Point} from '../../core/types/Point';
import {IHasDepthCalculator} from '../common/abstract/IHasDepthCalculator';
import {aabbOverlap, getAABB, polygonsIntersect} from '../../utils/collision';
import { Avatar } from '../../game/avatar/Avatar';
import * as ZOrder from '../common/ZOrder';

export class HouseView
  extends Container
  implements Drawable, IHasDepthCalculator
{
  private readonly maxPoints: Point[] = [];

  constructor(private readonly model: House) {
    super();
    this.maxPoints = model.maxPoints;
    this.render();
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
    if (points.length === 0) return 0;

    // Calculate average position
    const avgX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

    const baseZIndex = ZOrder.compute({
      x: avgX,
      y: avgY,
      layer: ZOrder.ZPriority.FURNITURE
    });

    // Find available z-index to avoid conflicts
    const existingZIndices = this.children.map(child => (child as any).zIndex || 0);
    return ZOrder.findAvailable(baseZIndex, existingZIndices);
  }

  public getDepthAtPoint(point: Point): number {
    const baseZIndex = ZOrder.compute({
      x: point.x,
      y: point.y,
      layer: ZOrder.ZPriority.FURNITURE
    });

    const existingZIndices = this.children.map(child => (child as any).zIndex || 0);
    return ZOrder.findAvailable(baseZIndex, existingZIndices);
  }

  public checkCollision(object: FurnitureView | Avatar, points: Point[] | null = null): boolean {
    const polyA = points ?? object.points;

    for (const child of this.children) {
      if (object === child) {
        continue;
      }

      if (child instanceof FurnitureView) {
        if (child.model.base.type !== 18) {
          continue;
        }

        const polyB = child.points;

        const aabbA = getAABB(polyA);
        const aabbB = getAABB(polyB);

        if (!aabbOverlap(aabbA, aabbB)) {
          // Pas de chevauchement AABB, pas de collision (trop éloignés)
          continue;
        }

        if (polygonsIntersect(polyA, polyB)) {
          return true;
        }
      }
    }

    return false;
  }
}
