import {Container, FederatedPointerEvent, Sprite, Texture } from 'pixi.js';
import {Drawable} from '../../core/abstract/drawable';

export class Furniture implements Drawable {
  private readonly _container: Container;
  private dragging = false;
  private dragOffset = {x: 0, y: 0};
  private _sprite: Sprite;

  get container(): Container {
    return this._container;
  }

  constructor(
    public id: number,
    public type: number,
    public x: number,
    public y: number,
    public orientation: number,
    public width: number,
    public height: number,
    public texture: string
  ) {
    this._container = new Container();
    const url = `${this.texture}_${this.orientation}.png`;
    const spriteTexture = Texture.from(url);
    this._sprite = new Sprite({texture: spriteTexture});
  }

  enableDrag(scene: Container) {
    // this._container.interactive = true;
    // this._container.cursor = 'grab';

    // scene
    //   .on('pointerdown', this.onDragStart.bind(this))
    //   .on('pointerup', this.onDragEnd.bind(this))
    //   // .on('pointerupoutside', this.onDragEnd.bind(this))
    //   .on('pointermove', this.onDragMove.bind(this));
  }

  public onDragStart(e: FederatedPointerEvent) {
    this._container.cursor = 'grabbing';
    this.dragging = true;
    const pos = e.getLocalPosition(this._container.parent);
    this.dragOffset.x = this._container.x - pos.x;
    this.dragOffset.y = this._container.y - pos.y;
  }

  public onDragMove(e: FederatedPointerEvent) {
    if (!this.dragging) return;
    const pos = e.getLocalPosition(this._container.parent);
    this._container.x = pos.x + this.dragOffset.x;
    this._container.y = pos.y + this.dragOffset.y;
    // Mettre à jour les coordonnées du meuble
    this.x = this._container.x;
    this.y = this._container.y;
    this._container.zIndex = this.y + this._sprite.height;
  }

  public onDragEnd() {
    this._container.cursor = 'grab';
    this.dragging = false;
  }

  draw(): Container {
    this._container.removeChild();
    
    this._container.x = this.x;
    this._container.y = this.y;
    this._container.zIndex = this.y + this._sprite.height;

    this._container.addChild(this._sprite);

    return this._container;
  }
}
