import { AnimatedBodyPart } from "../api/body_part/AnimatedBodyPart";
import { BaseTextureLoader } from "../textures/BaseTextureLoader";

export class CharacterLegs extends AnimatedBodyPart {
    constructor(direction: number|null) {
        super(BaseTextureLoader.getInstance().HUMAN_LEGS_ANIMATIONS, 'lg', direction);
        this.animationSpeed = 0.22;
    }
}