import { Application, Container, Sprite, Texture } from "pixi.js";
import { AvatarLegs } from "./avatar/structure/parts/body/parts/AvatarLegs";
import { IAvatarPart } from "./avatar/structure/parts/IAvatarPart";
import { IAvatar, IAvatarParams } from "./IAvatar";
import { AvatarBody } from "./avatar/structure/parts/body/parts/AvatarBody";
import { Tshirt } from "./avatar/structure/parts/clothes/parts/Tshirt";
import { AvatarHead } from "./avatar/structure/parts/body/parts/AvatarHead";
import { Hat } from "./avatar/structure/parts/clothes/parts/Hat";
import { AvatarRightArm } from "./avatar/structure/parts/body/parts/AvatarRightArm";
import { AvatarLeftArm } from "./avatar/structure/parts/body/parts/AvatarLeftArm";

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

    /**
     * Initialize the character container.
     */
    private init() {
        // Set the container size
        this.height = 120;
        this.width = 80;

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
            new Hat('hat_april1', this._direction),
        ];

        this.parts.forEach((part) => {
            this.addChild(part);
        });

        this.setSkinColor(0xf7ceaf);
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
        if ((direction & 0b1000 && direction & 0b0100) || (direction & 0b0010 && direction & 0b0001)) {
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
    }
}