import { Clothe } from "../api/clothe/Clothe";


export class Tshirt extends Clothe {
    constructor(name: string, direction: number | null) {
        super('tshirt', name, direction ?? 1);
        this.position.set(14, 63);
    }
}