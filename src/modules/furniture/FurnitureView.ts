// modules/furniture/FurnitureView.ts
import {autorun} from 'mobx';
import {Container, Sprite, Texture, FederatedPointerEvent} from 'pixi.js';
import { Furniture } from '../../core/models/Furniture';

export class FurnitureView extends Container {
  private readonly sprite: Sprite;

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

    // (Optionnel) Drag & drop simple
    this.on('pointerdown', this.onDragStart)
      .on('pointermove', this.onDragMove)
      .on('pointerup', this.onDragEnd)
      .on('pointerupoutside', this.onDragEnd);
  }

  private dragging = false;
  private readonly offset = {x: 0, y: 0};

  private onDragStart(event: FederatedPointerEvent) {
    this.dragging = true;
    const pos = event.data.getLocalPosition(this.parent);
    this.offset.x = pos.x - this.x;
    this.offset.y = pos.y - this.y;
  }

  private onDragMove(event: FederatedPointerEvent) {
    if (!this.dragging) return;
    const pos = event.data.getLocalPosition(this.parent);
    // On met à jour le modèle, MobX notifie automatiquement la vue
    this.model.setPosition(pos.x - this.offset.x, pos.y - this.offset.y);
  }

  private onDragEnd() {
    this.dragging = false;
  }

  // Pour l’interface Drawable
  draw(): Container {
    return this;
  }
}
