import { AnimatedBodyPart } from "../api/body_part/AnimatedBodyPart";
import { BaseTextureLoader } from "../textures/BaseTextureLoader";

export class CharacterArmRight extends AnimatedBodyPart {
    constructor(direction: number|null) {
        super(BaseTextureLoader.getInstance().HUMAN_ARM_R_ANIMATIONS, 'ar', direction);
    }

    public resetAnimationSpeed(): void {
        this.animationSpeed = (0.05 * (this.animationFrameCount) - 0.1);
    }
}