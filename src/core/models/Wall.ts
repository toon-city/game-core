import {makeAutoObservable} from 'mobx';
import type {Point} from '../types/Point';

export class Wall {
  constructor(
    public p1: Point,
    public p2: Point,
    public p1Top: Point,
    public p2Top: Point,
    public texture: string,
    public hidden: boolean = false,
    public isBaseBoard: boolean = false,
    /**
     * Index into house_data.walls[] this wall was built from — the "zone
     * index" wallpaper is applied/removed against (TextureStateService,
     * HouseGeometry). Undefined for a baseboard/plinthe (HouseParser builds
     * one from the same wallDef, h>10 case) and for a hidden wall: neither
     * is a real, independently-selectable wallpaper target — a baseboard
     * changing color with the wall above it isn't wallpaper's job, and a
     * hidden wall is never drawn at all.
     */
    public zoneIndex?: number
  ) {
    // Captured once, before `texture` can be overridden by wallpaper — see
    // resetTexture().
    this.defaultTexture = texture;
    makeAutoObservable(this);
  }

  /** What this wall renders with absent any applied wallpaper. */
  public readonly defaultTexture: string;

  setPoints(p1: Point, p2: Point, p1Top: Point, p2Top: Point): void {
    this.p1 = p1;
    this.p2 = p2;
    this.p1Top = p1Top;
    this.p2Top = p2Top;
  }

  setTexture(texture: string): void {
    this.texture = texture;
  }

  /** Back to the base/plinthe texture — TextureStateService's "remove" echo. */
  resetTexture(): void {
    this.texture = this.defaultTexture;
  }
}
