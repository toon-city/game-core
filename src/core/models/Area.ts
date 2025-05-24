import { makeAutoObservable } from 'mobx';
import type { Point } from '../types/Point';

export class Area {
  constructor(
    public points: Point[],
    public maxPoints: Point[],
    public texture: string
  ) {
    makeAutoObservable(this);
  }

  setPoints(points: Point[]): void {
    this.points = points;
  }

  setTexture(texture: string): void {
    this.texture = texture;
  }
}
