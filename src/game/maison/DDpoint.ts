/**
 * Represents a point in 2D space.
 */
export class DDpoint {
  private _type: number;
  public y: number = 0;
  public x: number = 0;

  constructor() {
    this._type = 1;
  }

  /**
   * Checks if the vector formed by the given coordinates is in the same direction as this vector.
   * @param x - The x-coordinate of the vector.
   * @param y - The y-coordinate of the vector.
   * @returns True if the vectors are in the same direction, false otherwise.
   */
  vectorIsDirect(x: number, y: number): boolean {
    return x * this.y - y * this.x >= 0;
  }

  /**
   * Calculates the distance between this point and the given point.
   * @param pt - The point to calculate the distance to.
   * @returns The distance between the two points.
   */
  getPointDistance(pt: DDpoint): number {
    const diffX = pt.x - this.x;
    const diffY = pt.y - this.y;
    return Math.sqrt(diffX * diffX + diffY * diffY);
  }

  /**
   * Calculates the norm (magnitude) of this vector.
   * @returns The norm of the vector.
   */
  getNorm(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Normalizes this vector, making it a unit vector.
   */
  normalize(): void {
    const norm = this.getNorm();
    this.x = this.x / norm;
    this.y = this.y / norm;
  }

  /**
   * Calculates the angle between this vector and the given vector.
   * @param pt - The vector to calculate the angle to.
   * @returns The angle between the two vectors in radians.
   */
  vectorsAngle(pt: DDpoint): number {
    const dotProduct = this.x * pt.x + this.y * pt.y;
    const normProduct = this.getNorm() * pt.getNorm();
    return Math.acos(dotProduct / normProduct);
  }

  /**
   * Creates a duplicate of this point.
   * @returns A new DDpoint object with the same coordinates as this point.
   */
  duplicate(): DDpoint {
    const duplicatePoint = new DDpoint();
    duplicatePoint.x = this.x;
    duplicatePoint.y = this.y;
    return duplicatePoint;
  }

  /**
   * Initializes the coordinates of this point to (0, 0).
   */
  init(): void {
    this.x = 0;
    this.y = 0;
  }
}
