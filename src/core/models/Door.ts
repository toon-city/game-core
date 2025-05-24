import {makeAutoObservable} from 'mobx';
import type {Point} from '../types/Point';

export class Door {
  constructor(
    public p1: Point,
    public p2: Point,
    public p1Top: Point,
    public p2Top: Point,
    public zIndex: number = 0
  ) {
    makeAutoObservable(this);
  }

  setPoints(p1: Point, p2: Point, p1Top: Point, p2Top: Point): void {
    this.p1 = p1;
    this.p2 = p2;
    this.p1Top = p1Top;
    this.p2Top = p2Top;
  }

  setZIndex(zIndex: number): void {
    this.zIndex = zIndex;
  }
}
