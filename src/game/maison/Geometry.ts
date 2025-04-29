export class Geometry {
  id: number;
  private static idCounter: number = 0;

  constructor() {
    this.id = ++Geometry.idCounter;
  }
}
