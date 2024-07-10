import { Application, Container, Sprite, Texture } from "pixi.js";
import { CharacterLegs } from "./body_part/BodyParts";
import { IBodyPart } from "../../api/character/body_part/IBodyPart";
import { CharacterBody } from "./body_part/CharacterBody";
import { CharacterHead } from "./body_part/CharacterHead";
import { CharacterArmRight } from "./body_part/CharacterArmRight";
import { CharacterArmLeft } from "./body_part/CharacterArmLeft";
import { ICharacter } from "./ICharacter";

export class Character extends Container implements ICharacter {
    app: Application;

    private _direction: number = 1;

    // SPRITES
    socle: Sprite|null = null;
    legs: CharacterLegs|null = null;
    leftArm: Sprite|null = null;
    rightArm: Sprite|null = null;
    head: Sprite|null = null;
    body: IBodyPart[] = [];

    isWalking: boolean = false;

    constructor(app: Application, showSocle: boolean = false) {
        super();
        this.app = app;
        this.height = 120;
        this.width = 80;
        this.init();
    }

    public get direction() : number {
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
            this.socle.setTransform(4, 100);
            this.addChild(this.socle);
        }

        this.body = [
            new CharacterLegs(),
            new CharacterBody(),
            new CharacterArmRight(),
            new CharacterArmLeft(),
            new CharacterHead(),
        ]

        this.body.forEach((part) => {
            this.addChild(part);
        });

        this.setSkinColor(0xf7ceaf);
    }

    /**
     * Start walking.
     */
    public walk() {
        this.isWalking = true;
        this.body.forEach((part) => {
            part.walk();
        });
    }

    /**
     * Stop walking.
     */
    public stopWalk() {
        this.isWalking = false;
        this.body.forEach((part) => {
            part.stopWalk();
        });
    }

    /**
     * Set the skin color.
     *
     * @param color skin color
     */
    public setSkinColor(color: number) {
        this.body.forEach((part) => {
            part.setTint(color);
        });
    }

    public changeDirection(directions: number) {
        if ((directions & 0b1000 && directions & 0b1100) || (directions & 0b0010 && directions & 0b0001)) {
            console.log('stop');
            return;
        }

        if (directions & 0b0100) {
            this._direction = 1;
        // } else if (directions & 0b0010) {
        //     this._direction = 2;
        } else if (directions & 0b0010) {
            this._direction = 3;
        } else if (directions & 0b1000) {
            this._direction = 4;
        } else if (directions & 0b0011) {
            this._direction = 5;
        } else if (directions & 0b0110) {
            this._direction = 6;
        } else if (directions & 0b1100) {
            this._direction = 7;
        } else if (directions & 0b1001) {
            this._direction = 8;
        }

        console.log(this._direction);

        this.body.forEach((part) => {
            part.direction = this._direction;
        });
    }
}