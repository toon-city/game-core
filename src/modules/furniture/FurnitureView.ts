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
  private controller: FurnitureController;

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
      
      // Use ZOrder utility for stable z-index calculation
      const baseZIndex = ZOrder.compute({
        x: this.model.x,
        y: this.model.y,
        layer: ZOrder.ZPriority.FURNITURE
      });
      
      this.zIndex = baseZIndex;
    } else {
      // Floor elements get lower priority
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
    if (this.model.base.type !== 18) return; // Only allow dragging furniture, not floors
    
    // Check if another furniture is already being dragged
    if (this.controller.getDraggedFurniture() && this.controller.getDraggedFurniture() !== this) {
      return; // Don't allow multiple drags
    }
    
    this.controller.startDrag(this, evt.globalX, evt.globalY);
    
    const stage = this.parent?.parent; // Get stage through parent hierarchy
    if (!stage) return;
    
    const onPointerMove = (evt: FederatedPointerEvent) => {
      this.controller.updateDrag(evt.globalX, evt.globalY, {
        checkCollisions: true,
        snapToGrid: evt.shiftKey,
        gridSize: 20
      });
    };
    
    const onPointerUp = () => {
      const result = this.controller.endDrag();
      if (!result.success) {
        console.log('Drag failed:', result.message);
      }
      
      // Clean up listeners
      stage.off('pointermove', onPointerMove);
      stage.off('pointerup', onPointerUp);
      stage.off('pointerupoutside', onPointerUp);
    };
    
    // Use stage for reliable event capture
    stage.on('pointermove', onPointerMove);
    stage.on('pointerup', onPointerUp);
    stage.on('pointerupoutside', onPointerUp);
    
    evt.stopPropagation();
  };

  private readonly onRightClick = (evt: FederatedPointerEvent): void => {
    if (this.model.base.type !== 18) return;
    
    // Don't rotate if being dragged
    if (this.controller.getDraggedFurniture() === this) return;
    
    const currentOrientation = this.model.orientation;
    const newOrientation = (currentOrientation % 4) + 1;
    this.controller.rotateFurniture(this.model, newOrientation);
    
    evt.stopPropagation();
  };

  draw(): Container {
    return this;
  }
}
