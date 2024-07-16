import { BaseTextureLoader } from "../../../../../textures/BaseTextureLoader";
import { AvatarAnimatedBodyPart } from "../AvatarAnimatedBodyPart";


export class AvatarRightArm extends AvatarAnimatedBodyPart {
    constructor(direction: number|null) {
        super(BaseTextureLoader.getInstance().HUMAN_ARM_R_ANIMATIONS, 'human_ar', direction);
    }

    public resetAnimationSpeed(): void {
        this.animationSpeed = (0.05 * (this.animationFrameCount) - 0.1);
    }
}