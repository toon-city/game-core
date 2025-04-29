import * as PIXI from 'pixi.js';

// Fonction de projection cavalière avec diagonales de droite à gauche
function project(x: number, y: number, z: number): { x: number; y: number } {
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
        public height: number // Ajout de la hauteur
    ) {}

    draw(graphics: PIXI.Graphics) {
        const p1 = project(this.x1, this.y1, 0);
        const p2 = project(this.x2, this.y2, 0);
        const p1Top = project(this.x1, this.y1, this.height);
        const p2Top = project(this.x2, this.y2, this.height);

        // Dessiner les lignes du mur (bas et haut)
        graphics.moveTo(p1.x, p1.y);
        graphics.lineTo(p2.x, p2.y);
        graphics.moveTo(p1Top.x, p1Top.y);
        graphics.lineTo(p2Top.x, p2Top.y);

        // Relier les coins pour former un mur en 3D
        graphics.moveTo(p1.x, p1.y);
        graphics.lineTo(p1Top.x, p1Top.y);
        graphics.moveTo(p2.x, p2.y);
        graphics.lineTo(p2Top.x, p2Top.y);
        graphics.stroke();
    }
}

// Classe représentant la maison
export class House {
    walls: Wall[] = [];
    floorPoints: { x: number; y: number }[] = [];
    floors: { x: number; y: number }[][] = []; // Liste de sols

    constructor(public width: number, public depth: number, public height: number) {}

    addWall(wall: Wall) {
        this.walls.push(wall);
    }

    setFloorPoints(points: { x: number; y: number }[]) {
        this.floorPoints = points;
    }

    addFloor(points: { x: number; y: number }[]) {
        this.floors.push(points);
    }

    draw(): PIXI.Container {
        const container = new PIXI.Container();

        // Dessiner le sol
        this.floors.forEach(floorPoints => {
            const floor = new PIXI.Graphics();
            if (floorPoints.length > 0) {
                const projectedPoints = floorPoints.map(p => project(p.x, p.y, 0));
                floor.moveTo(projectedPoints[0].x, projectedPoints[0].y);
                projectedPoints.forEach(p => floor.lineTo(p.x, p.y));
                floor.closePath();
                floor.fill(0xc2b280);
            }
            container.addChild(floor);
        });

        // Dessiner les murs
        const wallsGraphics = new PIXI.Graphics();
        this.walls.forEach(wall => wall.draw(wallsGraphics));
        container.addChild(wallsGraphics);

        return container;
    }
}

export function rotatePoint(x: number, y: number, angle: number): { x: number; y: number } {
    const radians = (angle * Math.PI) / 180; // Convertir l'angle en radians
    return {
        x: x * Math.cos(radians) - y * Math.sin(radians),
        y: x * Math.sin(radians) + y * Math.cos(radians),
    };
}

export function parseHouseXML(xmlString: string): House {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");

    const points: { x: number; y: number }[] = [];
    const pointNodes = xmlDoc.querySelectorAll("P");
    pointNodes.forEach(point => {
        const x = parseFloat(point.getAttribute("YPOS") ?? "0");
        const y = parseFloat(point.getAttribute("XPOS") ?? "0");

        // Appliquer une rotation de 90 degrés
        const rotatedPoint = rotatePoint(x, y, -90);
        // points.push({x: x, y: y});
        points.push(rotatedPoint);
    });

    const house = new House(0, 0, 100); // Dimensions par défaut

    // Ajouter les points des sols
    const floorNodes = xmlDoc.querySelectorAll("F");
    floorNodes.forEach(floorNode => {
        const floorPoints: { x: number; y: number }[] = [];
        let i = 0;
        while (floorNode.hasAttribute(`PT${i}`)) {
            const pointIndex = parseInt(floorNode.getAttribute(`PT${i}`) ?? "-1", 10);
            if (pointIndex >= 0 && pointIndex < points.length) {
                floorPoints.push(points[pointIndex]);
            }
            i++;
        }
        house.addFloor(floorPoints); // Ajoutez chaque sol à la maison
    });

    // Extraire les murs
    const wallNodes = xmlDoc.querySelectorAll("W");
    wallNodes.forEach(wall => {
        const ptaIndex = parseInt(wall.getAttribute("PTA") ?? "0", 10);
        const ptbIndex = parseInt(wall.getAttribute("PTB") ?? "0", 10);
        const height = parseFloat(wall.getAttribute("H") ?? "100"); // Hauteur du mur

        if (ptaIndex < points.length && ptbIndex < points.length) {
            const p1 = points[ptaIndex];
            const p2 = points[ptbIndex];
            house.addWall(new Wall(p1.x, p1.y, p2.x, p2.y, height));

            if (height > 10) {
                house.addWall(new Wall(p1.x, p1.y, p2.x, p2.y, 10));
            }
        }
    });

    return house;
}