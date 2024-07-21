import {Clothe} from '../Clothe';

export class Hair extends Clothe {
  constructor(identifier: string, direction: number | null) {
    super('hair', identifier, direction ?? 1);
  }

  public setTint(tint: number) {
    this.tint = tint;
  }
}
