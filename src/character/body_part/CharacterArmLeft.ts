import { AnimatedBodyPart } from "../api/body_part/AnimatedBodyPart";
import { BaseTextureLoader } from "../textures/BaseTextureLoader";

export class CharacterArmLeft extends AnimatedBodyPart {
    constructor(direction: number|null) {
        super(BaseTextureLoader.getInstance().HUMAN_ARM_L_ANIMATIONS, 'al', direction);
        this.animationSpeed = 0.05;
    }
}