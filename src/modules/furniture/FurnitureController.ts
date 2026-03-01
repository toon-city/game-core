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
  /** Dernière position valide (sans collision) pendant le drag */
  private lastValidPosition: Point = { x: 0, y: 0 };

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
    this.lastValidPosition = { x: furnitureView.model.x, y: furnitureView.model.y };

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

    // Déplacer provisoirement le modèle pour tester la collision
    this.draggedFurniture.model.setPosition(targetX, targetY);
    // MobX met à jour this._points synchronement via autorun

    const hasCollision = this.depthCalculator.checkCollision(this.draggedFurniture, null);

    if (hasCollision) {
      // Position invalide : revenir à la dernière position valide
      this.draggedFurniture.model.setPosition(this.lastValidPosition.x, this.lastValidPosition.y);
      this.draggedFurniture.alpha = 0.5;
      this.draggedFurniture.sprite.cursor = 'not-allowed';
    } else {
      // Position valide : on la mémorise
      const prev = { ...this.lastValidPosition };
      this.lastValidPosition = { x: targetX, y: targetY };
      this.draggedFurniture.alpha = 0.8;
      this.draggedFurniture.sprite.cursor = 'grabbing';

      // Emit move event when position actually changes
      this.events?.emit('furniture:moved', {
        view: this.draggedFurniture,
        from: prev,
        to:   this.lastValidPosition,
      });
    }

    return { success: !hasCollision, collision: hasCollision };
  }

  /**
   * Relâche le meuble.
   * - Sans collision : pose à lastValidPosition (déjà en place dans le modèle)
   * - cancel=true   : revient à initialPosition
   */
  endDrag(cancel: boolean = false): FurnitureMoveResult {
    if (!this.draggedFurniture) {
      return { success: false, message: 'No furniture being dragged' };
    }

    if (cancel) {
      this.draggedFurniture.model.setPosition(this.initialPosition.x, this.initialPosition.y);
    }
    // Pas besoin de re-vérifier la collision : le modèle est déjà à
    // lastValidPosition (ou initialPosition si cancel), les deux sans collision.

    const placed = this.draggedFurniture;
    this.draggedFurniture.alpha = 1;
    this.draggedFurniture.sprite.cursor = 'grab';
    this.draggedFurniture = null;

    if (!cancel) {
      this.events?.emit('furniture:placed', {
        view:     placed,
        position: { x: placed.model.x, y: placed.model.y },
      });
    }

    return { success: !cancel, message: cancel ? 'Drag cancelled' : 'Furniture placed successfully' };
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
   */
  rotateFurniture(furniture: Furniture, orientation: number, view?: FurnitureView): FurnitureMoveResult {
    const validOrientations = [1, 2, 3, 4]; // Based on frameKeys length
    const targetOrientation = validOrientations.includes(orientation) ? orientation : 1;
    
    furniture.setOrientation(targetOrientation);

    if (view) {
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
}
