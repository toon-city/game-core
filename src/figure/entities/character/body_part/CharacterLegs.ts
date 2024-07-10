import { Assets, Texture } from "pixi.js";
import { AnimatedBodyPart } from "../../../api/character/body_part/AnimatedBodyPart";
import { BaseTextureLoader } from "../../../textures/BaseTextureLoader";

export class CharacterLegs extends AnimatedBodyPart {
    constructor() {
        super(BaseTextureLoader.getInstance().HUMAN_LEGS_ANIMATIONS, 'lg');
        this.setTransform(19, 86);
        this.animationSpeed = 0.22;
    }
}