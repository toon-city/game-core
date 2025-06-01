import {Container} from 'pixi.js';
import {Furniture} from '../../core/models/Furniture';
import {FurnitureView} from '../../modules/furniture/FurnitureView';
import {Area} from '../../core/models/Area';
import {AreaView} from '../../modules/house/structure/AreaView';
import {Wall} from '../../core/models/Wall';
import {WallView} from '../../modules/house/structure/WallView';
import { Door } from '../../core/models/Door';
import { DoorView } from '../../modules/house/structure/DoorView';
import { Point } from '../../core/types/Point';
import { project } from '../../utils/project';

export class House {
  doors: Door[] = [];
  walls: Wall[] = [];
  floorPoints: {x: number; y: number}[] = [];
  areas: Area[] = [];
  furnitures: Furniture[] = [];
  public readonly maxPoints: Point[] = [];

  constructor(
    public width: number,
    public depth: number,
    public height: number,
    public minX: number = 0,
    public minY: number = 0,
    public maxX: number = 0,
    public maxY: number = 0,
    public offsetX: number = 0,
    public offsetY: number = 0
  ) {
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

  draw(gameScene: Container): Container {
    this.areas.forEach((area) => {
      gameScene.addChild(new AreaView(area));
      // setTimeout(() => {
      //   area.setTexture('assets/house/quizz_sol.jpg');
      // }, 1000);
    });

    this.walls.forEach((wall) => {
      gameScene.addChild(new WallView(wall));
    });

    this.doors.forEach((door) => gameScene.addChild(new DoorView(door)));

    this.furnitures.forEach((furniture) => {
      gameScene.addChild(new FurnitureView(furniture));
      // setInterval(() => {
      //   furniture.setPosition(furniture.x + (-50 + Math.random() * 100), furniture.y + (-50 + Math.random() * 100));
      // }, 1);
    });

    return gameScene;
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

  // 1) Collecte et projection z=0 pour tous les points
  type Pt = {x: number; y: number; projX: number; projY: number};
  const pts: Pt[] = [];
  xmlDoc.querySelectorAll('P').forEach((node) => {
    const rawX = parseFloat(node.getAttribute('YPOS') ?? '0');
    const rawY = parseFloat(node.getAttribute('XPOS') ?? '0');

    // Rotation de 90°
    const {x: xr, y: yr} = rotatePoint(rawX, rawY, -90);
    const p0 = project(xr, yr, 0);

    pts.push({x: xr, y: yr, projX: p0.x, projY: p0.y});
  });

  // 2) Calcul des bornes projetées pour le décalage
  let minProjX = Infinity;
  let minProjY = Infinity;
  pts.forEach((p) => {
    minProjX = Math.min(minProjX, p.projX);
    minProjY = Math.min(minProjY, p.projY);
  });
  const offsetX = minProjX < 0 ? -minProjX : 0;
  const offsetY = minProjY < 0 ? -minProjY : 0;

  // 3) Helper pour projeter tout avec le même offset
  const proj = (x: number, y: number, z: number) => {
    const p = project(x, y, z);
    return {x: p.x + offsetX, y: p.y + offsetY};
  };

  // 4) Calcul des bornes brutes pour la House
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  const house = new House(0, 0, 100, minX, minY, maxX, maxY, offsetX, offsetY);

  // 5) Ajustement des maxPoints pour les areas
  const adjustedMaxPoints = house.maxPoints.map((p) => ({
    x: p.x + offsetX,
    y: p.y + offsetY,
  }));

  // 6) Création des aires (F)
  xmlDoc.querySelectorAll('F').forEach((nodeF) => {
    const floorPts: {x: number; y: number}[] = [];
    let i = 0;
    while (nodeF.hasAttribute(`PT${i}`)) {
      const idx = parseInt(nodeF.getAttribute(`PT${i}`)!, 10);
      const p = pts[idx];
      if (p) {
        floorPts.push({x: p.projX + offsetX, y: p.projY + offsetY});
      }
      i++;
    }
    house.addArea(
      new Area(floorPts, adjustedMaxPoints, 'assets/house/jardinherbe.png')
    );
  });

  // 7) Extraction des murs et portes (W)
  xmlDoc.querySelectorAll('W').forEach((nodeW) => {
    const iA = +nodeW.getAttribute('PTA')!;
    const iB = +nodeW.getAttribute('PTB')!;
    const h = parseFloat(nodeW.getAttribute('H') ?? '100');
    const pA = pts[iA];
    const pB = pts[iB];
    if (!pA || !pB) return;

    const isBaseBoard = h == 10;

    // Mur principal
    house.addWall(
      new Wall(
        proj(pA.x, pA.y, 0),
        proj(pB.x, pB.y, 0),
        proj(pA.x, pA.y, h),
        proj(pB.x, pB.y, h),
        isBaseBoard
          ? 'assets/house/baseboard.png'
          : 'assets/house/base_wall.png',
        nodeW.hasAttribute('HDN'),
        isBaseBoard
      )
    );

    // Porte éventuelle
    if (nodeW.hasAttribute('ENTER') && nodeW.hasAttribute('D0')) {
      const off = parseFloat(nodeW.getAttribute('D0')!);
      const dx = pB.x - pA.x;
      const dy = pB.y - pA.y;
      const L = Math.hypot(dx, dy);
      const nx = dx / L;
      const ny = dy / L;
      const doorW = 90;

      const sx = pA.x + (off - doorW / 2) * nx;
      const sy = pA.y + (off - doorW / 2) * ny;
      const ex = pA.x + (off + doorW / 2) * nx;
      const ey = pA.y + (off + doorW / 2) * ny;

      const bottomY = Math.min(proj(pA.x, pA.y, 0).y, proj(pB.x, pB.y, 0).y);

      house.addDoor(
        new Door(
          proj(sx, sy, 0),
          proj(ex, ey, 0),
          proj(sx, sy, 180),
          proj(ex, ey, 180),
          bottomY + 0.1
        )
      );
    }

    // Plinthe pour h>10
    if (h > 10 && !nodeW.hasAttribute('HDN')) {
      house.addWall(
        new Wall(
          proj(pA.x, pA.y, 0),
          proj(pB.x, pB.y, 0),
          proj(pA.x, pA.y, 10),
          proj(pB.x, pB.y, 10),
          'assets/house/baseboard.png',
          false,
          true
        )
      );
    }
  });

  return house;
}
