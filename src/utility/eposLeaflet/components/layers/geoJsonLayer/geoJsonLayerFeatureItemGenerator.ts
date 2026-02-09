import { FeatureDisplayItemGenerator } from '../../featureDisplay/featureDisplayItemGenerator';
import { MapLayer } from '../mapLayer.abstract';
import { GeoJsonObject, Feature, GeometryObject, Geometry } from 'geojson';
import { FeatureDisplayItem } from '../../featureDisplay/featureDisplayItem';
import * as L from 'leaflet';
import * as turf from '@turf/turf';

/** The `GeoJsonLayerFeatureItemGenerator` class is responsible for generating feature display items
based on GeoJSON data and handling click events on those features. */
export class GeoJsonLayerFeatureItemGenerator implements FeatureDisplayItemGenerator {

  /** The line `public jsonFeatureIdentifier = true; // used for type evaluation` is declaring a public
  property `jsonFeatureIdentifier` with a value of `true`. This property is used for type evaluation,
  which means it can be used to determine the type of an object or variable at runtime. */
  public jsonFeatureIdentifier = true; // used for type evaluation

  /** The line `protected fixedClickBufferPx = 3;` is declaring a protected property `fixedClickBufferPx`
  with a default value of `3`. This property is used to determine the buffer size in pixels for click
  events on features in the GeoJsonLayerFeatureItemGenerator class. */
  protected fixedClickBufferPx = 3;

  /** The line `protected clickBufferPxFunc: (feature: Feature) => number;` is declaring a protected
  property `clickBufferPxFunc` with a function type. This property is used to determine the buffer
  size in pixels for click events on features in the GeoJsonLayerFeatureItemGenerator class. The
  function takes a `Feature` object as a parameter and returns a number representing the buffer size
  in pixels. This allows for dynamic buffer sizes based on the specific feature being clicked. */
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
   * The function `getFeatureDisplayItems` takes a click event and returns a promise that resolves to
   * an array of `FeatureDisplayItem` objects based on the clicked location and the provided geoJson
   * data.
   * @param clickEvent - The `clickEvent` parameter is of type `L.LeafletMouseEvent`, which represents
   * a mouse event that occurred on a Leaflet map. It contains information about the event, such as the
   * coordinates of the click and the target element that was clicked.
   * @returns a Promise that resolves to an array of FeatureDisplayItem objects.
   */
  public getFeatureDisplayItems(
    clickEvent: L.LeafletMouseEvent,
  ): Promise<Array<FeatureDisplayItem>> {
    return new Promise((resolve) => {
      const featureItemsMap = new Map<number, FeatureDisplayItem>();
      if (this.geoJsonData != null && JSON.stringify(this.geoJsonData) !== '{}' && (this.geoJsonData.type !== undefined && this.geoJsonData.type.toString() !== 'Coverage')) {
        const fixedClickBufferMeters = this.getZoomBufferSize(clickEvent.latlng, this.fixedClickBufferPx);
        turf.flattenEach(
          this.geoJsonData as Feature<Geometry, Record<string, unknown>>,
          (feature: Feature<Geometry, Record<string, unknown>>, featureIndex: number,
          ) => {
            if (!featureItemsMap.has(featureIndex)) {
              const clickBufferMeters = (null != this.clickBufferPxFunc)
                ? this.getZoomBufferSize(clickEvent.latlng, this.clickBufferPxFunc(feature))
                : fixedClickBufferMeters;


              if (this.pointInFeature(feature, clickEvent.latlng, clickBufferMeters)) {

                featureItemsMap.set(featureIndex,
                  new FeatureDisplayItem(
                    feature,
                    () => this.featureDisplayContentFunc(feature),
                    (event: MouseEvent) => this.featureContentClickFunc(event, feature)
                  )
                );
              }
            }
          });
      }
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
