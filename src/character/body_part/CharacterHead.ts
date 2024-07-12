import { BodyPart } from "../api/body_part/BodyPart";

export class CharacterHead extends BodyPart {
    constructor(direction: number|null) {
        super('hd', direction ?? 1);
    }
}