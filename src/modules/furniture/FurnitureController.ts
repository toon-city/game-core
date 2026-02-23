import { House } from '../../core/models/House';
import { Furniture } from '../../core/models/Furniture';
import { FurnitureView } from './FurnitureView';
import { IHasDepthCalculator } from '../common/abstract/IHasDepthCalculator';
import { Point } from '../../core/types/Point';

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

  constructor(
    private readonly house: House,
    private readonly depthCalculator: IHasDepthCalculator
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
    this.initialPosition = {
      x: furnitureView.model.x,
      y: furnitureView.model.y
    };

    // Visual feedback
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

    // Apply grid snapping if enabled
    if (options.snapToGrid) {
      const gridSize = options.gridSize || 20;
      targetX = Math.round(targetX / gridSize) * gridSize;
      targetY = Math.round(targetY / gridSize) * gridSize;
    }

    // Temporarily move furniture to check collision
    const originalX = this.draggedFurniture.model.x;
    const originalY = this.draggedFurniture.model.y;
    
    this.draggedFurniture.model.setPosition(targetX, targetY);

    let hasCollision = false;
    if (options.checkCollisions !== false) {
      // Use ground anchoring points for collision detection
      hasCollision = this.depthCalculator.checkCollision(this.draggedFurniture, null);
      
      // Additional validation: ensure furniture stays within valid placement area
      const groundCenter = this.draggedFurniture.getGroundCenter();
      if (groundCenter.x < 0 || groundCenter.y < 0) {
        hasCollision = true;
      }
    }

    // Visual feedback based on collision and anchoring
    this.draggedFurniture.alpha = hasCollision ? 0.5 : 0.8;
    this.draggedFurniture.sprite.cursor = hasCollision ? 'not-allowed' : 'grabbing';

    const result: FurnitureMoveResult = {
      success: true,
      collision: hasCollision,
      snappedPosition: options.snapToGrid ? { x: targetX, y: targetY } : undefined
    };

    // Add ground anchoring info to result
    if (this.draggedFurniture.hasCustomAnchorPoints()) {
      const groundCenter = this.draggedFurniture.getGroundCenter();
      (result as any).groundAnchor = groundCenter;
    }

    return result;
  }

  /**
   * End drag operation with proper collision handling
   */
  endDrag(cancel: boolean = false): FurnitureMoveResult {
    if (!this.draggedFurniture) {
      return { success: false, message: 'No furniture being dragged' };
    }

    let hasCollision = false;
    if (!cancel) {
      hasCollision = this.depthCalculator.checkCollision(this.draggedFurniture, null);
    }

    if (cancel || hasCollision) {
      // Revert to initial position
      this.draggedFurniture.model.setPosition(
        this.initialPosition.x,
        this.initialPosition.y
      );
      console.log('Furniture reverted to original position due to:', cancel ? 'cancel' : 'collision');
    }

    // Reset visual state
    this.draggedFurniture.alpha = 1;
    this.draggedFurniture.sprite.cursor = 'grab';

    const result: FurnitureMoveResult = {
      success: !cancel && !hasCollision,
      collision: hasCollision,
      message: cancel 
        ? 'Drag cancelled' 
        : hasCollision 
          ? 'Cannot place due to collision - reverted to original position' 
          : 'Furniture placed successfully'
    };

    // Clear dragged furniture reference
    this.draggedFurniture = null;
    return result;
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
      const originalX = furniture.x;
      const originalY = furniture.y;
      
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
  rotateFurniture(furniture: Furniture, orientation: number): FurnitureMoveResult {
    const validOrientations = [1, 2, 3, 4]; // Based on frameKeys length
    const targetOrientation = validOrientations.includes(orientation) ? orientation : 1;
    
    furniture.setOrientation(targetOrientation);
    
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
