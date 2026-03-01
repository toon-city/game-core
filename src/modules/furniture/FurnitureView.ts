import { autorun } from 'mobx';
import { Container, FederatedPointerEvent, Sprite, Texture } from 'pixi.js';
import { Furniture } from '../../core/models/Furniture';
import { Drawable } from '../../core/abstract/Drawable';
import { Point } from '../../core/types/Point';
import { IHasDepth } from '../common/abstract/IHasDepth';
import { IHasDepthCalculator } from '../common/abstract/IHasDepthCalculator';
import { PrecisionSprite } from '../common/sprites/PrecisionSprite';
import { FurnitureController } from './FurnitureController';
import * as ZOrder from '../common/ZOrder';

export class FurnitureView extends Container implements Drawable, IHasDepth {
  public readonly sprite: Sprite;
  private _points: Point[] = [];
  private readonly controller: FurnitureController;

  constructor(
    public readonly model: Furniture,
    public readonly depthCalculator: IHasDepthCalculator,
    controller?: FurnitureController
  ) {
    super();
    this.sprite = new PrecisionSprite(Texture.EMPTY);
    this.sprite.eventMode = 'dynamic';
    this.sprite.cursor = 'grab';
    this.addChild(this.sprite);

    // Create controller if not provided (backwards compatibility)
    this.controller = controller || new FurnitureController(
      { addFurniture: () => {}, removeFurniture: () => {} } as any, // Mock house
      depthCalculator
    );

    this.registerPointerEvents();
    autorun(() => this.updateView());
  }

  get points(): Point[] {
    return this._points;
  }

  private updateView(): void {
    this.updateTexture();
    this.updatePosition();
    this.updateDepthAndAppearance();
  }

  private updateTexture(): void {
    const { base, orientation } = this.model;
    const keyIndex = orientation - 1;
    const frameKey = base.frameKeys[keyIndex] ?? base.frameKeys[0];
    this.sprite.texture = Texture.from(frameKey);
  }

  private updatePosition(): void {
    const { x, y } = this.model;
    this.x = x;
    this.y = y;
  }

  private updateDepthAndAppearance(): void {
    const { base } = this.model;

    if (base.type === 18) {
      this._points = this.computePoints();

      // Profondeur isométrique :
      //   - Primaire  : Y MAX des anchor points du sol (bord avant en vue iso)
      //   - Secondaire: X moyen des anchor points (départage gauche/droite,
      //                 cf. ISO_X_WEIGHT dans ZOrder – la gauche est plus profonde)
      const groundMaxY = this._points.length > 0
        ? Math.max(...this._points.map(p => p.y))
        : this.model.y + this.sprite.height;

      const groundAvgX = this._points.length > 0
        ? this._points.reduce((s, p) => s + p.x, 0) / this._points.length
        : this.model.x;

      this.zIndex = ZOrder.compute({
        x: groundAvgX,
        y: groundMaxY,
        layer: ZOrder.ZPriority.SCENE  // même couche que l'avatar
      });
    } else {
      // Éléments de sol : priorité plus basse
      this.zIndex = ZOrder.compute({
        x: this.model.x,
        y: this.model.y,
        layer: ZOrder.ZPriority.FLOOR
      });
    }
  }

  /**
   * Compute ground anchoring points that define the furniture's collision footprint.
   * These points represent the furniture's ground occupation area and are used for:
   * - Collision detection with other furniture and avatars
   * - Z-order calculation based on ground position
   * - Placement validation
   */
  private computePoints(): Point[] {
    const frameKey =
      this.model.base.frameKeys[this.model.orientation - 1] ??
      this.model.base.frameKeys[0];

    // Extract ground anchoring points from furniture sprite data
    const anchorPoints = (this.model.base.spritesheet.frames[frameKey]?.points ?? []) as Point[];
    
    // If no specific anchor points defined, use sprite bounds as fallback
    const groundFootprint = anchorPoints.length
      ? anchorPoints
      : [
          { x: 0, y: this.sprite.height - 10 }, // Front-left ground
          { x: this.sprite.width, y: this.sprite.height - 10 }, // Front-right ground
          { x: this.sprite.width, y: this.sprite.height }, // Back-right ground
          { x: 0, y: this.sprite.height }, // Back-left ground
        ];

    // Transform points to world coordinates
    return groundFootprint.map(({ x, y }) => ({ x: this.x + x, y: this.y + y }));
  }

  /**
   * Get the center point of the ground anchoring area
   * Used for Z-order calculation and positioning
   */
  public getGroundCenter(): Point {
    const points = this.computePoints();
    if (points.length === 0) return { x: this.x, y: this.y };
    
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    
    return {
      x: sumX / points.length,
      y: sumY / points.length
    };
  }

  /**
   * Check if furniture has custom ground anchoring points defined
   */
  public hasCustomAnchorPoints(): boolean {
    const frameKey =
      this.model.base.frameKeys[this.model.orientation - 1] ??
      this.model.base.frameKeys[0];
      
    const anchorPoints = this.model.base.spritesheet.frames[frameKey]?.points;
    return Array.isArray(anchorPoints) && anchorPoints.length > 0;
  }

  private registerPointerEvents(): void {
    this.sprite.on('pointerdown', this.onPointerDown);
    this.sprite.on('rightclick', this.onRightClick);
  }

  private readonly onPointerDown = (evt: FederatedPointerEvent): void => {
    if (this.model.base.type !== 18) return;

    if (this.controller.getDraggedFurniture() && this.controller.getDraggedFurniture() !== this) {
      return;
    }

    // HouseView = espace local des positions du modèle
    const houseView = this.parent;
    if (!houseView) return;

    // Remonter jusqu'à app.stage (racine) qui a eventMode='static' en PIXI v8,
    // seul container qui reçoit pointermove/pointerup même sur zone vide.
    let root = houseView.parent;
    while (root?.parent) root = root.parent;
    if (!root) return;

    const localStart = houseView.toLocal({ x: evt.globalX, y: evt.globalY });
    this.controller.startDrag(this, localStart.x, localStart.y);

    const onPointerMove = (moveEvt: FederatedPointerEvent) => {
      const localPos = houseView.toLocal({ x: moveEvt.globalX, y: moveEvt.globalY });
      this.controller.updateDrag(localPos.x, localPos.y, {
        checkCollisions: true,
        snapToGrid: moveEvt.shiftKey,
        gridSize: 20
      });
    };

    const onPointerUp = () => {
      this.controller.endDrag();
      root.off('pointermove', onPointerMove);
      root.off('pointerup', onPointerUp);
      root.off('pointerupoutside', onPointerUp);
      root.off('pointercancel', onPointerCancel);
    };

    const onPointerCancel = () => {
      this.controller.endDrag(true); // annule → revert à la position initiale
      root.off('pointermove', onPointerMove);
      root.off('pointerup', onPointerUp);
      root.off('pointerupoutside', onPointerUp);
      root.off('pointercancel', onPointerCancel);
    };

    root.on('pointermove', onPointerMove);
    root.on('pointerup', onPointerUp);
    root.on('pointerupoutside', onPointerUp);
    root.on('pointercancel', onPointerCancel);

    evt.stopPropagation();
  };

  private readonly onRightClick = (evt: FederatedPointerEvent): void => {
    if (this.model.base.type !== 18) return;
    
    // Don't rotate if being dragged
    if (this.controller.getDraggedFurniture() === this) return;
    
    const currentOrientation = this.model.orientation;
    const newOrientation = (currentOrientation % 4) + 1;
    this.controller.rotateFurniture(this.model, newOrientation, this);
    
    evt.stopPropagation();
  };

  draw(): Container {
    return this;
  }
}
