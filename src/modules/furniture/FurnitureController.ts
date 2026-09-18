import { House } from '../../core/models/House';
import { Furniture } from '../../core/models/Furniture';
import { FurnitureView } from './FurnitureView';
import { IHasDepthCalculator } from '../common/abstract/IHasDepthCalculator';
import { Point } from '../../core/types/Point';
import { GameEvents } from '../../GameEvents';

export interface FurniturePlacementOptions {
  checkCollisions?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
}

export interface FurnitureMoveResult {
  success: boolean;
  collision?: boolean;
  snappedPosition?: Point;
  message?: string;
}

export class FurnitureController {
  private draggedFurniture: FurnitureView | null = null;
  private dragOffset: Point = { x: 0, y: 0 };
  private initialPosition: Point = { x: 0, y: 0 };
  /** Dernière position valide (sans collision) atteinte pendant le drag —
   *  null tant qu'aucune ne l'a été (ex : un fantôme fraîchement posé par
   *  drag-and-drop depuis l'inventaire, directement sur un mur). */
  private lastValidPosition: Point | null = null;

  constructor(
    private readonly house: House,
    private readonly depthCalculator: IHasDepthCalculator,
    private readonly events?: GameEvents
  ) {}

  /**
   * Start dragging a furniture piece
   */
  startDrag(furnitureView: FurnitureView, pointerX: number, pointerY: number): void {
    this.draggedFurniture = furnitureView;
    this.dragOffset = {
      x: pointerX - furnitureView.model.x,
      y: pointerY - furnitureView.model.y
    };
    this.initialPosition = { x: furnitureView.model.x, y: furnitureView.model.y };
    // Don't blindly trust the starting position as "valid" — an existing
    // placed piece being re-dragged always starts valid (it was placed
    // there validly before), but a freshly-spawned ghost (inventory drag-
    // and-drop, dropped exactly on a wall) might not be. A click-to-confirm
    // with zero movement never reaches updateDrag at all, so this is the
    // only place that ever checks that spot.
    this.lastValidPosition = this.depthCalculator.checkCollision(furnitureView, null)
      ? null
      : { x: furnitureView.model.x, y: furnitureView.model.y };

    furnitureView.alpha = 0.8;
    furnitureView.sprite.cursor = 'grabbing';
  }

  /**
   * Update drag position with enhanced ground anchoring validation
   */
  updateDrag(pointerX: number, pointerY: number, options: FurniturePlacementOptions = {}): FurnitureMoveResult {
    if (!this.draggedFurniture) {
      return { success: false, message: 'No furniture being dragged' };
    }

    let targetX = pointerX - this.dragOffset.x;
    let targetY = pointerY - this.dragOffset.y;

    if (options.snapToGrid) {
      const gridSize = options.gridSize || 20;
      targetX = Math.round(targetX / gridSize) * gridSize;
      targetY = Math.round(targetY / gridSize) * gridSize;
    }

    // Suit le curseur inconditionnellement, y compris au-dessus d'une zone
    // invalide (mur, hors room) — seul endDrag() refuse le DROP là-dessus.
    // Avant, une collision faisait revenir le meuble à lastValidPosition ici
    // même, ce qui le "collait" au bord du mur pendant que le curseur
    // continuait d'avancer : plus la souris s'éloignait, plus il fallait
    // revenir en arrière pour reprendre le contrôle — donnait l'impression
    // d'être bloqué, alors que seul le fait de POSER là devrait être refusé.
    const prev = { x: this.draggedFurniture.model.x, y: this.draggedFurniture.model.y };

    // hasCollision has to reflect the whole hop from `prev`, not just where
    // it lands: a fast real drag can jump further in one pointermove than
    // the wall's own collision band is thick (WALL_THICKNESS in
    // collision.ts, 8px -- avatar movement is safe from this because it's
    // throttled to <=5px a tick, dragging isn't throttled at all), landing
    // the piece cleanly past a wall with NEITHER end of the hop ever inside
    // the band. Confirmed live: one big jump toward a wall reported
    // `collision: false` and left the piece in the void outside the room.
    // sweepCollides samples the segment finely enough that no gap in it can
    // hide a band this thin.
    const hasCollision = this.sweepCollides(prev, { x: targetX, y: targetY });
    this.draggedFurniture.model.setPosition(targetX, targetY);
    // MobX met à jour this._points synchronement via autorun (sweepCollides
    // already left the model there as its own last sample, this is only to
    // guarantee it regardless of how many samples that was).

    if (hasCollision) {
      this.draggedFurniture.alpha = 0.4;
      this.draggedFurniture.sprite.cursor = 'not-allowed';
    } else {
      this.lastValidPosition = { x: targetX, y: targetY };
      this.draggedFurniture.alpha = 0.8;
      this.draggedFurniture.sprite.cursor = 'grabbing';
    }

    this.events?.emit('furniture:moved', {
      view: this.draggedFurniture,
      from: prev,
      to:   { x: targetX, y: targetY },
    });

    return { success: !hasCollision, collision: hasCollision };
  }

  /**
   * Relâche le meuble.
   * - Position valide : pose là où le curseur l'a laissé
   * - Position invalide (mur, hors room) avec une lastValidPosition connue :
   *   snap là — le drag laisse le meuble suivre le curseur même sur une
   *   zone invalide (voir updateDrag), donc ce n'est plus garanti à la
   *   relâche
   * - Position invalide sans aucune lastValidPosition (ex : relâché sans
   *   bouger — updateDrag n'a jamais tourné — un fantôme fraîchement
   *   déposé pile sur un mur par drag-and-drop depuis l'inventaire) :
   *   refusé entièrement, comme un cancel — rien de sûr où le poser
   * - cancel=true : revient à initialPosition
   *
   * Recalcule toujours la collision ici plutôt que de faire confiance à un
   * flag mis à jour seulement par updateDrag — un simple clic sans
   * mouvement ne passe jamais par updateDrag, donc ce flag pouvait rester
   * périmé (ou à sa valeur par défaut) et laisser passer un placement sur
   * une zone invalide sans jamais la vérifier.
   */
  endDrag(cancel: boolean = false): FurnitureMoveResult {
    if (!this.draggedFurniture) {
      return { success: false, message: 'No furniture being dragged' };
    }

    const dropPosition = { x: this.draggedFurniture.model.x, y: this.draggedFurniture.model.y };
    // Swept from the last position actually known clear, not just tested at
    // dropPosition alone -- same reasoning as updateDrag's own sweep (see
    // its comment): a click with no movement in between never called
    // updateDrag at all, so this is the ONLY check a jump straight through a
    // wall would ever hit for it.
    const reference = this.lastValidPosition ?? this.initialPosition;
    const hasCollision = !cancel && this.sweepCollides(reference, dropPosition);
    this.draggedFurniture.model.setPosition(dropPosition.x, dropPosition.y);
    const rejected = cancel || (hasCollision && !this.lastValidPosition);

    if (cancel) {
      this.draggedFurniture.model.setPosition(this.initialPosition.x, this.initialPosition.y);
    } else if (hasCollision) {
      // Snap to the CLOSEST valid spot on the way back from the drop point,
      // not straight to lastValidPosition -- that's only whichever pointer
      // SAMPLE last happened to land clear, which can be far short of where
      // collision actually starts (a fast drag's mousemove events are
      // sparse, easily jumping straight from "clearly fine" to "well past
      // the wall" in one step, especially right at a corner where the piece
      // has little room before it's invalid on both sides). Reported as "a
      // huge gap" pushing furniture into a corner -- confirmed live: the
      // TRUE collision boundary sits flush against the wall (binary-search
      // verified against the actual wall polygon, this controller wasn't
      // ever finding it). Same technique GameCore already uses for avatar
      // movement.
      const fallback = this.lastValidPosition ?? this.initialPosition;
      const closest = this.sweep(fallback, dropPosition).lastValid;
      this.draggedFurniture.model.setPosition(closest.x, closest.y);
    }

    const placed = this.draggedFurniture;
    this.draggedFurniture.alpha = 1;
    this.draggedFurniture.sprite.cursor = 'grab';
    this.draggedFurniture = null;

    if (!rejected) {
      this.events?.emit('furniture:placed', {
        view:     placed,
        position: { x: placed.model.x, y: placed.model.y },
      });
    }

    return {
      success: !rejected,
      collision: hasCollision,
      message: rejected ? (cancel ? 'Drag cancelled' : 'Invalid position') : 'Furniture placed successfully',
    };
  }

  /**
   * How finely `sweep()` samples a drag hop, in world px. Has to be safely
   * under WALL_THICKNESS (collision.ts, 8px) so no gap between samples can
   * hide the band entirely — unlike avatar movement (throttled to <=5px a
   * tick, see GameCore.MOVE_INTERVAL), a pointermove's jump has no upper
   * bound, so this is the only thing standing between a fast drag and
   * walking a piece straight through a wall undetected.
   */
  private static readonly SWEEP_STEP = 3;
  /** Hard cap on samples for one sweep — a drag across the whole room
   *  shouldn't run hundreds of collision checks per pointermove. */
  private static readonly SWEEP_MAX_SAMPLES = 80;

  /**
   * Steps from `from` to `to` in `SWEEP_STEP`-sized increments (NOT a binary
   * search — bisection can converge on the wrong side of a band this thin,
   * same reason a plain endpoint-only check can miss it, see updateDrag()'s
   * comment), testing each. Returns whether ANY sample collided, and the
   * last sample that didn't (== `to` itself if the whole hop was clear).
   * Leaves `draggedFurniture.model` at `lastValid` — every call site here
   * already mutates the model to test a candidate this way (e.g. updateDrag
   * moving to the cursor's target before reading its result).
   */
  private sweep(from: Point, to: Point): { hasCollision: boolean; lastValid: Point } {
    const furniture = this.draggedFurniture!;
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const samples = Math.min(FurnitureController.SWEEP_MAX_SAMPLES,
                             Math.max(1, Math.ceil(dist / FurnitureController.SWEEP_STEP)));
    let lastValid = from;
    let hasCollision = false;
    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const point = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
      furniture.model.setPosition(point.x, point.y);
      if (this.depthCalculator.checkCollision(furniture, null)) {
        hasCollision = true;
        break;
      }
      lastValid = point;
    }
    furniture.model.setPosition(lastValid.x, lastValid.y);
    return { hasCollision, lastValid };
  }

  /** Whether the straight hop from `from` to `to` ever crosses collision —
   *  see sweep(). Leaves the model at `to` regardless (matches the "follow
   *  the cursor unconditionally" contract updateDrag()'s own comment
   *  describes; only whether to trust the hop as validating a position is
   *  this method's business, not where the piece visually ends up). */
  private sweepCollides(from: Point, to: Point): boolean {
    const hasCollision = this.sweep(from, to).hasCollision;
    this.draggedFurniture!.model.setPosition(to.x, to.y);
    return hasCollision;
  }

  /**
   * Déplace un meuble aux coordonnées (x, y).
   */
  moveFurniture(furniture: Furniture, x: number, y: number, options: FurniturePlacementOptions = {}): FurnitureMoveResult {
    let targetX = x;
    let targetY = y;

    // Apply grid snapping if enabled
    if (options.snapToGrid) {
      const gridSize = options.gridSize || 20;
      targetX = Math.round(targetX / gridSize) * gridSize;
      targetY = Math.round(targetY / gridSize) * gridSize;
    }

    // Check collision if enabled
    if (options.checkCollisions !== false) {
      furniture.setPosition(targetX, targetY);
      
      // Need to find the FurnitureView for collision check
      // This would require a view lookup mechanism
      // For now, just move the furniture
      
      return {
        success: true,
        snappedPosition: options.snapToGrid ? { x: targetX, y: targetY } : undefined
      };
    }

    furniture.setPosition(targetX, targetY);
    return {
      success: true,
      snappedPosition: options.snapToGrid ? { x: targetX, y: targetY } : undefined
    };
  }

  /**
   * Change l'orientation d'un meuble.
   *
   * Rotating swaps in a DIFFERENT frame (different ground-anchor points, see
   * FurnitureView.computePoints), so the footprint's own shape/size can
   * change — a piece sitting fine at its current orientation can genuinely
   * overlap a wall or another piece once rotated. This had zero validation
   * at all before: any orientation was accepted unconditionally, so a
   * rotate could silently drop a piece INTO a wall with no way to tell
   * short of trying to walk into it. Same collision check drag/move already
   * does (checkCollision against `view`, which reacts synchronously to the
   * orientation change via MobX — same assumption updateDrag's own comment
   * already relies on), reverted on failure rather than left half-applied.
   *
   * @param options.silent  True when applying an already-server-confirmed
   *   rotation (the network echo) rather than a fresh local request — skips
   *   the 'furniture:rotated' emit so GameCanvasComponent's send-to-network
   *   listener doesn't fire again and ping-pong the same rotation back to
   *   the server on every client that receives the broadcast.
   */
  rotateFurniture(
    furniture: Furniture,
    orientation: number,
    view?: FurnitureView,
    options: { silent?: boolean } = {}
  ): FurnitureMoveResult {
    const validOrientations = [1, 2, 3, 4]; // Based on frameKeys length
    const targetOrientation = validOrientations.includes(orientation) ? orientation : 1;
    const previousOrientation = furniture.orientation;

    if (targetOrientation === previousOrientation) {
      return { success: true, message: 'Already at that orientation' };
    }

    furniture.setOrientation(targetOrientation);

    if (view && this.depthCalculator.checkCollision(view, null)) {
      furniture.setOrientation(previousOrientation);
      return {
        success: false,
        collision: true,
        message: 'Rotation impossible : collision avec un mur ou un autre meuble',
      };
    }

    if (view && !options.silent) {
      this.events?.emit('furniture:rotated', { view, orientation: targetOrientation });
    }

    return {
      success: true,
      message: `Furniture rotated to orientation ${targetOrientation}`
    };
  }

  /**
   * Supprime un meuble de la maison.
   */
  removeFurniture(furniture: Furniture): FurnitureMoveResult {
    try {
      this.house.removeFurniture(furniture);
      return {
        success: true,
        message: 'Furniture removed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to remove furniture: ${error}`
      };
    }
  }

  /**
   * Supprime un meuble via sa vue (retire aussi de la scène PIXI + émet furniture:removed).
   */
  removeFurnitureView(view: FurnitureView): FurnitureMoveResult {
    const result = this.removeFurniture(view.model);
    if (result.success) {
      view.parent?.removeChild(view);
      view.destroy({ children: true });
      this.events?.emit('furniture:removed', { view });
    }
    return result;
  }

  /**
   * Add new furniture to the house
   */
  addFurniture(furniture: Furniture, options: FurniturePlacementOptions = {}): FurnitureMoveResult {
    // Apply grid snapping if enabled
    if (options.snapToGrid) {
      const gridSize = options.gridSize || 20;
      const snappedX = Math.round(furniture.x / gridSize) * gridSize;
      const snappedY = Math.round(furniture.y / gridSize) * gridSize;
      furniture.setPosition(snappedX, snappedY);
    }

    try {
      this.house.addFurniture(furniture);
      return {
        success: true,
        message: 'Furniture added successfully',
        snappedPosition: options.snapToGrid ? { x: furniture.x, y: furniture.y } : undefined
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to add furniture: ${error}`
      };
    }
  }

  /**
   * Get the currently dragged furniture
   */
  getDraggedFurniture(): FurnitureView | null {
    return this.draggedFurniture;
  }

  /**
   * Cancel any ongoing drag operation
   */
  cancelDrag(): void {
    if (this.draggedFurniture) {
      this.endDrag(true);
    }
  }

  /** Outside edit mode, a tap on a piece opens its preview panel instead of dragging it. */
  emitFurnitureClick(view: FurnitureView): void {
    this.events?.emit('furniture:click', { view, instanceId: view.model.id });
  }
}
