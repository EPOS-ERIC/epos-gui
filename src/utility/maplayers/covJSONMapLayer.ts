import * as L from 'leaflet';
import {
  EposLeafletComponent, GeoJsonLayerFeatureItemGenerator, Legend, MapLayer
} from 'utility/eposLeaflet/eposLeaflet';
import * as JP from 'jsonpath';
import { ObjectHelper } from './objectHelper';
import { Stylable } from 'utility/styler/stylable.interface';
import { Injector } from '@angular/core';
import { Feature, GeoJsonObject, GeoJsonProperties, GeometryObject, Point } from 'geojson';
import { FeatureCollection } from '@turf/turf';
import { PopupProperty } from './popupProperty';
import { JsonMapLayer, Marker } from './jsonMapLayer';
import { CovJSONHelper } from './covJSONHelper';
import { JsonHelper } from './jsonHelper';
import { HttpClient } from '@angular/common/http';
import { GeoJSONHelper } from './geoJSONHelper';


export class CovJSONMapLayer extends JsonMapLayer {

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

          this.setLayerClickFeatureItemGenerator(
            new GeoJsonLayerFeatureItemGenerator(
              this,
              this.processForFeatureIdentification(data),
              (feature: Feature<GeometryObject, Record<string, unknown>>) => {
                return CovJSONHelper.getPopupContentFromProperties(feature.properties, this.layerName);
              },
              (ev: MouseEvent, feature: Feature<GeometryObject, Record<string, unknown>>) => {
                JsonHelper.popupClick(ev, this.executionService, this.authenticatedClickService);
              })
          );

          this.setGeoJsonData(data);

          // add GeoJSONHelper.STYLE_ATTR on data
          this.addStyle();

          this.initData();

          // check if cluster options is true on layer stylable
          if (stylable !== null) {
            const clustering = stylable.getStyle()!.getClustering() ?? false;
            this.tryAddClustering(mapConfig, stylable, clustering);
          }
        })
        .catch((r) => {
          console.warn(`Failed to populate GeoJson data of '${name}' layer.`);
          console.warn(r);
        });

    })
      .setTooltipFunction((feature: Feature<GeometryObject, Record<string, unknown>>): string => {
        return JsonHelper.getLabelFromProperties(feature.properties, this.layerName);
      })
      .setPointToLayerFunction(this.pointToLayer.bind(this) as null | ((geoJsonPoint: Feature<Point, Record<string, unknown>>, latlng: L.LatLng) => L.Layer))
      .setFeatureDisplayContentFunc((feature: Feature<GeometryObject, Record<string, unknown>>) => {
        return CovJSONHelper.getPopupContentFromProperties(feature.properties, this.layerName);
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

      /*
      .setPostLayerAddFunction(() => {
        (this.getLayerClickFeatureItemGenerator() as CovJsonLayerFeatureItemGenerator)
          .setFixedZoomBufferPx(this.CIRCLE_MARKER_RADIUS_PX);
        return Promise.resolve();
      })
      */
      ;

  }


  /**
   * The function creates a Leaflet marker with specified styling and position.
   * @param {Stylable} stylable - Stylable is an object that contains information about the style of
   * the marker, such as color, size, and shape.
   * @param {null | Marker} marker - The `marker` parameter in the `createLeafletMarker` function is a
   * variable that can hold either a `null` value or an instance of the `Marker` class. It is used to
   * specify the marker that will be created on the map at the specified `latlng` coordinates.
   * @param latlng - The `latlng` parameter in the `createLeafletMarker` function represents the
   * geographical coordinates (latitude and longitude) where the marker will be placed on the map. It
   * is of type `L.LatLng`, which is a Leaflet class representing a geographical point.
   * @returns The `createLeafletMarker` method is being called with the parameters `stylable`,
   * `marker`, and `latlng`, and the boolean value `false`. The method is expected to return a
   * `L.Layer` object.
   */
  protected createLeafletMarker(stylable: Stylable, marker: null | Marker, latlng: L.LatLng): L.Layer {
    return super.createLeafletMarker(stylable, marker, latlng, false);
  }

  private addStyle() {
    const style = {
      event: {
        label: 'event',
        marker: {
          anchor: 'C',
          clustering: false,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          fontawesome_class: 'fas fa-circle',
          pin: false,
        }
      }
    };
    this.geoJsonData[GeoJSONHelper.STYLE_ATTR] = style;

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

  // TEST CHANGE <--------

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
    // 1. look for Coverage
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let jsonRoot: any[];

    const jsonRootCC = JP.query(root, '$..*[?(@.type=="CoverageCollection")]');

    const jsonRootC = JP.query(root, '$..*[?(@.type=="Coverage")]');

    let isCoverageCollection = false;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (jsonRootCC.length > 0) {
      isCoverageCollection = true;
      jsonRoot = jsonRootCC;
    }
    else {
      jsonRoot = jsonRootC;
    }



    if (jsonRoot.length > 0) {
      // Refactoring needed: for how the code is set, jsonRoot always contain a single element, so no need for a '.forEach' iteration, instead might be accessing jsonRoot[0] directly
      jsonRoot.forEach((item, index: number) => {

        let lat;
        let long;

        if (isCoverageCollection) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          lat = jsonRoot[index].coverages[index].domain.axes.y.values[0];

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          long = jsonRoot[index].coverages[index].domain.axes.x.values[0];
        }
        else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          lat = jsonRoot[index].domain.axes.y.values[0];

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          long = jsonRoot[index].domain.axes.x.values[0];

        }

        const point = {
          geometry: {
            coordinates: [long, lat],
            type: 'Point'
          },
          properties: {
            [GeoJSONHelper.STYLE_ID_ATTR]: 'event',
            [GeoJSONHelper.TYPE_ATTR]: 'event',
            [GeoJSONHelper.MAP_KEYS_ATTR]: ['Latitude', 'Longitude'],
            ['Latitude']: lat as string,
            ['Longitude']: long as string,
          },
          type: 'Feature',
        };

        // [TO FIX: code for CoverageCollection is returning a single point on map. Access properties correctly to show all available points.]
        // [NULL value for CoverageCollection coords: back-end should pass NULL values for services for which no Map visualization is needed (ex.: WFCatalog)]
        if (isCoverageCollection) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          jsonRoot[0].features = jsonRoot[0].features ? jsonRoot[0].features : [];

          // Add the point to the `features` array
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          jsonRoot[0].features.push(point);
        }
        else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          jsonRoot[0].features = [point];
        }


      });
      /* // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const lat = jsonRoot[0].domain.axes.y.values[0];
      // For Future Reference: value should arrive in the right range from Json
      // check for lat: if not in -90, 90 range -> const lat = '0'; and then check that everything else works fine

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const long = jsonRoot[0].domain.axes.x.values[0];
      // For Future Reference: value should arrive in the right range from Json
      // check for long: if not in -180, 180 range -> const lng = '0'; and then check that everything else works fine

      const point = {
        geometry: {
          coordinates: [long, lat],
          type: 'Point'
        },
        properties: {
          [GeoJSONHelper.STYLE_ID_ATTR]: 'event',
          [GeoJSONHelper.TYPE_ATTR]: 'event',
          [GeoJSONHelper.MAP_KEYS_ATTR]: ['Latitude', 'Longitude'],
          ['Latitude']: lat as string,
          ['Longitude']: long as string,
        },
        type: 'Feature',
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      jsonRoot[0].features = [point]; */
    }

    // See if there is an GeoJSONHelper.STYLE_ATTR object (if there isn't any point continuing)
    const externalStyle = ObjectHelper.getObjectValue<Record<string, unknown>>(jsonRoot[0] as Record<string, unknown>, GeoJSONHelper.STYLE_ATTR);
    if (null != externalStyle) {
      styleTypeToId = this.setStyleFromPayload(externalStyle, styleIdGenerator);
    }

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
          case ('geometrycollection'): {
            // GeometryCollection contains mixed geometry types
            // Treat as polygon for marker type purposes
            this.options.customLayerOptionMarkerType.set(MapLayer.MARKERTYPE_POLYGON);
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
