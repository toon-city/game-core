import { BodyPart } from "../api/body_part/BodyPart";

export class CharacterBody extends BodyPart {
    constructor(direction: number|null) {
        super('bd', direction ?? 1);
    }
}