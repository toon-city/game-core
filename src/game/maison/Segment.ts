import {DDpoint} from './DDpoint';
import {Geometry} from './Geometry';

export class Segment extends Geometry {
  private _type: number;
  public ptB: DDpoint;
  public ptA: DDpoint;
  public a: number;
  public b: number;

  constructor() {
    super();
    this._type = 2;
    this.ptB = new DDpoint();
    this.ptA = new DDpoint();
    this.a = 0;
    this.b = 0;
  }

  getLength(): number {
    return this.ptA.getPointDistance(this.ptB);
  }

  getVector(): DDpoint {
    const vector = new DDpoint();
    vector.x = this.ptB.x - this.ptA.x;
    vector.y = this.ptB.y - this.ptA.y;
    return vector;
  }

  getMiddlePoint(): DDpoint {
    const middlePoint = new DDpoint();
    middlePoint.x = (this.ptA.x + this.ptB.x) / 2;
    middlePoint.y = (this.ptA.y + this.ptB.y) / 2;
    return middlePoint;
  }

  vectorIsDirect(x: number, y: number): boolean {
    return x * (this.ptB.y - this.ptA.y) - y * (this.ptB.x - this.ptA.x) > 0;
  }

  segIsDirect(seg: Segment): boolean {
    return (
      (seg.ptB.x - seg.ptA.x) * (this.ptB.y - this.ptA.y) -
        (seg.ptB.y - seg.ptA.y) * (this.ptB.x - this.ptA.x) >
      0
    );
  }

  split(resolution: number): Segment[] {
    const segments: Segment[] = [];
    const _loc11 = Math.floor(this.ptA.x / resolution);
    const _loc10 = Math.floor(this.ptA.y / resolution);
    const _loc7 = Math.floor(this.ptB.x / resolution);
    const _loc6 = Math.floor(this.ptB.y / resolution);

    if (_loc11 == _loc7 && _loc10 == _loc6) {
      segments.push(this.duplicate());
    } else if (this.ptA.x == this.ptB.x) {
      if (_loc10 < _loc6) {
        for (let _loc9 = _loc10; _loc9 <= _loc6; ++_loc9) {
          const segment = new Segment();
          segment.init();
          segment.ptA.x = this.ptA.x;
          segment.ptB.x = this.ptA.x;

          if (_loc9 == _loc10) {
            segment.ptA.y = this.ptA.y;
            segment.ptB.y = (_loc10 + 1) * resolution;
          } else if (_loc9 == _loc6) {
            segment.ptA.y = _loc6 * resolution;
            segment.ptB.y = this.ptB.y;
          } else {
            segment.ptA.y = _loc9 * resolution;
            segment.ptB.y = (_loc9 + 1) * resolution;
          }

          if (segment.ptA.y != segment.ptB.y) {
            segments.push(segment);
          }
        }
      } else {
        for (let _loc9 = _loc10; _loc9 >= _loc6; --_loc9) {
          const segment = new Segment();
          segment.init();
          segment.ptA.x = this.ptA.x;
          segment.ptB.x = this.ptA.x;

          if (_loc9 == _loc10) {
            segment.ptA.y = this.ptA.y;
            segment.ptB.y = _loc10 * resolution;
          } else if (_loc9 == _loc6) {
            segment.ptA.y = (_loc6 + 1) * resolution;
            segment.ptB.y = this.ptB.y;
          } else {
            segment.ptA.y = (_loc9 + 1) * resolution;
            segment.ptB.y = _loc9 * resolution;
          }

          if (segment.ptA.y != segment.ptB.y) {
            segments.push(segment);
          }
        }
      }
    } else if (this.ptA.y == this.ptB.y) {
      if (_loc11 < _loc7) {
        for (let _loc9 = _loc11; _loc9 <= _loc7; ++_loc9) {
          const segment = new Segment();
          segment.init();
          segment.ptA.y = this.ptA.y;
          segment.ptB.y = this.ptA.y;

          if (_loc9 == _loc11) {
            segment.ptA.x = this.ptA.x;
            segment.ptB.x = (_loc11 + 1) * resolution;
          } else if (_loc9 == _loc7) {
            segment.ptA.x = _loc7 * resolution;
            segment.ptB.x = this.ptB.x;
          } else {
            segment.ptA.x = _loc9 * resolution;
            segment.ptB.x = (_loc9 + 1) * resolution;
          }

          if (segment.ptA.x != segment.ptB.x) {
            segments.push(segment);
          }
        }
      } else {
        for (let _loc9 = _loc11; _loc9 >= _loc7; --_loc9) {
          const segment = new Segment();
          segment.init();
          segment.ptA.y = this.ptA.y;
          segment.ptB.y = this.ptA.y;

          if (_loc9 == _loc11) {
            segment.ptA.x = this.ptA.x;
            segment.ptB.x = _loc11 * resolution;
          } else if (_loc9 == _loc7) {
            segment.ptA.x = (_loc7 + 1) * resolution;
            segment.ptB.x = this.ptB.x;
          } else {
            segment.ptA.x = (_loc9 + 1) * resolution;
            segment.ptB.x = _loc9 * resolution;
          }

          if (segment.ptA.x != segment.ptB.x) {
            segments.push(segment);
          }
        }
      }
    } else {
      this.lineCoef();
      let _loc5 = _loc11;
      let _loc4 = _loc10;
      const point = new DDpoint();
      point.x = this.ptA.x;
      point.y = this.ptA.y;

      if (this.ptB.x > this.ptA.x && this.ptB.y > this.ptA.y) {
        while (
          _loc5 <= _loc7 &&
          _loc4 <= _loc6 &&
          (_loc5 != _loc7 || _loc4 != _loc6)
        ) {
          const segment = new Segment();
          segment.init();
          segment.ptA.x = point.x;
          segment.ptA.y = point.y;
          const _loc12 = this.a * (_loc5 + 1) * resolution + this.b;

          if (_loc12 > (_loc4 + 1) * resolution) {
            ++_loc4;
            point.y = _loc4 * resolution;
            point.x = (_loc4 * resolution - this.b) / this.a;
          } else {
            ++_loc5;
            point.x = _loc5 * resolution;
            point.y = _loc12;
          }

          segment.ptB.x = point.x;
          segment.ptB.y = point.y;

          if (
            segment.ptA.x != segment.ptB.x ||
            segment.ptA.y != segment.ptB.y
          ) {
            segments.push(segment);
          }
        }
      } else if (this.ptB.x < this.ptA.x && this.ptB.y > this.ptA.y) {
        while (
          _loc5 >= _loc7 &&
          _loc4 <= _loc6 &&
          (_loc5 != _loc7 || _loc4 != _loc6)
        ) {
          const segment = new Segment();
          segment.init();
          segment.ptA.x = point.x;
          segment.ptA.y = point.y;
          const _loc12 = this.a * _loc5 * resolution + this.b;

          if (_loc12 >= (_loc4 + 1) * resolution) {
            ++_loc4;
            point.y = _loc4 * resolution;
            point.x = (_loc4 * resolution - this.b) / this.a;
          } else {
            point.x = _loc5 * resolution;
            --_loc5;
            point.y = _loc12;
          }

          segment.ptB.x = point.x;
          segment.ptB.y = point.y;

          if (
            segment.ptA.x != segment.ptB.x ||
            segment.ptA.y != segment.ptB.y
          ) {
            segments.push(segment);
          }
        }
      } else if (this.ptB.x < this.ptA.x && this.ptB.y < this.ptA.y) {
        while (
          _loc5 >= _loc7 &&
          _loc4 >= _loc6 &&
          (_loc5 != _loc7 || _loc4 != _loc6)
        ) {
          const segment = new Segment();
          segment.init();
          segment.ptA.x = point.x;
          segment.ptA.y = point.y;
          const _loc12 = this.a * _loc5 * resolution + this.b;

          if (_loc12 > _loc4 * resolution) {
            point.x = _loc5 * resolution;
            --_loc5;
            point.y = _loc12;
          } else {
            point.y = _loc4 * resolution;
            --_loc4;
            point.x = (_loc4 * resolution - this.b) / this.a;
          }

          segment.ptB.x = point.x;
          segment.ptB.y = point.y;

          if (
            segment.ptA.x != segment.ptB.x ||
            segment.ptA.y != segment.ptB.y
          ) {
            segments.push(segment);
          }
        }
      } else if (this.ptB.x > this.ptA.x && this.ptB.y < this.ptA.y) {
        while (
          _loc5 <= _loc7 &&
          _loc4 >= _loc6 &&
          (_loc5 != _loc7 || _loc4 != _loc6)
        ) {
          const segment = new Segment();
          segment.init();
          segment.ptA.x = point.x;
          segment.ptA.y = point.y;
          const _loc12 = this.a * (_loc5 + 1) * resolution + this.b;

          if (_loc12 >= _loc4 * resolution) {
            ++_loc5;
            point.x = _loc5 * resolution;
            point.y = _loc12;
          } else {
            point.y = _loc4 * resolution;
            --_loc4;
            point.x = (_loc4 * resolution - this.b) / this.a;
          }

          segment.ptB.x = point.x;
          segment.ptB.y = point.y;

          if (
            segment.ptA.x != segment.ptB.x ||
            segment.ptA.y != segment.ptB.y
          ) {
            segments.push(segment);
          }
        }
      }

      const segment = new Segment();
      segment.init();
      segment.ptA.x = point.x;
      segment.ptA.y = point.y;
      segment.ptB.x = this.ptB.x;
      segment.ptB.y = this.ptB.y;

      if (segment.ptA.x != segment.ptB.x || segment.ptA.y != segment.ptB.y) {
        segments.push(segment);
      }
    }

    return segments;
  }

  getPointProjectedOrtho(pt: DDpoint): DDpoint {
    const projectedPoint = new DDpoint();
    projectedPoint.init();

    if (this.ptA.x == this.ptB.x) {
      projectedPoint.x = this.ptA.x;
      projectedPoint.y = pt.y;
    } else if (this.ptA.y == this.ptB.y) {
      projectedPoint.x = pt.x;
      projectedPoint.y = this.ptA.y;
    } else {
      const _loc4 = -1 / this.a;
      const _loc5 = pt.y - _loc4 * pt.x;
      projectedPoint.x = (this.b - _loc5) / (_loc4 - this.a);
      projectedPoint.y = this.a * projectedPoint.x + this.b;
    }

    return projectedPoint;
  }

  duplicate(): Segment {
    const duplicatedSegment = new Segment();
    duplicatedSegment.init();
    duplicatedSegment.ptA.x = this.ptA.x;
    duplicatedSegment.ptA.y = this.ptA.y;
    duplicatedSegment.ptB.x = this.ptB.x;
    duplicatedSegment.ptB.y = this.ptB.y;
    return duplicatedSegment;
  }

  lineCoef(): void {
    this.a = (this.ptB.y - this.ptA.y) / (this.ptB.x - this.ptA.x);
    this.b = this.ptA.y - this.a * this.ptA.x;
  }

  init(): void {
    this.ptA = new DDpoint();
    this.ptB = new DDpoint();
    this.ptA.init();
    this.ptB.init();
  }
}
