import {House} from '../../core/models/House';
import {Wall} from '../../core/models/Wall';
import {Door} from '../../core/models/Door';
import {Area} from '../../core/models/Area';
import {project} from '../../utils/project';
import {rotatePoint} from '../../utils/geometry';
import {Point} from '../../core/types/Point';

// ─── House layout types (mirror of game-types HouseLayout) ──────────────────
export interface HousePointDef { x: number; y: number; }
export interface HouseFloorDef { points: number[]; }
export interface HouseDoorDef  { offset: number; }
export interface HouseWallDef  {
  ptA: number; ptB: number; h: number;
  enter?: boolean; door?: HouseDoorDef; hidden?: boolean;
}
export interface HouseLayout {
  points: HousePointDef[];
  walls: HouseWallDef[];
  floors: HouseFloorDef[];
}

export class HouseParser {
  static parseStructureFromJson(layout: HouseLayout): House {
    // 1) Collecte et projection z=0 pour tous les points
    type Pt = {point: Point; projectedPoint: Point};
    const pts: Pt[] = [];
    layout.points.forEach((p) => {
      const rawX = p.x;
      const rawY = p.y;

      // Rotation de 90°
      const {x: xr, y: yr} = rotatePoint(rawX, rawY, -90);
      const p0 = project(xr, yr, 0);

      pts.push({point: {x: xr, y: yr}, projectedPoint: {x: p0.x, y: p0.y}});
    });

    // 2) Calcul des bornes projetées pour le décalage
    let minProjX = Infinity;
    let minProjY = Infinity;
    pts.forEach((p) => {
      minProjX = Math.min(minProjX, p.projectedPoint.x);
      minProjY = Math.min(minProjY, p.projectedPoint.y);
    });
    const offsetX = minProjX < 0 ? -minProjX : 0;
    const offsetY = minProjY < 0 ? -minProjY : 0;

    // Application de l'offset aux points projetés
    pts.forEach((p) => {
      p.projectedPoint.x += offsetX;
      p.projectedPoint.y += offsetY;
    });

    // 4) Calcul des bornes brutes pour la House
    const xs = pts.map((p) => p.point.x);
    const ys = pts.map((p) => p.point.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    const house = new House(
      0,
      0,
      100,
      [
        {x: minX, y: minY},
        {x: maxX, y: minY},
        {x: maxX, y: maxY},
        {x: minX, y: maxY},
      ].map((p) => {
        const {x, y} = project(p.x, p.y, 0);
        return {x: x + offsetX, y: y + offsetY};
      }),
      offsetX,
      offsetY
    );

    layout.floors.forEach((floorDef) => {
      const floorPts: {x: number; y: number}[] = [];
      floorDef.points.forEach((idx) => {
        const p = pts[idx];
        if (p) {
          floorPts.push({x: p.projectedPoint.x, y: p.projectedPoint.y});
        }
      });
      house.addArea(
        new Area(floorPts, house.maxPoints, 'assets/house/quizz_sol.jpg')
      );
    });

    // 7) Extraction des murs et portes (W)
    layout.walls.forEach((wallDef) => {
      const iA = wallDef.ptA;
      const iB = wallDef.ptB;
      const h = wallDef.h;
      const pA = pts[iA];
      const pB = pts[iB];
      if (!pA || !pB) return;

      const isBaseBoard = h == 10;

      // Mur principal
      house.addWall(
        new Wall(
          {x: pA.projectedPoint.x, y: pA.projectedPoint.y},
          {x: pB.projectedPoint.x, y: pB.projectedPoint.y},
          {x: pA.projectedPoint.x, y: -h + pA.projectedPoint.y},
          {x: pB.projectedPoint.x, y: -h + pB.projectedPoint.y},
          isBaseBoard
            ? 'assets/house/baseboard.png'
            : 'assets/house/base_wall.png',
          wallDef.hidden === true,
          isBaseBoard
        )
      );

      // Porte éventuelle
      if (wallDef.enter && wallDef.door) {
        const off = wallDef.door.offset;
        const dx = pB.projectedPoint.x - pA.projectedPoint.x;
        const dy = pB.projectedPoint.y - pA.projectedPoint.y;
        const L = Math.hypot(dx, dy);
        const nx = dx / L;
        const ny = dy / L;
        const doorW = 90;

        const sx = pA.projectedPoint.x + (off - doorW / 2) * nx;
        const sy = pA.projectedPoint.y + (off - doorW / 2) * ny;
        const ex = pA.projectedPoint.x + (off + doorW / 2) * nx;
        const ey = pA.projectedPoint.y + (off + doorW / 2) * ny;

        const wallRefY = Math.max(pA.projectedPoint.y, pB.projectedPoint.y);

        house.addDoor(
          new Door(
            {x: sx, y: sy},
            {x: ex, y: ey},
            {x: sx, y: -180 + sy},
            {x: ex, y: -180 + ey},
            wallRefY
          )
        );
      }

      // Plinthe pour h>10
      if (h > 10 && !wallDef.hidden) {
        house.addWall(
          new Wall(
            {x: pA.projectedPoint.x, y: pA.projectedPoint.y},
            {x: pB.projectedPoint.x, y: pB.projectedPoint.y},
            {x: pA.projectedPoint.x, y: -10 + pA.projectedPoint.y},
            {x: pB.projectedPoint.x, y: -10 + pB.projectedPoint.y},
            'assets/house/baseboard.png',
            false,
            true
          )
        );
      }
    });

    return house;
  }
}
