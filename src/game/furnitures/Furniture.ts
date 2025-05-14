import {Container, FederatedPointerEvent, Sprite, Texture } from 'pixi.js';
import {Drawable} from '../../core/abstract/drawable';

export class Furniture implements Drawable {
  private readonly _container: Container;
  private readonly _sprite: Sprite;

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

  draw(): Container {
    this._container.removeChild();
    
    this._container.x = this.x;
    this._container.y = this.y;
    this._container.zIndex = this.y + this._sprite.height;

    this._container.addChild(this._sprite);

    return this._container;
  }
}
