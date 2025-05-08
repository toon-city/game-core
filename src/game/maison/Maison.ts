import * as PIXI from 'pixi.js';

// Fonction de projection caZvalière avec diagonales de droite à gauche
function project(x: number, y: number, z: number): {x: number; y: number} {
  const angle = -Math.PI / 4; // -45°
  const scale = 2.5;
  const xStretch = 1.25;
  const depthFactor = 1.6; // Augmenter ce facteur pour plus de profondeur

  return {
    x: (x * xStretch + y * Math.cos(angle) * depthFactor) / scale,
    y: (-z + y * Math.sin(angle) * depthFactor) / scale,
  };
}

// Classe représentant un mur intérieur
class Wall {
  constructor(
    public x1: number,
    public y1: number,
    public x2: number,
    public y2: number,
    public height: number, // Ajout de la hauteur
  ) {}

  draw(graphics: PIXI.Graphics) {
    
    const p1 = project(this.x1, this.y1, 0);
    const p2 = project(this.x2, this.y2, 0);
    const p1Top = project(this.x1, this.y1, this.height);
    const p2Top = project(this.x2, this.y2, this.height);

    // Remplir le mur avec une couleur grise
    graphics.moveTo(p1.x, p1.y);
    graphics.lineTo(p2.x, p2.y);
    graphics.lineTo(p2Top.x, p2Top.y);
    graphics.lineTo(p1Top.x, p1Top.y);
    graphics.closePath();

    if (this.height == 10) {
        graphics.fill(0xb9b39c);
    } else {
        graphics.fill(0xfefaf9);
    }
  }
}

class Door {
  x1: number;
  y1: number;
  x2: number;
  y2: number;

  constructor(x1: number, y1: number, x2: number, y2: number) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
  }

  draw(graphics: PIXI.Graphics) {
    const doorBottomLeft = project(this.x1, this.y1, 0);
    const doorBottomRight = project(this.x2, this.y2, 0);
    const doorTopLeft = project(this.x1, this.y1, 250-25); // hauteur arbitraire
    const doorTopRight = project(this.x2, this.y2, 250-25);

    // Remplir le mur avec une couleur grise
    graphics.moveTo(doorBottomLeft.x, doorBottomLeft.y);
    graphics.lineTo(doorBottomRight.x, doorBottomRight.y);
    graphics.lineTo(doorTopRight.x, doorTopRight.y);
    graphics.lineTo(doorTopLeft.x, doorTopLeft.y);
    graphics.closePath();
    graphics.fill(0x000000);
  }
}


// Classe représentant la maison
export class House {
  doors: Door[] = [];
  walls: Wall[] = [];
  floorPoints: {x: number; y: number}[] = [];
  floors: {x: number; y: number}[][] = []; // Liste de sols

  constructor(
    public width: number,
    public depth: number,
    public height: number
  ) {}

  addDoor(door: Door) {
    this.doors.push(door);
  }

  addWall(wall: Wall) {
    this.walls.push(wall);
  }

  setFloorPoints(points: {x: number; y: number}[]) {
    this.floorPoints = points;
  }

  addFloor(points: {x: number; y: number}[]) {
    this.floors.push(points);
  }

  draw(): PIXI.Container {
    const container = new PIXI.Container();

    // Dessiner le sol
    this.floors.forEach((floorPoints) => {
      const floor = new PIXI.Graphics();
      if (floorPoints.length > 0) {
        const projectedPoints = floorPoints.map((p) => project(p.x, p.y, 0));
        floor.moveTo(projectedPoints[0].x, projectedPoints[0].y);
        projectedPoints.forEach((p) => floor.lineTo(p.x, p.y));
        floor.closePath();
        floor.fill(0x949295);
      }
      container.addChild(floor);
    });

    // Dessiner les murs
    const wallsGraphics = new PIXI.Graphics();
    this.walls.forEach((wall) => wall.draw(wallsGraphics));
    container.addChild(wallsGraphics);

    const doorsGraphics = new PIXI.Graphics();
    this.doors.forEach((door) => door.draw(wallsGraphics));
    container.addChild(doorsGraphics);

    return container;
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

  const points: {x: number; y: number}[] = [];
  const pointNodes = xmlDoc.querySelectorAll('P');
  pointNodes.forEach((point) => {
    const x = parseFloat(point.getAttribute('YPOS') ?? '0');
    const y = parseFloat(point.getAttribute('XPOS') ?? '0');

    // Appliquer une rotation de 90 degrés
    const rotatedPoint = rotatePoint(x, y, -90);
    // points.push({x: x, y: y});
    points.push(rotatedPoint);
  });

  const house = new House(0, 0, 100); // Dimensions par défaut

  // Ajouter les points des sols
  const floorNodes = xmlDoc.querySelectorAll('F');
  floorNodes.forEach((floorNode) => {
    const floorPoints: {x: number; y: number}[] = [];
    let i = 0;
    while (floorNode.hasAttribute(`PT${i}`)) {
      const pointIndex = parseInt(floorNode.getAttribute(`PT${i}`) ?? '-1', 10);
      if (pointIndex >= 0 && pointIndex < points.length) {
        floorPoints.push(points[pointIndex]);
      }
      i++;
    }
    house.addFloor(floorPoints); // Ajoutez chaque sol à la maison
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
      house.addWall(new Wall(p1.x, p1.y, p2.x, p2.y, height));

      if (wall.hasAttribute('ENTER') && wall.hasAttribute('D0')) {
          const offset = parseFloat(wall.getAttribute('D0')!); // position sur le mur
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const length = Math.hypot(dx, dy);
          const nx = dx / length;
          const ny = dy / length;

          const doorWidth = 90; // à adapter si nécessaire
          const scale = 1; // si tu veux tenir compte d’un facteur d’échelle

          const startX = p1.x + (offset - doorWidth / scale / 2) * nx;
          const startY = p1.y + (offset - doorWidth / scale / 2) * ny;
          const endX   = p1.x + (offset + doorWidth / scale / 2) * nx;
          const endY   = p1.y + (offset + doorWidth / scale / 2) * ny;
      
          const door = new Door(startX, startY, endX, endY);
          house.addDoor(door); // tu stockes les portes dans un tableau
      }

      if (height > 10) {
        house.addWall(new Wall(p1.x, p1.y, p2.x, p2.y, 10));
      }
    }
  });

  return house;
}
