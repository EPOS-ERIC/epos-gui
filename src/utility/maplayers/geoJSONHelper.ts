import { PopupProperty, PopupPropertyType } from './popupProperty';
import { AuthenticatedLink } from './authenticatedLink';
import { ExecutionService } from 'services/execution.service';
import { Feature, GeometryObject, Point, Position } from 'geojson';
import { AuthenticatedClickService } from 'services/authenticatedClick.service';
import { JsonHelper } from './jsonHelper';
import { FeatureDisplayItem } from 'utility/eposLeaflet/eposLeaflet';
import { ImageOverlayData } from './geoJSONImageOverlayMapLayer';

export class GeoJSONHelper extends JsonHelper {

  public static readonly IMAGE_OVERLAY_ID_SUFFIX = '_geojson_image_layer';
  public static readonly IMAGE_OVERLAY_ATTR = this.ATTR_PREFIX + '_image_overlay';

  /**
   * It takes an array of objects, and returns an array of all the unique property names that exist in
   * those objects
   * @param propertyObjArray - Array<Feature> - This is an array of GeoJSON Feature objects.
   * @param {string} keysObjectId - The objectId of the feature that contains the keys.
   * @returns An array of strings.
   */
  public static getAllPropertiesToUse(propertyObjArray: Array<Feature>, keysObjectId: string): Array<string> {
    const properties: Array<string> = [];

    propertyObjArray.forEach((propertiesObj: Feature) => {
      const propertiesToUse = this.getPropertiesToUse(propertiesObj.properties as Record<string, unknown>, keysObjectId);

      propertiesToUse.forEach((property: PopupProperty) => {
        const name = property.name;
        if (!properties.includes(name)) {
          properties.push(name);
        }
      });
    });

    return properties;
  }

  /**
   * The function `getTableObjectsFromProperties` takes an array of property objects and returns a map of
   * table objects with unique labels for each row.
   * @param propertyObjArray - An array of objects representing properties. Each object should have a
   * "properties" property that contains the property values, and a "geometry" property that contains the
   * geometry data.
   * @returns a Map object called `tableData`, which contains string keys and an array of `null` or
   * `PopupProperty` values.
   */
  public static getTableObjectsFromProperties(
    layerId: string,
    propertyObjArray: Array<Feature>,
  ): Map<string, Array<null | PopupProperty>> {
    const tableData = new Map<string, Array<null | PopupProperty>>();

    // ALL properties
    const propertiesKeyToUse = this.getAllPropertiesToUse(propertyObjArray, this.DATA_KEY_ATTR);

    propertyObjArray.forEach((propertiesObj: Feature, rowIndex: number) => {

      // feature's properties
      const propertiesToUse = this.getPropertiesToUse(propertiesObj.properties as Record<string, unknown>, this.DATA_KEY_ATTR);

      const pointData = propertiesObj.geometry;
      let coords: Position | null = null;

      if (null != pointData) {
        // Handle GeometryCollection
        if (pointData.type === 'GeometryCollection') {
          // Extract first Point from GeometryCollection
          const firstPoint = pointData.geometries?.find(g => g.type === 'Point') as Point | undefined;
          if (firstPoint) {
            coords = firstPoint.coordinates;
          }
        } else if (pointData.type === 'Point') {
          coords = (pointData as Point).coordinates;
        }
        // For other geometry types, coords remains null
      } else {
        // check in epos_image_overlay
        if (null != propertiesObj[this.IMAGE_OVERLAY_ATTR]) {
          const imageOverlayObj = propertiesObj[this.IMAGE_OVERLAY_ATTR] as Record<string, unknown>;
          if (null != imageOverlayObj.bbox) {
            const bbox = imageOverlayObj.bbox as Array<number>;
            const lat = (bbox[0] + bbox[2]) / 2;
            const long = (bbox[1] + bbox[3]) / 2;
            coords = [long, lat];
          }
        }
      }

      /** if geometry data present, add new header and coordinate data to table object. */
      if (null != coords) {
        propertiesToUse.push(new PopupProperty(PopupProperty.LONG_LAT, coords as Position));
        propertiesToUse.push(new PopupProperty(PopupProperty.POINTS_ON_MAP, coords as Position));
      }

      // add property id
      propertiesToUse.push(new PopupProperty(PopupProperty.PROPERTY_ID, [layerId + '#' + rowIndex.toString() + '#']));

      // Map used to assess and handle label re-use issues.
      // This is required as the geoJson format was not designed for use in a table!
      const propertiesRowMap = new Map<string, PopupProperty>();
      const labelCounts = new Map<string, number>();

      // ensure all columns present for this row
      propertiesKeyToUse.forEach((property: string) => {
        if (!propertiesToUse.some(p => p.name === property)) {
          propertiesToUse.push(new PopupProperty(property, [this.NO_DATA]));
        }
      });

      // ensure properties have unique labels within row
      propertiesToUse.forEach((property: PopupProperty) => {
        const label = property.name;
        if (!labelCounts.has(label)) {
          propertiesRowMap.set(label, property);
          labelCounts.set(label, 1);
        } else {
          // set to maps and create new property with the new, unique label
          const previousLabel = labelCounts.get(label) ?? 0;
          const newLabel = `${label} (${previousLabel})`;
          propertiesRowMap.set(newLabel, new PopupProperty(newLabel, property.values, property.type));
          labelCounts.set(label, previousLabel + 1);
        }
      });

      // add to the table data
      propertiesRowMap.forEach((property: PopupProperty, label: string) => {
        // new column found
        if (!tableData.has(label)) {
          // create a new table column, adding blank data for any previous rows
          const previousRowData = (0 === rowIndex) ? [] : new Array<null | PopupProperty>().fill(null, 0, rowIndex);
          tableData.set(label, previousRowData);
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        tableData.get(property.name)!.push(property);
      });

    });

    return tableData;

  }

  public static popupClick(ev: MouseEvent,
    executionService: ExecutionService,
    authenticatedClickService: AuthenticatedClickService,
    property?: PopupProperty
  ): void {
    // respond to popup click events
    const target = ev.target as HTMLElement;
    if (null != target) {

      const link = (null != property)
        ? String(property.values[0]).valueOf()
        : AuthenticatedLink.getUrlFromElement(target);

      const filename = (null != property)
        ? property.authenticatedDownloadFileName
        : AuthenticatedLink.getFilenameFromElement(target);

      // Authenticated download
      if (((null != property) && (PopupPropertyType.AUTHENTICATED_DOWNLOAD === property.type))
        || (AuthenticatedLink.isAuthenticatedLink(target))) {
        if (authenticatedClickService.authenticatedClick()) {

          // open link
          if (null != link) {
            void executionService.doAuthenticatedDownload(link, filename);
          }
        }
      } else if ((null != property) && (PopupPropertyType.SIMPLE === property.type)) {
        if (null != link) {
          void executionService.doDownload(link, filename);
        }
      }
    }
  }

  /**
   * The function checks if all features in an array have an image overlay attribute.
   * @param features - An array of Feature objects.
   * @returns a boolean value.
   */
  public static hasImageOverlay(features: Array<Feature>): boolean {
    let countAllImagesOverlay = 0;

    const countAllFeatures = features.length;
    features.map(feature => {
      const imageOverlayObj = feature[this.IMAGE_OVERLAY_ATTR] as Record<string, unknown>;
      if (undefined !== imageOverlayObj) {
        countAllImagesOverlay++;
      }
    });

    return countAllImagesOverlay === countAllFeatures;
  }


  /**
   * The function `getFeatureDisplayItemById` takes an array of features or image overlay data, a
   * property ID, and a layer name, and returns a promise that resolves to an array of
   * `FeatureDisplayItem` objects or void.
   * @param features - An array of objects that can be either of type Feature or ImageOverlayData. These
   * objects represent the features or image overlays that need to be searched.
   * @param {Array<number> | string | undefined} propertyId - The `propertyId` parameter can be an array
   * of numbers, a string, or undefined.
   * @param {string} layerName - The `layerName` parameter is a string that represents the name of the
   * layer.
   * @returns a Promise that resolves to an array of FeatureDisplayItem objects or void (undefined).
   */
  public static getFeatureDisplayItemById(features: Array<Feature | ImageOverlayData>, propertyId: Array<number> | string | undefined, layerName: string): Promise<Array<FeatureDisplayItem> | void> {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const feature = features.find((f: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return f.properties?.propertyId === propertyId;
    }) as Feature<GeometryObject, Record<string, unknown>>;
    if (feature !== undefined) {
      return Promise.resolve([new FeatureDisplayItem(
        feature,
        () => this.getPopupContentFromProperties(feature.properties, layerName)
      )]);

    }

    return Promise.resolve();
  }

}
