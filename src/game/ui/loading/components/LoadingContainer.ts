import { Sprite, Texture } from "pixi.js";

export class LoadingContainer extends Sprite {
    constructor() {
        super();
        this.width = 238;
        this.height = 203;
        this.texture = Texture.from('assets/ui/loading.webm');
        this.texture.source.resource.loop = true;
    }
}