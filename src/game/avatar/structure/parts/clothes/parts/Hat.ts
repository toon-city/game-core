import {Clothe} from '../Clothe';

export class Hat extends Clothe {
  constructor(identifier: string, direction: number | null) {
    super('hat', identifier, direction ?? 1);
  }
}
