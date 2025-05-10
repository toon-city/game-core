import {Container, MeshPlane, Texture} from 'pixi.js';
import {Point, WallPlaneOptions} from '../types';
import {Drawable} from '../../../core/abstract/drawable';

export class Wall implements Drawable {
  private readonly _container: Container;

  get container(): Container {
    return this._container;
  }

  constructor(
    public p1: Point,
    public p2: Point,
    public p1Top: Point,
    public p2Top: Point,
    public height: number,
    public hidden: boolean = false
  ) {
    this._container = new Container();
  }

  private createWallPlane(
    texture: Texture,
    p1: Point,
    p2: Point,
    p1Top: Point,
    p2Top: Point,
    options: WallPlaneOptions = {}
  ): MeshPlane {
    const {
      repeatX: enableRepeatX = true,
      repeatY: enableRepeatY = true,
      fitHeight = false,
    } = options;

    texture.source.wrapMode = 'repeat';

    const plane = new MeshPlane({texture, verticesX: 2, verticesY: 2});

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
    const brickScreenWidth = texture.width;
    const brickScreenHeight = texture.height;

    // --- Calcul des répétitions ---
    const repeatX = enableRepeatX ? projectedLength / brickScreenWidth : 1;
    const repeatY =
      !fitHeight || !enableRepeatY ? projectedHeight / brickScreenHeight : 1;

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

  draw(): Container {
    this._container.removeChildren();
    if (this.hidden) {
      return this._container;
    }

    const isBaseBoard = this.height == 10;

    this._container.addChild(
      this.createWallPlane(
        Texture.from(
          isBaseBoard
            ? 'assets/house/baseboard.png'
            : 'assets/house/base_wall.png'
        ),
        this.p1,
        this.p2,
        this.p1Top,
        this.p2Top,
        {
          repeatX: true,
          repeatY: true,
          fitHeight: isBaseBoard,
        }
      )
    );

    this._container.zIndex = isBaseBoard ? Math.max(this.p1.y, this.p2.y) : 0;
    // console.log(this._container.zIndex);

    return this._container;
  }
}
