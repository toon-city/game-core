import {autorun} from 'mobx';
import {Container, Sprite, Texture, FederatedPointerEvent} from 'pixi.js';
import {Furniture} from '../../core/models/Furniture';
import {Drawable} from '../../core/abstract/Drawable';
import {Point} from '../../core/types/Point';
import {IHasDepth} from '../common/abstract/IHasDepth';
import {IHasDepthCalculator} from '../common/abstract/IHasDepthCalculator';
import { PrecisionSprite } from '../common/sprites/PrecisionSprite';

export class FurnitureView extends Container implements Drawable, IHasDepth {
  public readonly sprite: Sprite;
  private dragging = false;
  private readonly offset = {x: 0, y: 0};
  private readonly dragStartPosition = {x: 0, y: 0};

  private _points: Point[] = [];
  get points(): Point[] {
    return this._points;
  }

  constructor(
    public readonly model: Furniture,
    public readonly depthCalculator: IHasDepthCalculator
  ) {
    super();
    this.sprite = new PrecisionSprite(Texture.EMPTY);
    this.sprite.eventMode = 'static'; // Pour les événements de pointeur
    this.addChild(this.sprite);

    // Réaction automatique aux changements de x, y, orientation ou textureBase
    autorun(() => {
      // 1) Met à jour la texture si besoin
      this.sprite.texture = Texture.from(
        model.base.frameKeys[model.orientation - 1] ?? model.base.frameKeys[0]
      );

      // 2) Met à jour position et zIndex
      this.x = model.x;
      this.y = model.y;

      if (model.base.type == 18) {
        this._points = this.getPoints();
        this.zIndex =
          this.depthCalculator.getDepthAtPointClip(this.points) ??
          model.y + this.sprite.height;
          if (this.dragging && this.depthCalculator.checkCollision(this)) {
            this.alpha = 0.8;
          } else {
            this.alpha = 1;
          }
      } else {
        this.zIndex = 0.1;
      }
    });

    this.sprite.cursor = 'grab';

    this.sprite.on('pointerdown', this.onPointerDown);
    this.sprite.on('pointerup', this.onPointerUp);
    this.sprite.on('pointerupoutside', this.onPointerUp);
  }

  private getPoints(): Point[] {
    let points: Point[] = [];
    const frameKey =
      this.model.base.frameKeys[this.model.orientation - 1] ??
      this.model.base.frameKeys[0];

    if (frameKey) {
      points = (this.model.base.spritesheet.frames[frameKey]?.points ??
        []) as Point[];
    }

    if (points.length === 0) {
      // Si pas de points, on utilise les coins du sprite
      points = [
        {x: 0, y: 0},
        {x: this.sprite.width, y: 0},
        {x: this.sprite.width, y: this.sprite.height},
        {x: 0, y: this.sprite.height},
      ];
    }

    return points.map((point) => ({x: this.x + point.x, y: this.y + point.y}));
  }

  private readonly onPointerDown = (evt: FederatedPointerEvent): void => {
    this.dragging = true;
    this.sprite.cursor = 'grabbing';

    // on souscrit au pointermove sur le stage entier
    const stage = this.parent;
    stage.interactive = true;
    stage.on('pointermove', this.onPointerMove);

    // calcul de l'offset initial
    const pos = evt.getLocalPosition(stage);
    this.offset.x = pos.x - this.x;
    this.offset.y = pos.y - this.y;

    this.dragStartPosition.x = this.x;
    this.dragStartPosition.y = this.y;
  };

  private readonly onPointerMove = (evt: FederatedPointerEvent): void => {
    if (!this.dragging) return;
    const stage = this.parent;
    const pos = evt.getLocalPosition(stage);
    // mise à jour du modèle (MobX notifie la vue)
    this.model.setPosition(pos.x - this.offset.x, pos.y - this.offset.y);
  };

  private readonly onPointerUp = (): void => {
    if (!this.dragging) return;
  
    this.sprite.cursor = 'grab';
    this.dragging = false;
    const stage = this.parent;
    stage.off('pointermove', this.onPointerMove);

    this.alpha = 1;

    if (this.depthCalculator.checkCollision(this)) {
      this.model.setPosition(
        this.dragStartPosition.x,
        this.dragStartPosition.y
      );
    }
  };

  draw(): Container {
    return this;
  }
}
