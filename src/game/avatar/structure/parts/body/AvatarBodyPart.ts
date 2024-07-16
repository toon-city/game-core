import { Sprite, Texture } from "pixi.js";
import { IAvatarBodyPart } from "./IAvatarBodyPart";

export abstract class AvatarBodyPart extends Sprite implements IAvatarBodyPart {
    private _direction: number;
    private _identifier: string;

    public get identifier(): string {
        return this._identifier;
    }

    private get textureUrl(): string {
        return `${this._identifier}_${this.direction}_0.png`;
    }

    public get direction() : number {
        return this._direction;
    }

    public set direction(dir: number) {
        this._direction = dir;
        this.texture = Texture.from(this.textureUrl);
    }

    constructor(identifier: string, direction: number) {
        super(Texture.from(`${identifier}_${direction}_0.png`));
        this._identifier = identifier;
        this._direction = 1;
    }

    public get walking() {
        return this._walking;
    }

    private _walking = false;
    
    setTint(tint: number) {
        this.tint = tint;
    }
 
    walk(): void {
        this._walking = true;
    }

    stopWalk(): void {
        this._walking = false;
    }
}