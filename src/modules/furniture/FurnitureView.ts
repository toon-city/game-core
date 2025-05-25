// modules/furniture/FurnitureView.ts
import {autorun} from 'mobx';
import {Container, Sprite, Texture, FederatedPointerEvent} from 'pixi.js';
import { Furniture } from '../../core/models/Furniture';
import { Drawable } from '../../core/abstract/Drawable';

export class FurnitureView extends Container implements Drawable {
  private readonly sprite: Sprite;
  private dragging = false;
  private readonly offset = { x: 0, y: 0 };

  constructor(private readonly model: Furniture) {
    super();
    this.sortableChildren = true;
    this.interactive = true;

    // Sprite vide au départ
    this.sprite = new Sprite(Texture.EMPTY);
    this.addChild(this.sprite);

    // Réaction automatique aux changements de x, y, orientation ou textureBase
    autorun(() => {
      // 1) Met à jour la texture si besoin
      const url = `${model.textureBase}_${model.orientation}.png`;
      this.sprite.texture = Texture.from(url);
      // 2) Met à jour position et zIndex
      this.x = model.x;
      this.y = model.y;
      this.zIndex = model.y + this.sprite.height;
    });

    this.cursor = 'grab';

    this.on('pointerdown', this.onPointerDown);
    this.on('pointerup', this.onPointerUp);
    this.on('pointerupoutside', this.onPointerUp);
  }

  private readonly onPointerDown = (evt: FederatedPointerEvent): void => {
    this.dragging = true;
    this.cursor = 'grabbing';

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
    this.cursor = 'grab';
    this.dragging = false;
    const stage = this.parent;
    // se désabonner du move pour ne pas surcharger
    stage.off('pointermove', this.onPointerMove);
  };

  draw(): Container {
    return this;
  }
}
