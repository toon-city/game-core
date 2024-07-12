import { AnimatedSprite, Texture } from "pixi.js";
import { IBodyPart } from "./IBodyPart";

export abstract class AnimatedBodyPart extends AnimatedSprite implements IBodyPart {
    private _direction: number;

    public get direction() : number {
        return this._direction;
    }

    public set direction(dir: number) {
        this._direction = dir;
        this.texture = Texture.from(`human_${this.bdPartId}_${this._direction}_0.png`);
        this.textures = this._animations[this._direction - 1];
    }

    constructor(private _animations: Texture[][], public bdPartId: string, direction: number|null) {
        super(_animations[0]);
        this._direction = direction ?? 1;
        this.texture = Texture.from(`human_${this.bdPartId}_${this._direction}_0.png`);
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
        this.play();
    }

    stopWalk(): void {
        this._walking = false;
        this.stop();
        this.texture = Texture.from(`human_${this.bdPartId}_${this._direction}_0.png`);
    }
}