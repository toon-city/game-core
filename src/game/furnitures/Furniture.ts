import {Container, Sprite, Texture} from 'pixi.js';
import {Drawable} from '../../core/abstract/drawable';

export class Furniture implements Drawable {
  private readonly _container: Container;

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
  }

  draw(): Container {
    this._container.removeChild();

    const url = `${this.texture}_${this.orientation}.png`;
    const texture = Texture.from(url);
    const sprite = new Sprite({texture});
    
    this._container.x = this.x;
    this._container.y = this.y;

    this._container.addChild(sprite);

    return this._container;
  }
}
