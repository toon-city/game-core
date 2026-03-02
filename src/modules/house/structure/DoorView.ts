// src/modules/house/structure/DoorView.ts
//
// Same slice-based approach as WallView: DoorView is NOT a PIXI Container.
// It creates N thin Graphics slices, each added directly to HouseView, so each
// slice gets its own iso depth z-index.  offset=2 ensures door slices always
// appear in front of the wall (offset=0) and baseboard (offset=1) at the same depth.

import {Container, Graphics} from 'pixi.js';
import {Door} from '../../../core/models/Door';
import {autorun, IReactionDisposer} from 'mobx';
import * as ZOrder from '../../common/ZOrder';

/** Maximum width of one door slice in screen pixels. */
const MAX_SEGMENT_PX = 30;

export class DoorView {
  private segments: Container[] = [];
  private parent: Container | null = null;
  private readonly disposeAutorun: IReactionDisposer;

  constructor(private readonly model: Door) {
    this.disposeAutorun = autorun(() => {
      this.rebuild();
    });
  }

  /** Add all door slice containers as direct children of `parent`. */
  addToContainer(parent: Container): void {
    this.parent = parent;
    this.rebuild();
  }

  /** Remove all door slices and stop reactivity. */
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

    const {p1, p2, p1Top, p2Top} = this.model;

    const dx     = p2.x    - p1.x;
    const dy     = p2.y    - p1.y;
    const dtopx  = p2Top.x - p1Top.x;
    const dtopy  = p2Top.y - p1Top.y;
    const len    = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    const N = Math.max(1, Math.ceil(len / MAX_SEGMENT_PX));
    const ep = 2;

    for (let i = 0; i < N; i++) {
      const t0 = i / N;
      const t1 = (i + 1) / N;

      const a  = {x: p1.x    + dx    * t0, y: p1.y    + dy    * t0};
      const b  = {x: p1.x    + dx    * t1, y: p1.y    + dy    * t1};
      const at = {x: p1Top.x + dtopx * t0, y: p1Top.y + dtopy * t0};
      const bt = {x: p1Top.x + dtopx * t1, y: p1Top.y + dtopy * t1};

      const g = new Graphics();

      // Fill noir
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.lineTo(bt.x, bt.y);
      g.lineTo(at.x, at.y);
      g.closePath();
      g.fill(0x000000);

      // Contours latéraux uniquement sur le premier et le dernier slice
      g.setStrokeStyle({width: ep, color: 0x888888});
      if (i === 0) {
        g.moveTo(a.x, a.y);
        g.lineTo(at.x, at.y);
        g.stroke();
      }
      if (i === N - 1) {
        g.moveTo(b.x, b.y);
        g.lineTo(bt.x, bt.y);
        g.stroke();
      }
      // Arête du haut sur chaque slice
      g.moveTo(at.x, at.y);
      g.lineTo(bt.x, bt.y);
      g.stroke();

      const midY = (a.y + b.y) / 2;
      const midX = (a.x + b.x) / 2;

      const seg = new Container();
      seg.zIndex = ZOrder.compute({
        x: midX,
        y: midY,
        layer: ZOrder.ZPriority.SCENE,
        offset: 2, // porte : devant mur(0) et plinthe(1), derrière avatar/meuble(3)
      });
      seg.addChild(g);
      this.parent.addChild(seg);
      this.segments.push(seg);
    }
  }
}
