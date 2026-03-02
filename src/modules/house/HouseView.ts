import {Container} from 'pixi.js';
import type {Drawable} from '../../core/abstract/Drawable';
import type {House} from '../../core/models/House';
import {WallView} from './structure/WallView';
import {DoorView} from './structure/DoorView';
import {AreaView} from './structure/AreaView';
import {FurnitureView} from '../furniture/FurnitureView';
import {FurnitureController} from '../furniture/FurnitureController';
import {Point} from '../../core/types/Point';
import {IHasDepthCalculator} from '../common/abstract/IHasDepthCalculator';
import {aabbOverlap, buildWallPolygons, getAABB, polygonsIntersect} from '../../utils/collision';
import { Avatar } from '../../game/avatar/Avatar';
import * as ZOrder from '../common/ZOrder';
import { GameEvents } from '../../GameEvents';

export class HouseView
  extends Container
  implements Drawable, IHasDepthCalculator
{
  private readonly maxPoints: Point[] = [];
  private readonly furnitureController: FurnitureController;
  private wallPolygons: Point[][] = [];
  private wallViews: WallView[] = [];
  private doorViews: DoorView[] = [];
  private _editMode = false;

  constructor(
    private readonly model: House,
    private readonly events?: GameEvents,
  ) {
    super();
    this.sortableChildren = true;
    this.maxPoints = model.maxPoints;
    this.furnitureController = new FurnitureController(model, this, events);
    this.render();
    this.wallPolygons = buildWallPolygons(model.walls, model.doors);
  }

  private render(): void {
    // Clean up previous wall/door views (stops their autorun)
    for (const wv of this.wallViews) wv.destroy();
    for (const dv of this.doorViews) dv.destroy();
    this.wallViews = [];
    this.doorViews = [];
    this.removeChildren();

    for (const area of this.model.areas) {
      const view = new AreaView(area);
      this.addChild(view.draw());
    }

    for (const wall of this.model.walls) {
      const hasDoor = this.model.doors.some(d => {
        // La porte est sur ce mur si ses points bas sont colinéaires au segment p1→p2
        const dx = wall.p2.x - wall.p1.x;
        const dy = wall.p2.y - wall.p1.y;
        const len2 = dx * dx + dy * dy;
        if (len2 === 0) return false;
        const check = (p: {x: number; y: number}) => {
          const t = ((p.x - wall.p1.x) * dx + (p.y - wall.p1.y) * dy) / len2;
          if (t < -0.05 || t > 1.05) return false;
          const px = wall.p1.x + t * dx;
          const py = wall.p1.y + t * dy;
          return Math.hypot(p.x - px, p.y - py) < 10;
        };
        return check(d.p1) && check(d.p2);
      });
      const view = new WallView(wall);
      view.addToContainer(this, hasDoor);
      this.wallViews.push(view);
    }

    for (const door of this.model.doors) {
      const view = new DoorView(door);
      view.addToContainer(this);
      this.doorViews.push(view);
    }

    for (const furn of this.model.furnitures) {
      const view = new FurnitureView(furn, this, this.furnitureController);
      this.addChild(view.draw());
    }
  }

  draw(): Container {
    return this;
  }

  // ─── Edit mode ──────────────────────────────────────────────────────────────

  /**
   * Enable or disable furniture drag & drop.
   * When edit mode is OFF the furniture sprites no longer receive pointer events.
   */
  setEditMode(enabled: boolean): void {
    this._editMode = enabled;

    for (const child of this.children) {
      if (child instanceof FurnitureView) {
        child.sprite.eventMode = enabled ? 'dynamic' : 'none';
        child.sprite.cursor    = enabled ? 'grab'    : 'default';
      }
    }

    this.events?.emit('editmode:changed', { enabled });
  }

  get editMode(): boolean {
    return this._editMode;
  }

  /** Expose the shared controller for programmatic furniture manipulation */
  getFurnitureController(): FurnitureController {
    return this.furnitureController;
  }

  public getDepthAtPointClip(points: Point[]): number {
    if (points.length === 0) return 0;

    // Profondeur isométrique de l'avatar :
    //   - Y MAX des pieds (bord avant en vue iso) → profondeur principale
    //   - X moyen → fine correction gauche/droite (ISO_X_WEIGHT)
    //   - offset: 1 → l'avatar gagne uniquement quand sa profondeur est
    //     EXACTEMENT égale à celle d'un meuble (ex-æquo)
    const maxY = Math.max(...points.map(p => p.y));
    const avgX = points.reduce((s, p) => s + p.x, 0) / points.length;
    // +0.5 px de biais identique à Avatar.updateZIndex pour rester cohérent
    return ZOrder.compute({
      x: avgX,
      y: maxY + 0.5,
      layer: ZOrder.ZPriority.SCENE,
      offset: 3  // avatar : toujours devant porte(2), plinthe(1), mur(0)
    });
  }

  public getDepthAtPoint(point: Point): number {
    return ZOrder.compute({
      x: point.x,
      y: point.y,
      layer: ZOrder.ZPriority.SCENE
    });
  }

  public checkCollision(object: FurnitureView | Avatar, points: Point[] | null = null): boolean {
    const polyA = points ?? object.points;
    const aabbA = getAABB(polyA);

    // ─── Vérification des collisions avec les murs et plinthes ────────────────
    for (const wallPoly of this.wallPolygons) {
      const aabbW = getAABB(wallPoly);
      if (!aabbOverlap(aabbA, aabbW)) continue;
      if (polygonsIntersect(polyA, wallPoly)) return true;
    }

    // ─── Vérification des collisions avec les meubles bloquants ───────────────
    for (const child of this.children) {
      if (object === child) continue;

      if (child instanceof FurnitureView) {
        if (child.model.base.type !== 18) continue;

        const polyB = child.points;
        const aabbB = getAABB(polyB);

        if (!aabbOverlap(aabbA, aabbB)) continue;
        if (polygonsIntersect(polyA, polyB)) return true;
      }
    }

    return false;
  }
}
