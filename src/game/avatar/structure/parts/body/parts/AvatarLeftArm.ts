import { BaseTextureLoader } from "../../../../../textures/BaseTextureLoader";
import { AvatarAnimatedBodyPart } from "../AvatarAnimatedBodyPart";

export class AvatarLeftArm extends AvatarAnimatedBodyPart {
    constructor(direction: number|null) {
        super(BaseTextureLoader.getInstance().HUMAN_ARM_L_ANIMATIONS, 'human_al', direction);
    }

    public resetAnimationSpeed(): void {
        this.animationSpeed = (0.05 * (this.animationFrameCount) - 0.15);
    }
}