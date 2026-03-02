// src/modules/house/structure/WallView.ts
//
// WallView is NOT a PIXI Container itself.
// Instead it creates N "slice" Containers (each a direct child of HouseView) so that
// each slice gets its own iso depth-based z-index.
// This is required for correct z-sorting of long diagonal walls against avatars:
// a single Container for the whole wall would have ONE z-index (midpoint depth),
// causing the avatar's head to go behind the shallower half of a diagonal wall.

import {Container, MeshPlane, Texture} from 'pixi.js';
import {Wall} from '../../../core/models/Wall';
import {autorun, IReactionDisposer} from 'mobx';
import {Point} from '../../../core/types/Point';
import * as ZOrder from '../../common/ZOrder';

/** Maximum length of one wall slice in screen pixels before the wall is split. */
const MAX_SEGMENT_PX = 30;

export class WallView {
  private segments: Container[] = [];
  private parent: Container | null = null;
  private readonly disposeAutorun: IReactionDisposer;
  private texture: Texture;
  private hasDoor = false;

  constructor(private readonly model: Wall) {
    this.texture = Texture.from(model.texture);

    // React to texture changes (MobX observable on Wall model)
    this.disposeAutorun = autorun(() => {
      this.texture = Texture.from(this.model.texture);
      this.rebuild();
    });
  }

  /** Add all wall slice containers as direct children of `parent`.
   *  @param hasDoor  true if this wall carries a door opening — forces all slices
   *                  to render behind the door regardless of floating-point depth noise.
   */
  addToContainer(parent: Container, hasDoor = false): void {
    this.hasDoor = hasDoor;
    this.parent = parent;
    this.rebuild();
  }

  /** Remove all wall slices from their parent and stop reactivity. */
  destroy(): void {
    this._clearSegments();
    this.parent = null;
    this.disposeAutorun();
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private _clearSegments(): void {
    for (const seg of this.segments) {
      this.parent?.removeChild(seg);
      seg.destroy({ children: true });
    }
    this.segments = [];
  }

  private rebuild(): void {
    if (!this.parent) return;

    this._clearSegments();

    if (this.model.hidden) return;

    const {p1, p2, p1Top, p2Top, isBaseBoard} = this.model;

    const dx    = p2.x    - p1.x;
    const dy    = p2.y    - p1.y;
    const dtopx = p2Top.x - p1Top.x;
    const dtopy = p2Top.y - p1Top.y;
    const len   = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    const N = Math.max(1, Math.ceil(len / MAX_SEGMENT_PX));

    const projectedHeight = Math.abs(p1.y - p1Top.y);
    const brickW          = this.texture.width;
    const brickH          = this.texture.height;
    const totalRepeatX    = len / brickW;
    const repeatY         = isBaseBoard ? 1 : projectedHeight / brickH;

    this.texture.source.wrapMode = 'repeat';

    for (let i = 0; i < N; i++) {
      const t0 = i / N;
      const t1 = (i + 1) / N;

      const sp1:    Point = {x: p1.x    + dx    * t0, y: p1.y    + dy    * t0};
      const sp2:    Point = {x: p1.x    + dx    * t1, y: p1.y    + dy    * t1};
      const sp1Top: Point = {x: p1Top.x + dtopx * t0, y: p1Top.y + dtopy * t0};
      const sp2Top: Point = {x: p1Top.x + dtopx * t1, y: p1Top.y + dtopy * t1};

      const plane = new MeshPlane({texture: this.texture, verticesX: 2, verticesY: 2});

      const pos = plane.geometry.getBuffer('aPosition').data;
      pos[0] = sp1.x;    pos[1] = sp1.y;
      pos[2] = sp2.x;    pos[3] = sp2.y;
      pos[4] = sp1Top.x; pos[5] = sp1Top.y;
      pos[6] = sp2Top.x; pos[7] = sp2Top.y;
      plane.geometry.getBuffer('aPosition').update();

      const uStart = t0 * totalRepeatX;
      const uEnd   = t1 * totalRepeatX;
      const uv = plane.geometry.getBuffer('aUV').data;
      uv[0] = uStart; uv[1] = 0;
      uv[2] = uEnd;   uv[3] = 0;
      uv[4] = uStart; uv[5] = -repeatY;
      uv[6] = uEnd;   uv[7] = -repeatY;
      plane.geometry.getBuffer('aUV').update();

      const midY = (sp1.y + sp2.y) / 2;
      const midX = (sp1.x + sp2.x) / 2;

      // Mur portant une porte : layer FLOOR pour être garanti derrière les avatars/meubles
      // (qui sont à SCENE). midY - 20 assure que la porte (FLOOR + midY) le dépasse bien
      // en z-index au sein du même layer FLOOR.
      const layer = this.hasDoor ? ZOrder.ZPriority.FLOOR : ZOrder.ZPriority.SCENE;
      const depthY = this.hasDoor ? midY - 20 : midY;

      const seg = new Container();
      seg.zIndex = ZOrder.compute({
        x: midX,
        y: depthY,
        layer,
        offset: isBaseBoard ? 1 : 0,
      });
      seg.addChild(plane);
      this.parent.addChild(seg);
      this.segments.push(seg);
    }
  }
}
