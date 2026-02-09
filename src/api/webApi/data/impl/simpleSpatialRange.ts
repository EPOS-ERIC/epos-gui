import { SpatialRange } from '../spatialRange.interface';
import * as turf from '@turf/turf';
import { Polygon, Feature } from '@turf/turf';
import { BoundingBox } from '../boundingBox.interface';

export class SimpleSpatialRange implements SpatialRange {

  private constructor(private readonly features: Array<Feature>, private readonly type: SpatialRangeType) { }


  /**
   * Bounded single point
   * point: [x1,y1]
   */
  public static makePoint(xLong: number, yLat: number): SpatialRange {
    const features: Array<Feature> = [turf.point([xLong, yLat])];
    return new SimpleSpatialRange(features, SpatialRangeType.BOUNDED);
  }

  /**
   * Unknown spatial range - never matches anything
   */
  public static makeUnknown(): SpatialRange {
    const features: Array<Feature<Polygon>> = [];
    return new SimpleSpatialRange(features, SpatialRangeType.UNKNOWN);
  }

  /**
   * Unbounded - matches everything spatially.
   */
  public static makeUnbounded(): SpatialRange {
    const features: Array<Feature<Polygon>> = [];
    return new SimpleSpatialRange(features, SpatialRangeType.UNBOUNDED);
  }

  /**
   * Bounded rectangle
   * @param north
   * @param south
   * @param east
   * @param west
   */
  public static makeGeoRect(bounds: BoundingBox): SpatialRange {
    const north = bounds.getMaxLat();
    const south = bounds.getMinLat();
    const east = bounds.getMaxLon();
    const west = bounds.getMinLon();

    const features: Array<Feature<Polygon>> = [];

    if (west > east) {
      // crosses antimeridian - split
      const poly1Data = [[[west, south], [west, north], [180, north], [180, south], [west, south]]];
      const poly2Data = [[[-180, south], [-180, north], [east, north], [east, south], [-180, south]]];
      const poly1: Feature<Polygon> = turf.polygon(poly1Data);
      const poly2: Feature<Polygon> = turf.polygon(poly2Data);

      features.push(poly1);
      features.push(poly2);
    } else {
      const poly: Feature<Polygon> = turf.polygon([[[west, south], [west, north], [east, north], [east, south], [west, south]]]);
      features.push(poly);
    }
    return new SimpleSpatialRange(features, SpatialRangeType.BOUNDED);
  }

  /**
   * Bounded on N polygons.
   *
   * Assumed coordiantes for N polygon is porvided as linear rings.
   *
   * e.g.
   * | -------------------------- n polygons ------------------------|
   *   |-------- polygon 1 --------|   |-------- polygon 2 --------|
   *     |start|   |-nth-| |start|       |start|   |-nth-| |start|
   * [ [ [x1,y1]...[xN,yN],[x1,y1] ] , [ [x1,y1]...[xN,yN],[x1,y1] ] ]
   * @param coordinatesArrays
   */
  public static makeNPoly(coordinatesArrays: Array<Array<Array<number>>>): SpatialRange {

    const globe = turf.polygon([[[-180, -90], [-180, 90], [180, 90], [180, -90], [-180, -90]]]);
    const features: Array<Feature<Polygon>> = [];
    let wholeGlobe = false;

    coordinatesArrays.forEach((coordinatesArray: Array<Array<number>>) => {
      const poly: Feature<Polygon> = turf.polygon([coordinatesArray]);

      if (turf.booleanEqual(globe, poly) || turf.booleanWithin(globe, poly)) {
        wholeGlobe = true;
      }
      features.push(poly);
    });

    return wholeGlobe ? SimpleSpatialRange.makeUnbounded() : new SimpleSpatialRange(features, SpatialRangeType.BOUNDED);

  }


  getFeatures(): Array<Feature> {
    return this.features;
  }

  isUnbounded(): boolean {
    return this.type === SpatialRangeType.UNBOUNDED;
  }

  isBounded(): boolean {
    return this.type === SpatialRangeType.BOUNDED;
  }

  isUnknown(): boolean {
    return this.type === SpatialRangeType.UNKNOWN;
  }

  public toString(): string {
    let s = 'SpatialRange: ';

    if (this.isUnbounded()) {
      s = s + 'unbounded';
    } else {

      for (let index = 0; index < this.features.length; index++) {
        const polygon: Feature = this.features[index];
        s = s + '\npolygon(' + String(index) + ') coordinates: ' + String(polygon.geometry);
      }
    }

    return s;
  }

  /**
   *
   * @param spatialRange
   */
  intersects(spatialRange: SpatialRange): boolean {

    // The order of these if statement are important.
    if (this.isUnbounded() || spatialRange.isUnbounded()) {
      return true;
    } else if (this.isUnknown() || spatialRange.isUnknown()) {
      return false;
    } else {
      const intersectFeature = this.features.find((thisFeatures: Feature) => {
        const intersectFeature2 = spatialRange.getFeatures().find((otherFeature: Feature) => {
          return (false === turf.booleanDisjoint(thisFeatures, otherFeature));
        });
        return (null != intersectFeature2);
      });
      return (null != intersectFeature);
    }
  }

}
enum SpatialRangeType {
  BOUNDED,
  UNBOUNDED,
  UNKNOWN,
}
