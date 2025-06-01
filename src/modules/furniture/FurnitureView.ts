// modules/furniture/FurnitureView.ts
import {autorun} from 'mobx';
import {
  Container,
  Sprite,
  Texture,
  FederatedPointerEvent,
  Point,
} from 'pixi.js';
import {Furniture} from '../../core/models/Furniture';
import {Drawable} from '../../core/abstract/Drawable';

class PrecisionSprite extends Sprite {
  constructor(texture: Texture) {
    super(texture);
    this.interactive = true;
  }

  containsPoint(point: Point) {
    // Convert global coordinates to texture space
    // Ensure coordinates are within texture bounds
    if (
      point.x < 0 ||
      point.y < 0 ||
      point.x > this.texture.width ||
      point.y > this.texture.height
    ) {
      return false;
    }

    const w = this.texture.width;
    const h = this.texture.height;

    const imgSource = this.texture.source.resource;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const px = Math.floor(this.texture.frame.x + point.x);
    const py = Math.floor(this.texture.frame.y + point.y);

    ctx!.drawImage(imgSource, px, py, 1, 1, 0, 0, 1, 1);
    const imageData = ctx!.getImageData(0, 0, 1, 1).data;

    const alpha = imageData[3];

    return alpha != null && alpha > 0;
  }
}

export class FurnitureView extends Container implements Drawable {
  private readonly sprite: Sprite;
  private dragging = false;
  private readonly offset = {x: 0, y: 0};

  constructor(private readonly model: Furniture) {
    super();
    this.sprite = new PrecisionSprite(Texture.EMPTY);
    this.sprite.eventMode = 'static'; // Pour les événements de pointeur
    this.addChild(this.sprite);

    // Réaction automatique aux changements de x, y, orientation ou textureBase
    autorun(() => {
      // 1) Met à jour la texture si besoin
      this.sprite.texture = Texture.from(model.base.frameKeys[model.orientation - 1] ?? model.base.frameKeys[0]);

      // 2) Met à jour position et zIndex
      this.x = model.x;
      this.y = model.y;

      if (model.base.type == 18) {
        this.zIndex = model.y + this.sprite.height;
      } else {
        this.zIndex = 0.1;
      }
    });

    this.sprite.cursor = 'grab';

    this.sprite.on('pointerdown', this.onPointerDown);
    this.sprite.on('pointerup', this.onPointerUp);
    this.sprite.on('pointerupoutside', this.onPointerUp);
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
  };

  private readonly onPointerMove = (evt: FederatedPointerEvent): void => {
    if (!this.dragging) return;
    const stage = this.parent;
    const pos = evt.getLocalPosition(stage);
    // mise à jour du modèle (MobX notifie la vue)
    this.model.setPosition(pos.x - this.offset.x, pos.y - this.offset.y);
  };

  private readonly onPointerUp = (): void => {
    this.sprite.cursor = 'grab';
    this.dragging = false;
    const stage = this.parent;
    // se désabonner du move pour ne pas surcharger
    stage.off('pointermove', this.onPointerMove);
  };

  draw(): Container {
    return this;
  }
}
