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
    public minX = 0,
    public minY = 0,
    public maxX = 0,
    public maxY = 0,
    public offsetX = 0,
    public offsetY = 0,
  ) {
    makeAutoObservable(this, {
      maxPoints: computed, // computed property
    });
  }

  /** Les 4 coins projetés, appliquant offset */
  get maxPoints(): Point[] {
    const corners: Point[] = [
      { x: this.minX, y: this.minY },
      { x: this.maxX, y: this.minY },
      { x: this.maxX, y: this.maxY },
      { x: this.minX, y: this.maxY },
    ];
    return corners.map(p => {
      const proj = project(p.x, p.y, 0);
      return { x: proj.x + this.offsetX, y: proj.y + this.offsetY };
    });
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

  // setters pour min/max/offset si besoin après parsing
  setBounds(minX: number, minY: number, maxX: number, maxY: number): void {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }
  setOffset(offsetX: number, offsetY: number): void {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }
}
