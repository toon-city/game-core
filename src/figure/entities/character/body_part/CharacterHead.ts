import { BodyPart } from "../../../api/character/body_part/BodyPart";

export class CharacterHead extends BodyPart {
    constructor() {
        super('hd');
        this.setTransform(17, 23);
    }
}