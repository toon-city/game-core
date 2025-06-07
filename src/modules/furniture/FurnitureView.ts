import { autorun } from 'mobx';
import { Container, FederatedPointerEvent, Sprite, Texture } from 'pixi.js';
import { Furniture } from '../../core/models/Furniture';
import { Drawable } from '../../core/abstract/Drawable';
import { Point } from '../../core/types/Point';
import { IHasDepth } from '../common/abstract/IHasDepth';
import { IHasDepthCalculator } from '../common/abstract/IHasDepthCalculator';
import { PrecisionSprite } from '../common/sprites/PrecisionSprite';

export class FurnitureView extends Container implements Drawable, IHasDepth {
  public readonly sprite: Sprite;
  private isDragging = false;
  private dragOffset: Point = { x: 0, y: 0 };
  private initialPosition: Point = { x: 0, y: 0 };
  private _points: Point[] = [];

  constructor(
    public readonly model: Furniture,
    public readonly depthCalculator: IHasDepthCalculator
  ) {
    super();
    this.sprite = new PrecisionSprite(Texture.EMPTY);
    this.sprite.eventMode = 'dynamic';
    this.sprite.cursor = 'grab';
    this.addChild(this.sprite);

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
      this.zIndex =
        this.depthCalculator.getDepthAtPointClip(this._points) ??
        this.model.y + this.sprite.height;

      if (this.isDragging) {
        const collision = this.depthCalculator.checkCollision(this);
        this.sprite.cursor = collision ? 'not-allowed' : 'grab';
        this.alpha = collision ? 0.7 : 1;
      } else {
        this.alpha = 1;
      }
    } else {
      this.zIndex = 0.1;
    }
  }

  private computePoints(): Point[] {
    const frameKey =
      this.model.base.frameKeys[this.model.orientation - 1] ??
      this.model.base.frameKeys[0];

    const rawPoints = (this.model.base.spritesheet.frames[frameKey]?.points ?? []) as Point[];
    const bounds = rawPoints.length
      ? rawPoints
      : [
          { x: 0, y: 0 },
          { x: this.sprite.width, y: 0 },
          { x: this.sprite.width, y: this.sprite.height },
          { x: 0, y: this.sprite.height },
        ];

    return bounds.map(({ x, y }) => ({ x: this.x + x, y: this.y + y }));
  }

  private registerPointerEvents(): void {
    this.sprite.on('pointerdown', this.onPointerDown);
    this.sprite.on('pointerup', this.onPointerUp);
    this.sprite.on('pointerupoutside', this.onPointerUp);
  }

  private readonly onPointerDown = (evt: FederatedPointerEvent): void => {
    this.isDragging = true;
    this.sprite.cursor = 'grabbing';

    const stage = this.parent;
    stage.interactive = true;
    stage.on('pointermove', this.onPointerMove);

    const { x, y } = evt.getLocalPosition(stage);
    this.dragOffset = { x: x - this.x, y: y - this.y };
    this.initialPosition = { x: this.x, y: this.y };
  };

  private readonly onPointerMove = (evt: FederatedPointerEvent): void => {
    if (!this.isDragging) return;
    const stage = this.parent;
    const { x, y } = evt.getLocalPosition(stage);
    this.model.setPosition(x - this.dragOffset.x, y - this.dragOffset.y);
  };

  private readonly onPointerUp = (): void => {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.sprite.cursor = 'grab';

    const stage = this.parent;
    stage.off('pointermove', this.onPointerMove);
    this.alpha = 1;

    if (this.depthCalculator.checkCollision(this)) {
      this.model.setPosition(
        this.initialPosition.x,
        this.initialPosition.y
      );
    }
  };

  draw(): Container {
    return this;
  }
}
