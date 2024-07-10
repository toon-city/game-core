import { BodyPart } from "../../../api/character/body_part/BodyPart";

export class CharacterBody extends BodyPart {
    constructor() {
        super('bd');
        this.setTransform(21, 62);
    }
}