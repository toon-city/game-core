import {House} from '../../core/models/House';
import {Wall} from '../../core/models/Wall';
import {Door} from '../../core/models/Door';
import {Area} from '../../core/models/Area';
import {project} from '../../utils/project';
import {rotatePoint} from '../../utils/geometry';
import {Furniture} from '../../core/models/Furniture';
import {GameItemManager} from '../../game/textures/GameItemManager';
import { Point } from '../../core/types/Point';

export class HouseParser {
  static parseStructure(xmlString: string): House {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

    // 1) Collecte et projection z=0 pour tous les points
    type Pt = {point: Point; projectedPoint: Point};
    const pts: Pt[] = [];
    xmlDoc.querySelectorAll('P').forEach((node) => {
      const rawX = parseFloat(node.getAttribute('YPOS') ?? '0');
      const rawY = parseFloat(node.getAttribute('XPOS') ?? '0');

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
    const xs = pts.map((p) => p.projectedPoint.x);
    const ys = pts.map((p) => p.projectedPoint.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    const house = new House(
      0,
      0,
      100,
      {x: minX, y: minY},
      {x: maxX, y: maxY},
      offsetX,
      offsetY
    );
    xmlDoc.querySelectorAll('F').forEach((nodeF) => {
      const floorPts: {x: number; y: number}[] = [];
      let i = 0;
      while (nodeF.hasAttribute(`PT${i}`)) {
        const idx = parseInt(nodeF.getAttribute(`PT${i}`)!, 10);
        const p = pts[idx];
        if (p) {
          floorPts.push({x: p.projectedPoint.x, y: p.projectedPoint.y});
        }
        i++;
      }
      house.addArea(
        new Area(floorPts, house.maxPoints, 'assets/house/base_floor.png')
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
          {x: pA.projectedPoint.x, y: pA.projectedPoint.y},
          {x: pB.projectedPoint.x, y: pB.projectedPoint.y},
          {x: pA.projectedPoint.x, y: -h + (pA.projectedPoint.y) },
          {x: pB.projectedPoint.x, y: -h + (pB.projectedPoint.y) },
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

        const bottomY = Math.min(pA.projectedPoint.y, pB.projectedPoint.y);

        house.addDoor(
          new Door(
            {x: sx, y: sy},
            {x: ex, y: ey},
            {x: sx, y: -180 + sy},
            {x: ex, y: -180 + ey},
            bottomY + 0.1
          )
        );
      }

      // Plinthe pour h>10
      if (h > 10 && !nodeW.hasAttribute('HDN')) {
        house.addWall(
          new Wall(
            {x: pA.projectedPoint.x, y: pA.projectedPoint.y},
            {x: pB.projectedPoint.x, y: pB.projectedPoint.y},
            {x: pA.projectedPoint.x, y: -10 + (pA.projectedPoint.y)},
            {x: pB.projectedPoint.x, y: -10 + (pB.projectedPoint.y)},
            'assets/house/baseboard.png',
            false,
            true
          )
        );
      }
    });

    return house;
  }

  static async parseFurnitures(house: House, json: string): Promise<void> {
    const data = JSON.parse(json);
    for (const furnitureData of data) {
      if (furnitureData.SURL && !furnitureData.SURL.includes('.swf')) {
        const type = parseInt(furnitureData.STYPE);
        if ([16, 19].includes(type)) {
          // Sol
        } else if (type === 17) {
          this.addFloorTexture(house, furnitureData);
        } else if (type === 18 || type === 20) {
          await this.addFurniture(house, furnitureData);
        } else {
          // Sol
        }
      }
    }
  }

  private static async addFurniture(
    house: House,
    furnitureData: any
  ): Promise<void> {
    const furnitureBase = await GameItemManager.getInstance().getFurnitureBase(
      Number(furnitureData.SOID),
      Number(furnitureData.STYPE),
      furnitureData.SURL
    );

    if (furnitureBase) {
      const furniture = new Furniture(
        furnitureData.SID,
        furnitureBase,
        parseFloat(furnitureData.PXP) * 2.5 + house.offsetX - 380,
        parseFloat(furnitureData.PYP) * 2.5 + house.offsetY - 200,
        parseInt(furnitureData.PR),
        0,
        0
      );
      house.addFurniture(furniture);
    }
  }

  private static async addFloorTexture(
    house: House,
    furnitureData: any
  ): Promise<void> {
    if (furnitureData.AREA !== undefined && house.areas[furnitureData.AREA]) {
      const areaTexture = await GameItemManager.getInstance().getFloorTexture(
        Number(furnitureData.SOID),
        furnitureData.SURL
      );

      if (areaTexture) {
        house.areas[furnitureData.AREA].setTexture(
          `assets/textures/floors/${furnitureData.SURL}`
        );
      }
    }
  }
}
