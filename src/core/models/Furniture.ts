import { makeAutoObservable } from 'mobx';

export class Furniture {
  constructor(
    public readonly id: number,
    public readonly type: number,
    public x: number,
    public y: number,
    public orientation: number,
    public width: number,
    public height: number,
    public textureBase: string
  ) {
    makeAutoObservable(this);
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  setOrientation(o: number) {
    this.orientation = o;
  }

  setTextureBase(base: string) {
    this.textureBase = base;
  }
}
