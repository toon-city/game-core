import { makeAutoObservable } from 'mobx';
import { FurnitureBase } from './FurnitureBase';

export class Furniture {
  constructor(
    public readonly id: number,
    public base: FurnitureBase,
    public x: number,
    public y: number,
    public orientation: number,
    public width: number,
    public height: number,
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
}
