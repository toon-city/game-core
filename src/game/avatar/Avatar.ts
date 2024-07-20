import {Application, Container, Sprite, Texture, Text} from 'pixi.js';
import {IAvatarPart} from './structure/parts/IAvatarPart';
import {IAvatar, IAvatarParams} from './IAvatar';
import {
  AvatarBody,
  AvatarHead,
  AvatarLeftArm,
  AvatarLegs,
  AvatarRightArm,
} from './structure/parts/body/parts';
import {Tshirt} from './structure/parts/clothes/parts/Tshirt';
import {Hat} from './structure/parts/clothes/parts/Hat';

export class Avatar extends Container implements IAvatar {
  app: Application;

  private _direction: number = 1;

  // SPRITES
  socle: Sprite | null = null;
  legs: AvatarLegs | null = null;
  leftArm: Sprite | null = null;
  rightArm: Sprite | null = null;
  head: Sprite | null = null;
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

    this.parts = [
      new AvatarRightArm(this._direction),
      new AvatarLegs(this._direction),
      new AvatarBody(this._direction),
      new Tshirt('tshirt_april7', this._direction),
      new AvatarLeftArm(this._direction),
      new AvatarHead(this._direction),
      // new Hat('chapeau_paques4', this._direction),
      new Hat('hat_april1', this._direction),
    ];

    this.directionText.x = 50;
    this.directionText.y = 120;

    this.addChild(this.directionText);

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

  /**
   * Set the skin color.
   *
   * @param color skin color
   */
  public setSkinColor(color: number) {
    this.parts.forEach((part) => {
      part.setTint(color);
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

    this.directionText.text = `${this._direction}`;
  }
}
