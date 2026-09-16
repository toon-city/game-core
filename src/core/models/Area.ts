import { makeAutoObservable } from 'mobx';
import type { Point } from '../types/Point';

export class Area {
  constructor(
    public points: Point[],
    public maxPoints: Point[],
    public texture: string,
    /** Index into house_data.floors[] this area was built from — the "zone
     *  index" flooring is applied/removed against (TextureStateService,
     *  HouseGeometry). */
    public zoneIndex?: number
  ) {
    // Captured once, before `texture` can be overridden by flooring — see resetTexture().
    this.defaultTexture = texture;
    makeAutoObservable(this);
  }

  /** What this floor area renders with absent any applied flooring. */
  public readonly defaultTexture: string;

  setPoints(points: Point[]): void {
    this.points = points;
  }

  setTexture(texture: string): void {
    this.texture = texture;
  }

  /** Back to the base floor texture — TextureStateService's "remove" echo. */
  resetTexture(): void {
    this.texture = this.defaultTexture;
  }
}
