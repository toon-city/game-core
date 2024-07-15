import { Sprite, Texture } from "pixi.js";
import { IClothe } from "./IClothe";
import { IBodyPart } from "../body_part/IBodyPart";

export abstract class Clothe extends Sprite implements IBodyPart {
    private _name: string;
    private _direction: number;
    bdPartId: string = '';

    private get textureUrl(): string {
        return `${this.type}_${this._name}_${this._direction}.png`;
    }

    public get direction() : number {
        return this._direction;
    }

    public set direction(dir: number) {
        this._direction = dir;
        this.texture = Texture.from(this.textureUrl);
    }

    public get name() : string {
        return this._name;
    }

    public set name(name: string) {
        this._name = name;
        this.texture = Texture.from(this.textureUrl);
    }


    constructor(public type: string, name: string, direction: number) {
        super(Texture.from(`${type}_${name}_${direction}.png`));
        this._name = name;
        this._direction = direction;
    }

    public get walking() {
        return this._walking;
    }

    private _walking = false;
    
    setTint(tint: number) {
        return;
    }
 
    walk(): void {
        this._walking = true;
    }

    stopWalk(): void {
        this._walking = false;
    }
}