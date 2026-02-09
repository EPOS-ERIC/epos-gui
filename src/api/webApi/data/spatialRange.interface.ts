import { Feature } from '@turf/turf';

export interface SpatialRange {

  isUnbounded(): boolean;
  isUnknown(): boolean;
  isBounded(): boolean;

  /**
   * Does this spatial range intersect with the specified one.
   * @param SpatialRange
   */
  intersects(spatialRange: SpatialRange): boolean;


  getFeatures(): Array<Feature>;
}
