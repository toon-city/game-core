import { Assets, Texture } from "pixi.js";
import { AnimatedBodyPart } from "../../../api/character/body_part/AnimatedBodyPart";
import { BaseTextureLoader } from "../../../textures/BaseTextureLoader";

export class CharacterArmRight extends AnimatedBodyPart {
    constructor() {
        super(BaseTextureLoader.getInstance().HUMAN_ARM_R_ANIMATIONS, 'ar');
        this.setTransform(15, 61);
        this.animationSpeed = 0.05;
    }
}