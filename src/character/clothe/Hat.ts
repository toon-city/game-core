import { Clothe } from "../api/clothe/Clothe";


export class Hat extends Clothe {
    constructor(name: string, direction: number|null) {
        super('hat', name, direction ?? 1);
        /* Corrections :
         - 1 : 9, 6
         - 2 : 10, 6
         - 4 : 10, 6
         - 5: 10, 6
         - 6: 10, 6
         - 8: -1, 6
         - 9: 4, 6
         - 10: 1, 6
        */
    }
}