import {Assets, Sprite, Texture} from 'pixi.js';
import {IClothe} from './IClothe';

// Define the abstract class Clothe that extends Sprite and implements IClothe
export abstract class Clothe extends Sprite implements IClothe {
  private _identifier: string; // The identifier of the clothe
  private _direction: number; // The direction of the clothe
  private _type: string; // The type of the clothe
  private _positionCorrection: {[key: number]: {x: number; y: number}} = {
    1: {x: 0, y: 0},
  }; // The position of the clothe

  public get fileURI(): string {
    return `assets/clothes/${this._type}/${this._identifier}.json`;
  }

  private reloadPosition() {
    this._positionCorrection =
      Assets.get(this.fileURI)?.data?.position ?? this._positionCorrection;
  }

  // Get the URL of the texture based on the identifier and direction
  protected get textureUrl(): string {
    return `${this._identifier}_${this._direction}.png`;
  }

  // Get the direction of the clothe
  public get direction(): number {
    return this._direction;
  }

  // Set the direction of the clothe and update the texture
  public set direction(dir: number) {
    this._direction = dir;
    this.refreshTexture();
  }

  private refreshTexture() {
    let positionCorrection =
      this._positionCorrection[this._direction] ?? this._positionCorrection[1];
    this.position.set(positionCorrection.x, positionCorrection.y);
    this.texture = Assets.cache.has(this.fileURI)
      ? Texture.from(this.textureUrl)
      : Texture.EMPTY;
  }

  // Get the identifier of the clothe
  public get identifier(): string {
    return this._identifier;
  }

  // Constructor for the Clothe class
  constructor(type: string, identifier: string, direction: number) {
    super(Texture.EMPTY);
    this._identifier = identifier;
    this._direction = direction;
    this._type = type;
    if (Assets.cache.has(this.fileURI)) {
      // Asset already in cache: apply position correction immediately
      this.reloadPosition();
      this.refreshTexture();
    } else {
      Assets.load(this.fileURI).then(() => {
        this.reloadPosition();
        this.refreshTexture();
      });
    }
  }

  // Get the walking state of the clothe
  public get walking() {
    return this._walking;
  }

  private _walking = false; // The walking state of the clothe

  // Set the tint of the clothe (not implemented)
  setTint(tint: number) {
    return;
  }

  // Set the walking state of the clothe to true
  walk(): void {
    this._walking = true;
  }

  // Set the walking state of the clothe to false
  stopWalk(): void {
    this._walking = false;
  }
}
