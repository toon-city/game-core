export class FurnitureBase {
    public readonly frameKeys: string[];
    constructor(
        public readonly id: number,
        public readonly type: number,
        public readonly spritesheet: any,
    ) {
        this.frameKeys = Object.keys(spritesheet.frames);
    }
}