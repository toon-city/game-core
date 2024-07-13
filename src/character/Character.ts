import { Application, Container, Sprite, Texture } from "pixi.js";
import { IBodyPart } from "./api/body_part/IBodyPart";
import { CharacterBody } from "./body_part/CharacterBody";
import { CharacterHead } from "./body_part/CharacterHead";
import { CharacterArmRight } from "./body_part/CharacterArmRight";
import { CharacterArmLeft } from "./body_part/CharacterArmLeft";
import { ICharacter, ICharacterParams } from "./ICharacter";
import { CharacterLegs } from "./body_part/CharacterLegs";

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

    constructor(app: Application, params: ICharacterParams) {
        super();
        this.app = app;
        this.height = 120;
        this.width = 80;
        this._direction = params.direction ?? 1;
        this.init();
        this.changeDirection(this._direction);
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
            this.socle.position.set(4, 100);
            this.addChild(this.socle);
        }

        this.body = [
            new CharacterArmRight(this._direction),
            new CharacterLegs(this._direction),
            new CharacterBody(this._direction),
            new CharacterArmLeft(this._direction),
            new CharacterHead(this._direction),
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

    public changeDirection(direction: number) {
        if ((direction & 0b1000 && direction & 0b0100) || (direction & 0b0010 && direction & 0b0001)) {
            return;
        }
        
        if (direction == 0) {
            this._direction = 1;
            return;
        }

        this._direction = direction;

        this.body.forEach((part) => {
            part.direction = this._direction;
        });
        // this.body[1].texture = Texture.from(`human_lg_${this.direction}_0.png`)
        // this.body[1].position.set(1, 0);
    }
}