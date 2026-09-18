import { autorun } from 'mobx';
import { Container, FederatedPointerEvent, Sprite, Texture } from 'pixi.js';
import { Furniture } from '../../core/models/Furniture';
import { Drawable } from '../../core/abstract/Drawable';
import { Point } from '../../core/types/Point';
import { convexHull } from '../../utils/collision';
import { IHasDepth } from '../common/abstract/IHasDepth';
import { IHasDepthCalculator } from '../common/abstract/IHasDepthCalculator';
import { PrecisionAnimatedSprite, PrecisionSprite } from '../common/sprites/PrecisionSprite';
import { FurnitureController } from './FurnitureController';
import * as ZOrder from '../common/ZOrder';

export class FurnitureView extends Container implements Drawable, IHasDepth {
  public readonly sprite: Sprite;
  private _points: Point[] = [];
  private readonly controller: FurnitureController;
  /** Set by HouseView (setEditMode / spawnFurnitureView) — drag+rotate own the
   *  interaction while true, a plain click opens the preview panel while false. */
  private editMode = false;

  constructor(
    public readonly model: Furniture,
    public readonly depthCalculator: IHasDepthCalculator,
    controller?: FurnitureController
  ) {
    super();
    // An item whose art is a running MovieClip (dancefloor's light cycle)
    // needs an AnimatedSprite; everything else stays a plain Sprite. Decided
    // once, from the sheet, because a piece can't gain or lose its animation
    // by being rotated.
    this.sprite = model.base.isAnimated
      ? new PrecisionAnimatedSprite([Texture.EMPTY])
      : new PrecisionSprite(Texture.EMPTY);
    // Left inert until HouseView calls setInteractionMode() right after
    // construction (setEditMode's loop, or spawnFurnitureView for a piece
    // placed live) — no flash of the wrong cursor/interactivity.
    this.sprite.eventMode = 'none';
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
    const frames = base.framesFor(orientation);
    if (frames.length === 0) return;

    if (this.sprite instanceof PrecisionAnimatedSprite) {
      // Reassigning `textures` stops playback (PIXI calls gotoAndStop
      // internally), so restart it — otherwise the piece animates until the
      // first time anyone rotates it and then freezes.
      this.sprite.textures = frames.map(key => Texture.from(key));
      this.sprite.animationSpeed = base.animationFps / 60;
      this.sprite.loop = true;
      this.sprite.play();
      return;
    }

    this.sprite.texture = Texture.from(frames[0]);
  }

  private updatePosition(): void {
    const { x, y } = this.model;
    this.x = x;
    this.y = y;
  }

  private updateDepthAndAppearance(): void {
    const { base } = this.model;
    // Ground footprint, for drag/collision/selection — generic sprite-bounds
    // math (computePoints), not type-specific, so this now runs for every
    // placed piece (was type===18-only, which meant a type 19/20 piece like
    // Dancefloor had NO footprint at all once made interactive below).
    this._points = this.computePoints();

    if (base.type === 18) {
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
        layer: ZOrder.ZPriority.SCENE,
        offset: 3  // meuble : même priorité que l'avatar, toujours devant la porte(2)
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
    const frameKey = this.model.base.framesFor(this.model.orientation)[0];

    // Extract ground anchoring points from furniture sprite data. Authored
    // in raw atlas-pixel units by swf_to_furniture.py (same convention as
    // the standard "frame" rect in a TexturePacker-style sheet) -- but
    // unlike "frame", PixiJS has no idea "points" exists, so nothing
    // normalizes it by the sheet's "scale" the way frame/texture sizing
    // gets normalized automatically (confirmed live: this.sprite.width read
    // 220.5 for a frame whose raw "frame".w is 441, i.e. already /2 for a
    // scale:"2" sheet -- the sprite is resolution-independent, "points"
    // was not, so world-space collision/selection footprints came out ~2x
    // too big and offset from the visible sprite). Divide by the same
    // scale before using them, so a "points" value matches the sprite's
    // own already-normalized coordinate space.
    const scale = Number(this.model.base.spritesheet.meta?.scale) || 1;
    const rawAnchorPoints = (this.model.base.spritesheet.frames[frameKey]?.points ?? []) as Point[];
    const anchorPoints = rawAnchorPoints.map(({ x, y }) => ({ x: x / scale, y: y / scale }));

    // If no specific anchor points defined, use sprite bounds as fallback
    const groundFootprint = anchorPoints.length
      ? anchorPoints
      : [
          { x: 0, y: this.sprite.height - 10 }, // Front-left ground
          { x: this.sprite.width, y: this.sprite.height - 10 }, // Front-right ground
          { x: this.sprite.width, y: this.sprite.height }, // Back-right ground
          { x: 0, y: this.sprite.height }, // Back-left ground
        ];

    // Transform points to world coordinates, in hull order — see convexHull's
    // own comment for why the authored marker order can't be used as-is.
    return convexHull(groundFootprint.map(({ x, y }) => ({ x: this.x + x, y: this.y + y })));
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
    const frameKey = this.model.base.framesFor(this.model.orientation)[0];
    const anchorPoints = this.model.base.spritesheet.frames[frameKey]?.points;
    return Array.isArray(anchorPoints) && anchorPoints.length > 0;
  }

  /**
   * Interactive for every placed piece regardless of STYPE (18/19/20) — a
   * FurnitureView only ever exists for a genuine placed Furniture (x/y/
   * orientation in user_items, going through FurnitureStateService), never
   * for an actual wall/floor TEXTURE (a separate TextureStateService/
   * TextureView path entirely) — so there was never a real reason to
   * exclude type 19/20 here. Confirmed via Dancefloor (STYPE 20, sub_type
   * FLOOR): a real placed piece with its own x/y/orientation, reported as
   * unclickable/undraggable despite behaving exactly like any other
   * furniture server-side. Edit mode picks which gesture a click means:
   * drag+rotate while editing, a plain preview-panel tap otherwise — never
   * both, so this also gates onPointerDown/onRightClick below.
   */
  public setInteractionMode(editMode: boolean): void {
    this.editMode = editMode;
    this.sprite.eventMode = 'dynamic';
    this.sprite.cursor = editMode ? 'grab' : 'pointer';
  }

  private registerPointerEvents(): void {
    this.sprite.on('pointerdown', this.onPointerDown);
    this.sprite.on('rightclick', this.onRightClick);
    this.sprite.on('pointertap', this.onPointerTap);
  }

  private readonly onPointerTap = (evt: FederatedPointerEvent): void => {
    if (this.editMode) return;
    this.controller.emitFurnitureClick(this);
    evt.stopPropagation();
  };

  private readonly onPointerDown = (evt: FederatedPointerEvent): void => {
    if (!this.editMode) return;

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
      const result = this.controller.endDrag();
      // Covers both an actual move/placement AND a plain click that never
      // moved (startDrag/endDrag still ran either way) — the preview panel
      // should track "the last piece placed/moved/clicked" while editing,
      // not just outside edit mode (that path is onPointerTap below). Only
      // for a result endDrag actually accepted — a drop rejected outright
      // (invalid spot, nothing valid to fall back to) has nothing worth
      // previewing.
      if (result.success) this.controller.emitFurnitureClick(this);
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
    if (!this.editMode) return;

    // Don't rotate if being dragged
    if (this.controller.getDraggedFurniture() === this) return;
    
    const currentOrientation = this.model.orientation;
    const newOrientation = (currentOrientation % 4) + 1;
    this.controller.rotateFurniture(this.model, newOrientation, this);
    this.controller.emitFurnitureClick(this);

    evt.stopPropagation();
  };

  draw(): Container {
    return this;
  }
}
