import { Point } from 'api/webApi/data/impl/simplePoint';
import { Located } from 'api/webApi/data/located.interface';


export class SimpleLocation implements Located {
  private readonly points: Array<Point> = [];

  constructor(points?: Array<Point>) {
    if (points != null) {
      this.points = points;
    }
  }

  public static createLocation(_lat: string, _long: string, _alt?: string): SimpleLocation {
    const lat = parseFloat(_lat);
    const long = parseFloat(_long);
    const alt = parseFloat(_alt);

    if (!isNaN(lat) && (!isNaN(long))) {
      if (!isNaN(alt)) {
        return new SimpleLocation([new Point(lat, long, alt)]);
      }
      return new SimpleLocation([new Point(lat, long)]);
    } else {
      return null;
    }
  }

  addPoint(point: Point): void {
    this.points.push(point);
  }

  getPoints(): Point[] {
    return this.points;
  }
}



