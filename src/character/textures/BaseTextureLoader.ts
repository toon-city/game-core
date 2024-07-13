import { Assets, Texture } from "pixi.js";

export class BaseTextureLoader {
    private static instance: BaseTextureLoader;

    private _HUMAN_LEGS_ANIMATIONS: Texture[][] = [];
    public get HUMAN_LEGS_ANIMATIONS(): Texture[][] {
        return this._HUMAN_LEGS_ANIMATIONS;
    }

    private _HUMAN_ARM_L_ANIMATIONS: Texture[][] = [];
    public get HUMAN_ARM_L_ANIMATIONS(): Texture[][] {
        return this._HUMAN_ARM_L_ANIMATIONS;
    }

    private _HUMAN_ARM_R_ANIMATIONS: Texture[][] = [];
    public get HUMAN_ARM_R_ANIMATIONS(): Texture[][] {
        return this._HUMAN_ARM_R_ANIMATIONS;
    }

    private constructor() { }

    public static getInstance(): BaseTextureLoader {
        if (!BaseTextureLoader.instance) {
            BaseTextureLoader.instance = new BaseTextureLoader();
        }

        return BaseTextureLoader.instance;
    }

    public async load() {
        await this.loadTextures();
        this.loadAnimations();
    }

    private async loadTextures() {
        await Assets.load([
            'assets/toon/toon.json'
        ]);
    }

    private loadAnimations() {
        const animations = Object.values<string[]>(Assets.cache.get('assets/toon/toon.json').data.animations);
        this._HUMAN_LEGS_ANIMATIONS = [[], [], [], [], [], [], [], [], [], [], [], []];
        for (const element of animations[0]) {
            this._HUMAN_LEGS_ANIMATIONS[0].push(Texture.from(element));
        }

        this._HUMAN_ARM_R_ANIMATIONS = [[], [], [], [], [], [], [], [], [], [], [], []];
        for (const element of animations[1]) {
            this._HUMAN_ARM_R_ANIMATIONS[0].push(Texture.from(element));
        }

        this._HUMAN_ARM_L_ANIMATIONS = [[], [], [], [], [], [], [], [], [], [], [], []];
        for (const element of animations[2]) {
            this._HUMAN_ARM_L_ANIMATIONS[0].push(Texture.from(element));
        }

        for (const element of animations[3]) {
            this._HUMAN_LEGS_ANIMATIONS[1].push(Texture.from(element));
        }

        for (const element of animations[4]) {
            this._HUMAN_ARM_R_ANIMATIONS[1].push(Texture.from(element));
        }

        for (const element of animations[5]) {
            this._HUMAN_ARM_L_ANIMATIONS[1].push(Texture.from(element));
        }

        for (const element of animations[6]) {
            this._HUMAN_LEGS_ANIMATIONS[3].push(Texture.from(element));
        }

        for (const element of animations[7]) {
            this._HUMAN_ARM_R_ANIMATIONS[3].push(Texture.from(element));
        }

        for (const element of animations[8]) {
            this._HUMAN_ARM_L_ANIMATIONS[3].push(Texture.from(element));
        }

        for (const element of animations[9]) {
            this._HUMAN_LEGS_ANIMATIONS[4].push(Texture.from(element));
        }

        for (const element of animations[10]) {
            this._HUMAN_ARM_R_ANIMATIONS[4].push(Texture.from(element));
        }

        for (const element of animations[11]) {
            this._HUMAN_ARM_L_ANIMATIONS[4].push(Texture.from(element));
        }

        for (const element of animations[12]) {
            this._HUMAN_LEGS_ANIMATIONS[7].push(Texture.from(element));
        }

        for (const element of animations[13]) {
            this._HUMAN_ARM_R_ANIMATIONS[7].push(Texture.from(element));
        }

        for (const element of animations[14]) {
            this._HUMAN_ARM_L_ANIMATIONS[7].push(Texture.from(element));
        }

        for (const element of animations[15]) {
            this._HUMAN_LEGS_ANIMATIONS[8].push(Texture.from(element));
        }

        for (const element of animations[16]) {
            this._HUMAN_ARM_R_ANIMATIONS[8].push(Texture.from(element));
        }

        for (const element of animations[17]) {
            this._HUMAN_ARM_L_ANIMATIONS[8].push(Texture.from(element));
        }
    }
}