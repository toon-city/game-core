import * as PIXI from 'pixi.js';

type Point = {x: number; y: number};

interface WallPlaneOptions {
  scaleFactor?: number;
  repeatX?: boolean;
  repeatY?: boolean;
  fitHeight?: boolean;
}

// Fonction de projection caZvalière avec diagonales de droite à gauche
function project(x: number, y: number, z: number): Point {
  const angle = -Math.PI / 4; // -45°
  const scale = 2.5;
  const xStretch = 1.25;
  const depthFactor = 1.6; // Augmenter ce facteur pour plus de profondeur

  return {
    x: (x * xStretch + y * Math.cos(angle) * depthFactor) / scale,
    y: (-z + y * Math.sin(angle) * depthFactor) / scale,
  };
}

function createWallPlane(
  texture: PIXI.Texture,
  p1: Point,
  p2: Point,
  p1Top: Point,
  p2Top: Point,
  options: WallPlaneOptions = {}
): PIXI.MeshPlane {
  const {
    scaleFactor = 2.5,
    repeatX: enableRepeatX = true,
    repeatY: enableRepeatY = true,
    fitHeight = false,
  } = options;

  texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

  const plane = new PIXI.MeshPlane({texture, verticesX: 2, verticesY: 2});

  // --- Positions projetées (aPosition) ---
  const posBuffer = plane.geometry.getBuffer('aPosition').data;
  posBuffer[0] = p1.x;
  posBuffer[1] = p1.y;
  posBuffer[2] = p2.x;
  posBuffer[3] = p2.y;
  posBuffer[4] = p1Top.x;
  posBuffer[5] = p1Top.y;
  posBuffer[6] = p2Top.x;
  posBuffer[7] = p2Top.y;
  plane.geometry.getBuffer('aPosition').update();

  // --- Dimensions projetées (écran) ---
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const projectedLength = Math.sqrt(dx * dx + dy * dy);
  const projectedHeight = Math.abs(p1.y - p1Top.y);

  // --- Taille apparente d’un motif à l’écran ---
  const brickScreenWidth = texture.width / scaleFactor;
  const brickScreenHeight = texture.height / scaleFactor;

  // --- Calcul des répétitions ---
  const repeatX = enableRepeatX ? projectedLength / brickScreenWidth : 1;
  const repeatY = fitHeight
    ? 1
    : enableRepeatY
    ? projectedHeight / brickScreenHeight
    : 1;

  // --- UVs (aUV) ---
  const uvBuffer = plane.geometry.getBuffer('aUV').data;
  uvBuffer[0] = 0;
  uvBuffer[1] = 0;
  uvBuffer[2] = repeatX;
  uvBuffer[3] = 0;
  uvBuffer[4] = 0;
  uvBuffer[5] = -repeatY;
  uvBuffer[6] = repeatX;
  uvBuffer[7] = -repeatY;
  plane.geometry.getBuffer('aUV').update();

  return plane;
}

// function createFloorMesh(
//   texture: PIXI.Texture,
//   floorPoints: {x: number; y: number}[],
//   options: {
//     scaleFactor?: number;
//     repeatX?: boolean;
//     repeatY?: boolean;
//     rotationAngleDeg?: number;    // <— nouvel optionnel
//   } = {}
// ): PIXI.Mesh {
//   const {
//     scaleFactor = 2.5,
//     repeatX: enableRepeatX = true,
//     repeatY: enableRepeatY = true,
//     rotationAngleDeg = 45,        // <— angle de rotation en degrés
//   } = options;

//   texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

//   // 1) Construire la géométrie du sol
//   const projected = floorPoints.map(p => project(p.x, p.y, 0));
//   const path = new PIXI.GraphicsPath();
//   path.moveTo(projected[0].x, projected[0].y);
//   projected.slice(1).forEach(p => path.lineTo(p.x, p.y));
//   path.closePath();

//   const geometry = PIXI.buildGeometryFromPath(path);
//   const mesh = new PIXI.Mesh({ geometry, texture, x: 0, y: 0 });

//   // 2) Calcul de combien de fois répéter la texture
//   const dx1 = floorPoints[1].x - floorPoints[0].x;
//   const dy1 = floorPoints[1].y - floorPoints[0].y;
//   const len1 = Math.hypot(dx1, dy1);

//   const dx2 = floorPoints[2].x - floorPoints[1].x;
//   const dy2 = floorPoints[2].y - floorPoints[1].y;
//   const len2 = Math.hypot(dx2, dy2);

//   const brickW = texture.width  / scaleFactor;
//   const brickH = texture.height / scaleFactor;

//   const repeatX = enableRepeatX ? len1 / brickW : 1;
//   const repeatY = enableRepeatY ? len2 / brickH : 1;

//   // 3) Initialiser les UV avant rotation
//   const uvBuf = mesh.geometry.getBuffer('aUV').data;
//   // supposer un quad à 4 sommets ; si plus, on adaptera en conséquence
//   const initialUV: [number,number][] = [
//     [0,       0      ],  // coin 0
//     [repeatX, 0      ],  // coin 1
//     [repeatX, repeatY],  // coin 2
//     [0,       repeatY],  // coin 3
//   ];
//   for (let i = 0; i < 4; i++) {
//     uvBuf[2*i  ] = initialUV[i][0];
//     uvBuf[2*i+1] = initialUV[i][1];
//   }

//   // 4) Rotation des UV autour de leur centre
//   const θ = rotationAngleDeg * Math.PI / 180;
//   const cos = Math.cos(θ), sin = Math.sin(θ);
//   const uC = repeatX / 2, vC = repeatY / 2;

//   for (let i = 0; i < uvBuf.length; i += 2) {
//     const u = uvBuf[i]   - uC;
//     const v = uvBuf[i+1] - vC;
//     uvBuf[i]   =  u * cos - v * sin + uC;
//     uvBuf[i+1] =  u * sin + v * cos + vC;
//   }

//   mesh.geometry.getBuffer('aUV').update();

//   return mesh;
// }

function createFloorMesh(
  texture: PIXI.Texture,
  floorPoints: {x: number; y: number}[],
  options: {
    scaleFactor?: number;
    repeatX?: boolean;
    repeatY?: boolean;
    rotationAngleDeg?: number;    // <— nouvel optionnel
  } = {}
): PIXI.Container {
  const container = new PIXI.Container();

  const {
    scaleFactor = 2.5,
    repeatX: enableRepeatX = true,
    repeatY: enableRepeatY = true,
    rotationAngleDeg = 45,        // <— angle de rotation en degrés
  } = options;

  texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

  // 1) Construire la géométrie du sol
  const projected = floorPoints.map(p => project(p.x, p.y, 0));
  const minX = Math.min(...projected.map(p => p.x));
  const minY = Math.min(...projected.map(p => p.y));
  const maxX = Math.max(...projected.map(p => p.x));
  const maxY = Math.max(...projected.map(p => p.y));

  const normalPoints = [{x: minX, y: minY}, {x: maxX, y: minY}, {x: maxX, y: maxY}, {x: minX, y: maxY}];

  const path = new PIXI.GraphicsPath();
  path.moveTo(normalPoints[0].x, normalPoints[0].y);
  normalPoints.forEach(p => path.lineTo(p.x, p.y));
  path.closePath();

  const mask = new PIXI.Graphics();
  const projectedPoints = floorPoints.map((p) => project(p.x, p.y, 0));
  mask.moveTo(projectedPoints[0].x, projectedPoints[0].y);
  projectedPoints.forEach((p) => mask.lineTo(p.x, p.y));
  mask.closePath();
  mask.fill(0xffffff);

  const geometry = PIXI.buildGeometryFromPath(path);
  const mesh = new PIXI.Mesh({ geometry, texture, x: 0, y: 0 });

  // Trouver le x et y les plus grands dans les points projetés

  // 2) Calcul de combien de fois répéter la texture
  const dx1 = floorPoints[1].x - floorPoints[0].x;
  const dy1 = floorPoints[1].y - floorPoints[0].y;
  const len1 = Math.hypot(dx1, dy1);

  const dx2 = floorPoints[2].x - floorPoints[1].x;
  const dy2 = floorPoints[2].y - floorPoints[1].y;
  const len2 = Math.hypot(dx2, dy2);

  const brickW = texture.width  / scaleFactor;
  const brickH = texture.height / scaleFactor;

  const repeatX = enableRepeatX ? len1 / brickW : 1;
  const repeatY = enableRepeatY ? len2 / brickH : 1;

  // 3) Initialiser les UV avant rotation
  const uvBuf = mesh.geometry.getBuffer('aUV').data;
  // supposer un quad à 4 sommets ; si plus, on adaptera en conséquence
  const initialUV: [number,number][] = [
    [0,       0      ],  // coin 0
    [repeatX, 0      ],  // coin 1
    [repeatX, repeatY],  // coin 2
    [0,       repeatY],  // coin 3
  ];
  for (let i = 0; i < 4; i++) {
    uvBuf[2*i  ] = initialUV[i][0];
    uvBuf[2*i+1] = initialUV[i][1];
  }

  // 4) Rotation des UV autour de leur centre
  const θ = rotationAngleDeg * Math.PI / 180;
  const cos = Math.cos(θ), sin = Math.sin(θ);
  const uC = repeatX / 2, vC = repeatY / 2;

  for (let i = 0; i < uvBuf.length; i += 2) {
    const u = uvBuf[i]   - uC;
    const v = uvBuf[i+1] - vC;
    uvBuf[i]   =  u * cos - v * sin + uC;
    uvBuf[i+1] =  u * sin + v * cos + vC;
  }

  mesh.geometry.getBuffer('aUV').update();

  mesh.setMask({
    mask: mask,
    inverse: false,
  });

  container.addChild(mesh, mask);

  return container;
}

// Classe représentant un mur intérieur
class Wall {
  constructor(
    public x1: number,
    public y1: number,
    public x2: number,
    public y2: number,
    public height: number // Ajout de la hauteur
  ) {}

  draw(graphics: PIXI.Graphics) {
    const p1 = project(this.x1, this.y1, 0);
    const p2 = project(this.x2, this.y2, 0);
    const p1Top = project(this.x1, this.y1, this.height);
    const p2Top = project(this.x2, this.y2, this.height);

    if (this.height == 10) {
      graphics.addChild(
        createWallPlane(
          PIXI.Texture.from('assets/house/baseboard.png'),
          p1,
          p2,
          p1Top,
          p2Top
        )
      );
    } else {
      graphics.addChild(
        createWallPlane(
          PIXI.Texture.from('assets/house/ha_mur1.jpg'),
          p1,
          p2,
          p1Top,
          p2Top,
          {
            scaleFactor: 2.5,
            repeatX: true,
            repeatY: true,
          }
        )
      );
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
    const ep = 2;
    const g = new PIXI.Graphics();

    const p1 = project(this.x1, this.y1, 0);
    const p2 = project(this.x2, this.y2, 0);
    const p1Top = project(this.x1, this.y1, 225);
    const p2Top = project(this.x2, this.y2, 225);

    // --- Porte noire ---
    g.moveTo(p1.x, p1.y);
    g.lineTo(p2.x, p2.y);
    g.lineTo(p2Top.x, p2Top.y);
    g.lineTo(p1Top.x, p1Top.y);
    g.closePath();
    g.fill(0x000000);

    // --- Montant gauche ---
    g.moveTo(p1.x, p1.y);
    g.lineTo(p1.x + ep, p1.y);
    g.lineTo(p1Top.x + ep, p1Top.y);
    g.lineTo(p1Top.x, p1Top.y);
    g.closePath();
    g.fill(0x888888);

    // --- Montant droit ---
    g.moveTo(p2.x - ep, p2.y);
    g.lineTo(p2.x, p2.y);
    g.lineTo(p2Top.x, p2Top.y);
    g.lineTo(p2Top.x - ep, p2Top.y);
    g.closePath();
    g.fill(0x888888);

    // --- Montant haut ---
    g.moveTo(p1Top.x, p1Top.y);
    g.lineTo(p2Top.x, p2Top.y);
    g.lineTo(p2Top.x, p2Top.y - ep);
    g.lineTo(p1Top.x, p1Top.y - ep);
    g.closePath();
    g.fill(0x888888);

    graphics.addChild(g);
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

    // testFloors.forEach((floorPoints) => {
    //   const floor = new PIXI.Graphics();
    //   if (floorPoints.length > 0) {
    //     const projectedPoints = floorPoints.map((p) => project(p.x, p.y, 0));
    //     floor.moveTo(projectedPoints[0].x, projectedPoints[0].y);
    //     projectedPoints.forEach((p) => floor.lineTo(p.x, p.y));
    //     floor.closePath();
    //     // floor.fill(0x949295);
    //     floor.fill(0xffffff);
    //   }
    //   container.addChild(floor);
    // });

    this.floors.forEach((floorPoints, index) => {
      const floorTexture = PIXI.Texture.from('assets/house/quizz_sol.jpg');
      const floor = createFloorMesh(floorTexture, floorPoints, {
        scaleFactor: 2.5,
        repeatX: true,
        repeatY: true,
      });
      container.addChild(floor);
    });


    // Dessiner les murs
    const wallsGraphics = new PIXI.Graphics();
    this.walls.forEach((wall) => wall.draw(wallsGraphics));
    container.addChild(wallsGraphics);

    const doorsGraphics = new PIXI.Graphics();
    this.doors.forEach((door) => door.draw(doorsGraphics));
    container.addChild(doorsGraphics);

    let rectPoints = [{x: 0, y: 0}, {x: 0, y: 1000}, {x: 1000, y: 1000}, {x: 1000, y: 0}];
    let LPoints = [{x: 0, y: 0}, {x: 0, y: 250,}, {x: 150, y: 250}, {x: 150, y: 210}, {x: 100, y: 210}, {x: 100, y: 0}];

    let container2 = new PIXI.Container();
    container2.x = 400;
    container2.y = 400;

    let L = new PIXI.Graphics();
    L.moveTo(LPoints[0].x, LPoints[0].y);
    LPoints.forEach((point, index) => {
        if (index > 0) {
            L.lineTo(point.x, point.y);
        }
    });

    L.fill(0xFF0000);

    let rect = new PIXI.Graphics();
    rect.moveTo(rectPoints[0].x, rectPoints[0].y);
    rectPoints.forEach((point, index) => {
        rect.lineTo(point.x, point.y);
    });
    rect.fill(0x00FF00);

    container2.addChild(rect, L);

    L.x = 100;
    L.y = 100;

    rect.setMask({
      mask: L,
      inverse: false,
    });

    container.addChild(container2);

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
        const endX = p1.x + (offset + doorWidth / scale / 2) * nx;
        const endY = p1.y + (offset + doorWidth / scale / 2) * ny;

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
