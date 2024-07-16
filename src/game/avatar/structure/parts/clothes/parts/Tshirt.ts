import { Clothe } from "../Clothe";


export class Tshirt extends Clothe {
    constructor(identifier: string, direction: number | null) {
        super(identifier, direction ?? 1);
        this.position.set(14, 63);
    }
}