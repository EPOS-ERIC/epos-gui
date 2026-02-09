import * as L from 'leaflet';
import {
  EposLeafletComponent, MapLayer, GeoJsonLayerFeatureItemGenerator, FeatureDisplayItem, Legend
} from 'utility/eposLeaflet/eposLeaflet';
import * as JP from 'jsonpath';
import { ObjectHelper } from './objectHelper';
import { Stylable } from 'utility/styler/stylable.interface';
import { GeoJSONHelper } from './geoJSONHelper';
import { Injector } from '@angular/core';
import { Feature, GeoJsonObject, GeoJsonProperties, GeometryObject, Point } from 'geojson';
import { FeatureCollection } from '@turf/turf';
import { PopupProperty } from './popupProperty';
import { JsonMapLayer } from './jsonMapLayer';
import { JsonHelper } from './jsonHelper';
import { HttpClient } from '@angular/common/http';


export class GeoJSONMapLayer extends JsonMapLayer {

  public north: number;
  public west: number;
  public south: number;
  public east: number;

  public dataAsFC: FeatureCollection;

  constructor(
    injector: Injector,
    id: string,
    name: string,
    protected stylable: Stylable,
    getDataFunction: () => Promise<GeoJsonObject>,
    mapConfig: EposLeafletComponent,
  ) {
    super(injector, id, name, stylable);

    this.setPreLayerAddFunction(() => {

      return getDataFunction()
        .then((data: GeoJsonObject) => {

          // check imageoverlay is present
          if (!this.hasImageOverlay(data)) {
            this.setLayerClickFeatureItemGenerator(
              new GeoJsonLayerFeatureItemGenerator(
                this,
                data,
                (feature: Feature<GeometryObject, Record<string, unknown>>) => {
                  return GeoJSONHelper.getPopupContentFromProperties(feature.properties, this.layerName);
                },
                (ev: MouseEvent, feature: Feature<GeometryObject, Record<string, unknown>>) => {
                  JsonHelper.popupClick(ev, this.executionService, this.authenticatedClickService);
                })
            );


            // remove image layers in display data
            this.setGeoJsonData(this.filterOutImageLayers(data));
            this.initData();

            // check if cluster options is true on layer stylable
            if (stylable !== null) {
              const clustering = stylable.getStyle()!.getClustering() ?? false;
              this.tryAddClustering(mapConfig, stylable, clustering);
            }
          }

        })
        .catch((r) => {
          console.warn(`Failed to populate GeoJson data of '${name}' layer.`);
          console.warn(r);
        });
    })
      .setTooltipFunction((feature: Feature<GeometryObject, Record<string, unknown>>): string => {
        if (this.id.includes(MapLayer.BBOX_LAYER_ID) || this.id.includes(MapLayer.BBOX_EDITABLE_LAYER_ID)) {
          return this.name;
        } else {
          return JsonHelper.getLabelFromProperties(feature.properties, this.layerName);
        }
      })
      .setPointToLayerFunction(this.pointToLayer.bind(this) as null | ((geoJsonPoint: Feature<Point, Record<string, unknown>>, latlng: L.LatLng) => L.Layer))
      .setFeatureDisplayContentFunc((feature: Feature<GeometryObject, Record<string, unknown>>) => {
        return GeoJSONHelper.getPopupContentFromProperties(feature.properties, this.layerName);
      })
      .setFeatureContentClickFunc((ev: MouseEvent, feature: Feature<GeometryObject, Record<string, unknown>>) => {
        JsonHelper.popupClick(ev, this.executionService, this.authenticatedClickService);
      })
      .setStylingFunction(() => {
        this.options.customLayerOptionOpacity.set(this.getStylableOpacity(this.stylable));
        this.options.customLayerOptionColor.set(this.getStylableColor1(this.stylable));
        this.options.customLayerOptionFillColor.set(this.getStylableColor2(this.stylable));
        this.options.customLayerOptionFillColorOpacity.set(this.getStylableFillOpacity(this.stylable));
        this.options.customLayerOptionWeight.set(this.getWeight(this.stylable));
        this.options.customLayerOptionMarkerIconSize.set(this.getStylableSize(this.stylable));

        this.options.customLayerOptionStylable.set(stylable as Stylable);

        return {
          color: this.getStylableColor1(this.stylable),
        };
      })
      .setLegendCreatorFunction(this.createLegend.bind(this) as (layer: MapLayer, http: HttpClient) => Promise<null | Array<Legend>>)

      .setPostLayerAddFunction(() => {
        (this.getLayerClickFeatureItemGenerator() as GeoJsonLayerFeatureItemGenerator)
          .setFixedZoomBufferPx(this.CIRCLE_MARKER_RADIUS_PX);
        return Promise.resolve();
      });
  }


  /**
   * The function retrieves a feature display item by its ID from a GeoJSON data object.
   * @param {Array<number> | string | undefined} propertyId - The `propertyId` parameter can be of type
   * `Array<number>`, `string`, or `undefined`. It represents the ID(s) of the property or properties you
   * want to retrieve the feature display item(s) for.
   * @param {string} layerName - The `layerName` parameter is a string that represents the name of the
   * layer in the GeoJSON data.
   * @returns a Promise that resolves to an array of FeatureDisplayItem objects or void (undefined).
   */
  public getFeatureDisplayItemById(propertyId: Array<number> | string | undefined, layerName: string): Promise<Array<FeatureDisplayItem> | void> {
    const data = this.getGeoJsonData();
    if (data.type === 'FeatureCollection') {
      const featureCollection = data as FeatureCollection;

      return GeoJSONHelper.getFeatureDisplayItemById(featureCollection.features as Array<Feature>, propertyId, layerName);
    }
    return Promise.resolve();
  }

  // filter out the image features that don't have any geometry (badly formed?)
  private filterOutImageLayers(data: GeoJsonObject): GeoJsonObject {
    // clone so's not to affect the original object
    data = JSON.parse(JSON.stringify(data)) as GeoJsonObject;
    if (data.type === 'FeatureCollection') {
      const featureCollection = data as FeatureCollection;
      featureCollection.features = featureCollection.features.filter(feature => null != feature.geometry);
    }
    return data;
  }

  private initData(): void {
    // Color comes from Style obj
    // e.g. style.getColor1String()    (background/main)
    // e.g. style.getColor2String()    (contrast colour)

    // Read the geo json to construct the legend and styling callbacks
    // ----------------------------------------------------------------------------------

    // The plan is to use jsonpath to locate objects of interest,
    // but there is some weird behaviour in that it doesn't' treat
    // root objects the same way as more deeply nested objects.
    // Hence the data object will be arificially nested to allow
    // all objects to be viable results from jsonpath.query().

    const root: Record<string, unknown> = {};
    root.root = [this.geoJsonData];

    // ----------------------------------------------------------------------------------
    // Styling Algorithm:
    // 1. look for all FeatureCollections
    // 2. does the FeatureCollection have GeoJSONHelper.STYLE_ATTR
    // 3. create style objects that can be assigned to features based on type
    // 4. iterate through features
    // 5. does Feature have a type - look up the style | default
    // 6. assign feature a style ID
    // 7. map ID to style
    // 8. in the styling callback use the id to pickup the style to use.
    // 9. in the legend callback use the id to pickup the styles to list.

    const styleIdGenerator = 0;
    let styleTypeToId = new Map<null | string, number>();

    // start from FeatureCollection
    let jsonRoot = JP.query(root, '$..*[?(@.type=="FeatureCollection")]');

    // Get all feature collections
    jsonRoot
      .forEach(featureCollection => {

        // See if there is an GeoJSONHelper.STYLE_ATTR object (if there isn't any point continuing)
        const externalStyles = ObjectHelper.getObjectValue<Record<string, unknown>>(featureCollection as Record<string, unknown>, GeoJSONHelper.STYLE_ATTR);
        if (null != externalStyles) {
          styleTypeToId = this.setStyleFromPayload(externalStyles, styleIdGenerator);
        }
      });

    // Features
    // if featureCollection contains features otherwise it looks for features from root
    jsonRoot = JP.query(jsonRoot.length === 0 ? root : jsonRoot, '$..*[?(@.type=="Feature")]');

    jsonRoot.forEach((feature: Feature<GeometryObject, GeoJsonProperties>, index: number) => {
      const featureType = (feature.geometry != null) ? feature.geometry.type : '';
      const externalType = (feature.properties != null) ? ObjectHelper.getObjectValue<string>(feature.properties, GeoJSONHelper.TYPE_ATTR) : null;
      // See if there is an GeoJSONHelper.TYPE_ATTR object (if there isn't no point continuing)
      const styleId = styleTypeToId.get(externalType);
      if (null != styleId) {
        if (null == feature.properties) {
          feature.properties = {};
        }
        feature.properties[GeoJSONHelper.STYLE_ID_ATTR] = styleId;
        this.options.customLayerOptionHasMarker.set(true);
      } else if (null != featureType) {
        this.options.customLayerOptionHasMarker.set(true);
        switch (featureType.toLowerCase()) {
          case ('point'): {
            this.options.customLayerOptionMarkerType.set(MapLayer.MARKERTYPE_POINT);
            break;
          }
          case ('linestring'):
          case ('multilinestring'): {
            this.options.customLayerOptionMarkerType.set(MapLayer.MARKERTYPE_LINE);
            break;
          }
          default: {
            this.options.customLayerOptionMarkerType.set(MapLayer.MARKERTYPE_POLYGON);
            break;
          }
        }
      }

      // add feature identifier
      if (feature.properties !== null) {
        feature.properties[PopupProperty.PROPERTY_ID] = this.id + '#' + index.toString() + '#';
      }
    });

  }

}
