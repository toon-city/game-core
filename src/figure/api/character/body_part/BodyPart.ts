import { Sprite, Texture } from "pixi.js";
import { IBodyPart } from "./IBodyPart";

export abstract class BodyPart extends Sprite implements IBodyPart {
    private _direction: number;

    private get textureUrl(): string {
        return `human_${this.bdPartId}_${this.direction}_0.png`;
    }

    public get direction() : number {
        return this._direction;
    }

    public set direction(dir: number) {
        this._direction = dir;
        this.texture = Texture.from(this.textureUrl);
    }

    constructor(public bdPartId: string) {
        super(Texture.from(`human_${bdPartId}_1_0.png`));
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