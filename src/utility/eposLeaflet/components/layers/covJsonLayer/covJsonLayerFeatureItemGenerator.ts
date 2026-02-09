import { FeatureDisplayItemGenerator } from '../../featureDisplay/featureDisplayItemGenerator';
import { MapLayer } from '../mapLayer.abstract';
import { Feature, GeoJsonObject, GeometryObject } from 'geojson';
import { FeatureDisplayItem } from '../../featureDisplay/featureDisplayItem';
import * as L from 'leaflet';
import * as turf from '@turf/turf';

/** The `CovJsonLayerFeatureItemGenerator` class is a TypeScript class that generates feature display
items for a map layer using GeoJSON data. */
export class CovJsonLayerFeatureItemGenerator implements FeatureDisplayItemGenerator {

  /** The line `public jsonFeatureIdentifier = true; // used for type evaluation` is declaring a public
  property `jsonFeatureIdentifier` with a default value of `true`. This property is used for type
  evaluation, which means it can be used to determine the type of an object or variable at runtime. */
  public jsonFeatureIdentifier = true; // used for type evaluation

  /** The line `protected fixedClickBufferPx = 3;` is declaring a protected property `fixedClickBufferPx`
  with a default value of `3`. This property is used to determine the buffer size in pixels for click
  events on features. By default, it is set to 3 pixels. */
  protected fixedClickBufferPx = 3;

  /** The line `protected clickBufferPxFunc: (feature: Feature) => number;` is declaring a protected
  property `clickBufferPxFunc` with a function type. This property is used to determine the buffer
  size in pixels for click events on features. The function takes a `Feature` object as a parameter
  and returns a number representing the buffer size in pixels. By providing a custom function for
  `clickBufferPxFunc`, you can dynamically calculate the buffer size based on the feature properties
  or other factors. */
  protected clickBufferPxFunc: (feature: Feature) => number;

  /**
   * The constructor takes in a map layer, geoJson data, a function to display feature content, and a
   * function to handle feature content click events.
   * @param {MapLayer} mapLayer - The `mapLayer` parameter is of type `MapLayer` and represents the
   * layer on which the GeoJSON data will be displayed. It is used to add the GeoJSON data to the map
   * layer.
   * @param {GeoJsonObject} geoJsonData - The `geoJsonData` parameter is a GeoJSON object that
   * represents geographic features and their properties. It can be used to display and interact with
   * the features on a map.
   * @param featureDisplayContentFunc - The `featureDisplayContentFunc` parameter is a function that
   * takes a `feature` object of type `Feature<GeometryObject, Record<string, unknown>>` as input and
   * returns a string. This function is responsible for generating the content that will be displayed
   * for each feature on the map.
   * @param featureContentClickFunc - The `featureContentClickFunc` parameter is a function that takes
   * two arguments: an event of type `MouseEvent` and a feature of type `Feature<GeometryObject,
   * Record<string, unknown>>`. This function is called when a user clicks on the content of a feature
   * on the map.
   */
  constructor(
    protected mapLayer: MapLayer,
    protected geoJsonData: GeoJsonObject,
    protected featureDisplayContentFunc: (feature: Feature<GeometryObject, Record<string, unknown>>) => string,
    protected featureContentClickFunc: (event: MouseEvent, feature: Feature<GeometryObject, Record<string, unknown>>) => void,
  ) { }

  /**
   * The function sets the fixed click buffer size in pixels.
   * @param {number} pxCount - The `pxCount` parameter is a number that represents the number of pixels
   * for the fixed zoom buffer.
   */
  public setFixedZoomBufferPx(pxCount: number): void {
    this.fixedClickBufferPx = pxCount;
  }
  /**
   * The function sets a click buffer in pixels for a given feature.
   * @param clickBufferPxFunc - The clickBufferPxFunc parameter is a function that takes a feature as
   * input and returns a number.
   */
  public setClickBufferPxFunc(clickBufferPxFunc: (feature: Feature) => number): void {
    this.clickBufferPxFunc = clickBufferPxFunc;
  }

  /**
   * The function returns a promise that resolves to an array of FeatureDisplayItems.
   * @param clickEvent - The `clickEvent` parameter is of type `L.LeafletMouseEvent`. It represents the
   * mouse event that occurred when the user clicked on a Leaflet map.
   * @returns a Promise that resolves to an array of FeatureDisplayItem objects.
   */
  public getFeatureDisplayItems(
    clickEvent: L.LeafletMouseEvent,
  ): Promise<Array<FeatureDisplayItem>> {
    return new Promise((resolve) => {
      const featureItemsMap = new Map<number, FeatureDisplayItem>();
      resolve(Array.from(featureItemsMap.values()));
    });
  }

  /**
   * The function checks if a given point is within a buffered feature.
   * @param {Feature} feature - The feature parameter represents a geographic feature, such as a
   * polygon or a point. It is used to define the shape or area that you want to check if a point is
   * inside.
   * @param point - The `point` parameter is an object representing a geographical point on the map. It
   * has two properties: `lng` (longitude) and `lat` (latitude). These properties specify the
   * coordinates of the point.
   * @param {number} metersBuffer - The `metersBuffer` parameter is a number that represents the
   * distance in meters by which the feature should be buffered. The buffer is created around the
   * feature, expanding its boundaries by the specified distance.
   * @returns a boolean value.
   */
  protected pointInFeature(feature: Feature, point: L.LatLng, metersBuffer: number): boolean {
    const turfClickPoint = turf.point([point.lng, point.lat]);
    let returnVal = false;
    const bufferedFeature = turf.buffer(feature, metersBuffer, { units: 'meters' });
    returnVal = turf.booleanPointInPolygon(turfClickPoint, bufferedFeature);
    return returnVal;
  }

  /**
   * The function calculates the distance between a given latitude and longitude point and a reference
   * point based on a buffer size in pixels.
   * @param latLng - The `latLng` parameter is an object representing a geographical point on the map.
   * It typically consists of two properties: `lat` (latitude) and `lng` (longitude).
   * @param {number} bufferPx - The parameter `bufferPx` represents the number of pixels to buffer
   * around the given `latLng` point. It is used to calculate the distance between the original
   * `latLng` point and a reference point that is `bufferPx` pixels away in both the x and y
   * directions.
   * @returns the distance between the given `latLng` and the reference `refLatLng`.
   */
  protected getZoomBufferSize(latLng: L.LatLng, bufferPx: number): number {
    const leafletMapObj = this.mapLayer.getEposLeaflet().leafletMapObj;
    const clickPoint = leafletMapObj.latLngToContainerPoint(latLng);

    // latLng px up and right
    const refLatLng = leafletMapObj.containerPointToLatLng(L.point(
      clickPoint.x + bufferPx,
      clickPoint.y + bufferPx,
    ));

    return latLng.distanceTo(refLatLng);
  }
}
