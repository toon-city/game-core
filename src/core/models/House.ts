import { makeAutoObservable, computed } from 'mobx';
import type { Point } from '../types/Point';
import type { Wall } from './Wall';
import type { Door } from './Door';
import type { Area } from './Area';
import type { Furniture } from './Furniture';
import { project } from '../../utils/project';

export class House {
  walls: Wall[] = [];
  doors: Door[] = [];
  areas: Area[] = [];
  furnitures: Furniture[] = [];
  floorPoints: Point[] = [];

  // raw bounds + offsets, fixés par le parser
  constructor(
    public readonly width: number,
    public readonly depth: number,
    public readonly height: number,
    public minPoint: Point = { x: 0, y: 0 },
    public maxPoint: Point = { x: 0, y: 0 },
    public offsetX = 0,
    public offsetY = 0,
  ) {
    makeAutoObservable(this, {
      maxPoints: computed, // computed property
    });
  }

  /** Les 4 coins projetés, appliquant offset */
  get maxPoints(): Point[] {
    const corners = [
      {x: this.minPoint.x, y: this.minPoint.y},
      {x: this.maxPoint.x, y: this.minPoint.y},
      {x: this.maxPoint.x, y: this.maxPoint.y},
      {x: this.minPoint.x, y: this.maxPoint.y},
    ];

    return corners;
  }

  addWall(w: Wall): void {
    this.walls.push(w);
  }
  removeWall(w: Wall): void {
    this.walls = this.walls.filter(x => x !== w);
  }

  addDoor(d: Door): void {
    this.doors.push(d);
  }
  removeDoor(d: Door): void {
    this.doors = this.doors.filter(x => x !== d);
  }

  addArea(a: Area): void {
    this.areas.push(a);
  }
  removeArea(a: Area): void {
    this.areas = this.areas.filter(x => x !== a);
  }

  addFurniture(f: Furniture): void {
    this.furnitures.push(f);
  }
  removeFurniture(f: Furniture): void {
    this.furnitures = this.furnitures.filter(x => x !== f);
  }

  setFloorPoints(pts: Point[]): void {
    this.floorPoints = pts;
  }

  
  setOffset(offsetX: number, offsetY: number): void {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }
}
