import {Clothe} from '../Clothe';

export class Tshirt extends Clothe {
  constructor(identifier: string = 'tshirt_default', direction?: number) {
    super('tshirt', `${identifier}`, direction ?? 1);
    this.position.set(20, 63);
  }

  // Get the URL of the texture based on the identifier and direction
  protected get textureUrl(): string {
    return `${this.identifier}_bd_${this.direction}.png`;
  }
}
