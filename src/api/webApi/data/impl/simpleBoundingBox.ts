import { BoundingBox } from '../boundingBox.interface';
import * as turf from '@turf/turf';
import { Feature, BBox } from '@turf/turf';

export class SimpleBoundingBox implements BoundingBox {

  private id: string;
  private bounded: boolean;
  private maxLat: number;
  private maxLon: number;
  private minLat: number;
  private minLon: number;

  public constructor(
    maxLat: null | number,
    maxLon: null | number,
    minLat: null | number,
    minLon: null | number,
  ) {
    this.bounded = (
      (null != maxLat)
      && (null != maxLon)
      && (null != minLat)
      && (null != minLon)
    );

    if (this.bounded) {
      this.maxLat = maxLat!.valueOf();
      this.maxLon = maxLon!.valueOf();
      this.minLat = minLat!.valueOf();
      this.minLon = minLon!.valueOf();
    }
  }

  public static isDifferent(bbox1: BoundingBox, bbox2: BoundingBox): boolean {
    const bbox1Array = (bbox1 == null) ? [] : bbox1.asArray();
    const bbox2Array = (bbox2 == null) ? [] : bbox2.asArray();

    return (JSON.stringify(bbox1Array) !== (JSON.stringify(bbox2Array)));
  }

  public static makeFromArray(boundsArray: Array<unknown>): BoundingBox {
    return new SimpleBoundingBox(
      Number(boundsArray[0]).valueOf(),
      Number(boundsArray[1]).valueOf(),
      Number(boundsArray[2]).valueOf(),
      Number(boundsArray[3]).valueOf(),
    );
  }

  public static makeUnbounded(): BoundingBox {
    return new SimpleBoundingBox(null, null, null, null);
  }

  /**
   * Calculates the bbox of a feature and returns a bounding box
   */
  public static makeBBox(feature: Feature): BoundingBox {
    const bbox: BBox = turf.bbox(feature); // minX, minY maxX, maxY
    return new SimpleBoundingBox(bbox[3], bbox[2], bbox[1], bbox[0]);
  }

  getId(): string {
    return this.id;
  }

  getMaxLat(): number {
    return this.maxLat;
  }
  getMaxLon(): number {
    return this.maxLon;
  }
  getMinLat(): number {
    return this.minLat;
  }
  getMinLon(): number {
    return this.minLon;
  }
  isBounded(): boolean {
    return this.bounded;
  }
  asArray(): [number, number, number, number] {
    return [
      this.getMaxLat(),
      this.getMaxLon(),
      this.getMinLat(),
      this.getMinLon(),
    ];
  }

  asArrayFormat(format = 'nesw'): [number, number, number, number] {
    let result: [number, number, number, number] = this.asArray();
    switch (format) {
      case 'nswe':
        result = [
          this.getMaxLat(),
          this.getMinLat(),
          this.getMinLon(),
          this.getMaxLon(),
        ];
        break;

      default:
        break;
    }
    return result;
  }

  setId(id: string): SimpleBoundingBox {
    this.id = id;
    return this;
  }
}
