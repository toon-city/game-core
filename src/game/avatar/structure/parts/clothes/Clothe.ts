import { Sprite, Texture } from "pixi.js";
import { IClothe } from "./IClothe";

// Define the abstract class Clothe that extends Sprite and implements IClothe
export abstract class Clothe extends Sprite implements IClothe {
    private _identifier: string; // The identifier of the clothe
    private _direction: number; // The direction of the clothe

    // Get the URL of the texture based on the identifier and direction
    private get textureUrl(): string {
        return `${this._identifier}_${this._direction}.png`;
    }

    // Get the direction of the clothe
    public get direction(): number {
        return this._direction;
    }

    // Set the direction of the clothe and update the texture
    public set direction(dir: number) {
        this._direction = dir;
        this.texture = Texture.from(this.textureUrl);
    }

    // Get the identifier of the clothe
    public get identifier(): string {
        return this._identifier;
    }

    // Constructor for the Clothe class
    constructor(identifier: string, direction: number) {
        super(Texture.from(`${identifier}_${direction}.png`));
        this._identifier = identifier;
        this._direction = direction;
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