import { Assets, Texture } from "pixi.js";
import { AnimatedBodyPart } from "../../../api/character/body_part/AnimatedBodyPart";
import { BaseTextureLoader } from "../../../textures/BaseTextureLoader";

export class CharacterArmLeft extends AnimatedBodyPart {
    constructor() {
        super(BaseTextureLoader.getInstance().HUMAN_ARM_L_ANIMATIONS, 'al');
        this.setTransform(48, 61);
        this.animationSpeed = 0.05;
    }
}