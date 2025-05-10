import {
  Container,
  Graphics,
  Texture,
} from 'pixi.js';
import {project} from './utils/project';
import {Wall} from './structure/Wall';
import {Door} from './structure/Door';
import {Area} from './structure/Area';
import { Drawable } from '../../core/abstract/drawable';
import { Point } from './types';

export class House implements Drawable {
  doors: Door[] = [];
  walls: Wall[] = [];
  floorPoints: {x: number; y: number}[] = [];
  areas: Area[] = [];
  public readonly maxPoints: Point[] = [];

  private readonly _container: Container;

  get container(): Container {
    return this._container;
  }

  constructor(
    public width: number,
    public depth: number,
    public height: number,
    public minX: number = 0,
    public minY: number = 0,
    public maxX: number = 0,
    public maxY: number = 0
  ) {
    this._container = new Container();

     this.maxPoints = [
      {x: this.minX, y: this.minY},
      {x: this.maxX, y: this.minY},
      {x: this.maxX, y: this.maxY},
      {x: this.minX, y: this.maxY},
    ].map((p) => project(p.x, p.y, 0));
  }

  addDoor(door: Door) {
    this.doors.push(door);
  }

  addWall(wall: Wall) {
    this.walls.push(wall);
  }

  addArea(area: Area) {
    this.areas.push(area);
  }

  setFloorPoints(points: {x: number; y: number}[]) {
    this.floorPoints = points;
  }

  draw(): Container {
    this._container.removeChildren();

    this.areas.forEach((area) => {
      this.container.addChild(area.draw());
    });

    setTimeout(() => {
      this.areas[0].texture = Texture.from('assets/house/ha_sol.jpg');
      this.areas[0].draw();
      console.log('Texture updated');
    }, 2000);

    // Dessiner les murs
    const wallsGraphics = new Graphics();
    this.walls.forEach((wall) => wall.draw(wallsGraphics));
    this._container.addChild(wallsGraphics);

    const doorsGraphics = new Graphics();
    this.doors.forEach((door) => door.draw(doorsGraphics));
    this._container.addChild(doorsGraphics);

    return this._container;
  }
}

export function rotatePoint(
  x: number,
  y: number,
  angle: number
): {x: number; y: number} {
  const radians = (angle * Math.PI) / 180; // Convertir l'angle en radians
  return {
    x: x * Math.cos(radians) - y * Math.sin(radians),
    y: x * Math.sin(radians) + y * Math.cos(radians),
  };
}

export function parseHouseXML(xmlString: string): House {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

  const points: {
    x: number;
    y: number;
    projectedX: number;
    projectedY: number;
  }[] = [];
  const pointNodes = xmlDoc.querySelectorAll('P');

  let minX = Number.MAX_VALUE;
  let minY = Number.MAX_VALUE;
  let maxX = Number.MIN_VALUE;
  let maxY = Number.MIN_VALUE;

  pointNodes.forEach((point) => {
    const x = parseFloat(point.getAttribute('YPOS') ?? '0');
    const y = parseFloat(point.getAttribute('XPOS') ?? '0');

    // Appliquer une rotation de 90 degrés
    const rotatedPoint = rotatePoint(x, y, -90);
    const projectedPoint = project(rotatedPoint.x, rotatedPoint.y, 0);

    // Mettre à jour les min et max
    minX = Math.min(minX, rotatedPoint.x);
    minY = Math.min(minY, rotatedPoint.y);
    maxX = Math.max(maxX, rotatedPoint.x);
    maxY = Math.max(maxY, rotatedPoint.y);

    points.push({
      x: rotatedPoint.x,
      y: rotatedPoint.y,
      projectedX: projectedPoint.x,
      projectedY: projectedPoint.y,
    });
  });

  const house = new House(0, 0, 100, minX, minY, maxX, maxY); // Dimensions par défaut

  // Ajouter les points des sols
  const floorNodes = xmlDoc.querySelectorAll('F');
  floorNodes.forEach((floorNode) => {
    const floorPoints: {x: number; y: number}[] = [];
    let i = 0;
  
    while (floorNode.hasAttribute(`PT${i}`)) {
      const pointIndex = parseInt(floorNode.getAttribute(`PT${i}`) ?? '-1', 10);
      if (pointIndex >= 0 && pointIndex < points.length) {
        floorPoints.push({
          x: points[pointIndex].projectedX,
          y: points[pointIndex].projectedY,
        });
      }
      i++;
    }
  
    house.addArea(
      new Area({
        points: floorPoints,
        texture: Texture.from('assets/house/ha_sol.jpg'),
        maxPoints: house.maxPoints,
      })
    );
  });

  // Extraire les murs
  const wallNodes = xmlDoc.querySelectorAll('W');
  wallNodes.forEach((wall) => {
    const ptaIndex = parseInt(wall.getAttribute('PTA') ?? '0', 10);
    const ptbIndex = parseInt(wall.getAttribute('PTB') ?? '0', 10);
    const height = parseFloat(wall.getAttribute('H') ?? '100'); // Hauteur du mur

    if (ptaIndex < points.length && ptbIndex < points.length) {
      const p1 = points[ptaIndex];
      const p2 = points[ptbIndex];

      house.addWall(
        new Wall(
          {x: p1.projectedX, y: p1.projectedY},
          {x: p2.projectedX, y: p2.projectedY},
          project(p1.x, p1.y, height),
          project(p2.x, p2.y, height),
          height,
          wall.hasAttribute('HDN')
        )
      );

      if (wall.hasAttribute('ENTER') && wall.hasAttribute('D0')) {
        const offset = parseFloat(wall.getAttribute('D0')!); // position sur le mur
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.hypot(dx, dy);
        const nx = dx / length;
        const ny = dy / length;

        const doorWidth = 90; // à adapter si nécessaire

        const startX = p1.x + (offset - doorWidth / 2) * nx;
        const startY = p1.y + (offset - doorWidth / 2) * ny;
        const endX = p1.x + (offset + doorWidth / 2) * nx;
        const endY = p1.y + (offset + doorWidth / 2) * ny;

        const door = new Door(
          project(startX, startY, 0),
          project(endX, endY, 0),
          project(startX, startY, 200),
          project(endX, endY, 200)
        );
        house.addDoor(door); // tu stockes les portes dans un tableau
      }

      if (height > 10 && !wall.hasAttribute('HDN')) {
        house.addWall(
          new Wall(
            {x: p1.projectedX, y: p1.projectedY},
            {x: p2.projectedX, y: p2.projectedY},
            project(p1.x, p1.y, 10),
            project(p2.x, p2.y, 10),
            height,
            wall.hasAttribute('HDN')
          )
        );
      }
    }
  });

  return house;
}
