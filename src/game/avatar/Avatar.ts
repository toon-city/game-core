import {Application, Container, Sprite, Texture, Text} from 'pixi.js';
import {IAvatarPart} from './structure/parts/IAvatarPart';
import {IAvatar, IAvatarParams} from './IAvatar';
import {IAvatarBodyPart} from './structure/parts/body/IAvatarBodyPart';
import {
  AvatarBody,
  AvatarHead,
  AvatarLeftArm,
  AvatarLegs,
  AvatarRightArm,
} from './structure/parts/body/parts';
import {Tshirt} from './structure/parts/clothes/parts/Tshirt';
import {Hat} from './structure/parts/clothes/parts/Hat';
import {Hair} from './structure/parts/clothes/parts/Hair';
import { IHasPoints } from '../../modules/common/abstract/IHasPoints';
import { Point } from '../../core/types/Point';
import { PARTS_CONFIG, getPartsInOrder, PartConfig } from './partsConfig';
import ClotheRegistry from './ClotheRegistry';
import * as ZOrder from '../../modules/common/ZOrder';

// 10	2	6
// 8	1	4
// 9	1	5

export class Avatar extends Container implements IAvatar, IHasPoints {
  app: Application;

  private _direction: number = 1;

  // SPRITES
  socle: Sprite | null = null;
  legs: AvatarLegs | null = null;
  leftArm: Sprite | null = null;
  rightArm: Sprite | null = null;
  head: Sprite | null = null;
  hair: Hair | null = null;
  parts: IAvatarPart[] = [];

  isWalking: boolean = false;

  constructor(app: Application, params: IAvatarParams) {
    super();
    this.app = app;
    this.height = 120;
    this.width = 80;
    this._direction = params.direction ?? 1;
    this.init();
    this.changeDirection(this._direction);
  }

  get points(): Point[] {
    return [
      {x: this.x, y: this.y + this.height},
      {x: this.x + this.width, y: this.y + this.height},
    ]
  }

  public get direction(): number {
    return this._direction;
  }

  private directionText = new Text({text: `${this._direction}`});

  /**
   * Initialize the character container.
   */
  private init() {
    // Set the container size
    this.height = 120;
    this.width = 80;

    // Set the background color
    this.interactive = true;

    // Add a background sprite
    const background = new Sprite(Texture.WHITE);
    background.tint = 0xffffff;
    background.width = this.width;
    background.height = this.height;
    this.addChild(background);
    this.addChildAt(background, 1);

    // Generate the socle if we have one
    if (this.socle == null) {
      this.socle = new Sprite(Texture.from('socle.png'));
      this.socle.position.set(4, 100);
      this.addChild(this.socle);
    }

    // Initialize parts based on configuration
    this.parts = this.initializeParts();

    // Initial Z-index calculation - will be updated when avatar moves
    this.updateZIndex();

    // Apply default hair color
    const hair = this.parts.find(part => part instanceof Hair) as Hair;
    if (hair) {
      hair.tint = 0x000000;
    }

    // this.addChild(this.directionText);

    this.renderParts();

    this.setSkinColor(0xf7ceaf);
  }

  private renderParts() {
    this.parts.forEach((part) => {
      this.addChild(part);
    });
  }

  /**
   * Start walking.
   */
  public walk() {
    this.isWalking = true;
    this.parts.forEach((part) => {
      part.walk();
    });
  }

  /**
   * Stop walking.
   */
  public stopWalk() {
    this.isWalking = false;
    this.parts.forEach((part) => {
      part.stopWalk();
    });
  }

  private partIsSkin(part: any): part is IAvatarBodyPart {
    return 'isSkin' in part;
  }

  /**
   * Set the skin color.
   *
   * @param color skin color
   */
  public setSkinColor(color: number) {
    this.parts.forEach((part) => {
      if (this.partIsSkin(part)) {
        part.setTint(color);
      }
    });
  }

  public changeDirection(direction: number) {
    if (
      (direction & 0b1000 && direction & 0b0100) ||
      (direction & 0b0010 && direction & 0b0001)
    ) {
      return;
    }

    if (direction == 0) {
      this._direction = 1;
      return;
    }

    this._direction = direction;

    this.parts.forEach((part) => {
      part.direction = this._direction;
    });

    this.directionText.text = `${this._direction} ${this.zIndex}`;
  }

  private initializeParts(): IAvatarPart[] {
    const parts: IAvatarPart[] = [];
    const orderedParts = getPartsInOrder();

    for (const partConfig of orderedParts) {
      try {
        const part = this.createPartFromConfig(partConfig);
        if (part) {
          parts.push(part);
        }
      } catch (error) {
        console.error(`Failed to create part ${partConfig.className}:`, error);
        if (partConfig.required) {
          throw error; // Re-throw for required parts
        }
      }
    }

    return parts;
  }

  private createPartFromConfig(config: PartConfig): IAvatarPart | null {
    // Handle body parts
    if (config.category === 'body') {
      switch (config.className) {
        case 'AvatarRightArm':
          return new AvatarRightArm(this._direction);
        case 'AvatarLegs':
          return new AvatarLegs(this._direction);
        case 'AvatarBody':
          return new AvatarBody(this._direction);
        case 'AvatarLeftArm':
          return new AvatarLeftArm(this._direction);
        case 'AvatarHead':
          return new AvatarHead(this._direction);
        default:
          console.warn(`Unknown body part: ${config.className}`);
          return null;
      }
    }

    // Handle clothing parts via registry
    const clothe = ClotheRegistry.create(config.category, config.id, this._direction);
    return clothe;
  }

  /**
   * Change a specific clothing item
   */
  public changeClothing(category: string, id?: string): boolean {
    // Remove existing clothing of this category
    const existingIndex = this.parts.findIndex(part => 
      part.constructor.name.toLowerCase().includes(category.toLowerCase())
    );

    if (existingIndex !== -1) {
      const existingPart = this.parts[existingIndex];
      this.removeChild(existingPart);
      this.parts.splice(existingIndex, 1);
    }

    // Add new clothing if id provided
    if (id) {
      const newClothe = ClotheRegistry.create(category, id, this._direction);
      if (newClothe) {
        // Find the correct position to insert based on configuration
        const config = PARTS_CONFIG.find(p => p.category === category);
        const insertIndex = config ? this.findInsertionIndex(config.order) : this.parts.length;
        
        this.parts.splice(insertIndex, 0, newClothe);
        this.renderParts();
        return true;
      }
    }

    this.renderParts();
    return false;
  }

  private findInsertionIndex(targetOrder: number): number {
    for (let i = 0; i < this.parts.length; i++) {
      const partConfig = this.getPartConfig(this.parts[i]);
      if (partConfig && partConfig.order > targetOrder) {
        return i;
      }
    }
    return this.parts.length;
  }

  private getPartConfig(part: IAvatarPart): PartConfig | undefined {
    const className = part.constructor.name;
    return PARTS_CONFIG.find(config => config.className === className);
  }

  /**
   * Update Z-index based on current position (like furniture)
   */
  public updateZIndex(): void {
    this.zIndex = ZOrder.compute({
      x: this.x,
      y: this.y + this.height, // bord avant (pieds) = profondeur iso
      layer: ZOrder.ZPriority.SCENE,
      offset: 1 // tiebreaker : avatar devant un meuble au même Y
    });
  }
}
