import * as L from 'leaflet';
import { GeoJsonObject, Feature, GeometryObject, Point } from 'geojson'; //  CoverageCollection
import { MapLayer } from '../mapLayer.abstract';
import { MarkerClusterOptions, MarkerLayer } from '../markerLayer';
import { FaMarker } from '../../marker/faMarker/faMarker';
import { EposLeafletComponent } from '../../eposLeaflet.component';
import { GeoJsonLayerFeatureItemGenerator } from './geoJsonLayerFeatureItemGenerator';
import { LayerWithMarkers } from '../layerWithMarkers.interface';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { PopupProperty } from 'utility/maplayers/popupProperty';
export class GeoJsonMarkerLayer extends MarkerLayer {
  public setMapObject(eposLeaflet: EposLeafletComponent): void {
    this.eposLeaflet = eposLeaflet;
  }
}

export class GeoJsonLayer extends MapLayer implements LayerWithMarkers {

  /** The `protected geoJsonData: GeoJsonObject;` is declaring a protected property named `geoJsonData`
  of type `GeoJsonObject`. This property is used to store the GeoJSON data that will be displayed on
  the map layer. The `GeoJsonObject` type represents a valid GeoJSON object, which can be a feature,
  feature collection, or geometry object. */
  protected geoJsonData: GeoJsonObject;

  /** The `protected dataPromise: Promise<void>;` is declaring a protected property named `dataPromise`
  of type `Promise<void>`. This property is used to store a promise that resolves when the GeoJSON
  data for the layer is fetched. It is used to ensure that the data is only fetched once and
  subsequent calls to fetch the data return the same promise. This helps in avoiding multiple
  requests for the same data. */
  protected dataPromise: Promise<void>;

  /** The above code is declaring a protected variable called "markerLayer" of type GeoJsonMarkerLayer. */
  protected markerLayer: GeoJsonMarkerLayer;

  /** The above code is declaring a protected variable called `geoLayer` which can either be `null` or
  an instance of `L.GeoJSON` class. */
  protected geoLayer: null | L.GeoJSON;

  /** The above code is defining a protected property called `getDataFunc` which is a function that
  returns a Promise of type `GeoJsonObject`. */
  protected getDataFunc: () => Promise<GeoJsonObject>;

  // http://leafletjs.com/reference-1.3.0.html#layer-bindpopup
  /** The above code is defining a protected property called `featureDisplayContentFunc` in a TypeScript
  class. The property is a function that takes a `Feature` object as an argument and returns a
  string. */
  protected featureDisplayContentFunc: (feature: Feature<GeometryObject, Record<string, unknown>>) => string;

  // http://leafletjs.com/reference-1.3.0.html#layer-bindpopup
  /** The above code is declaring a protected property called `tooltipFunction` in a TypeScript class.
  The property is a function that takes a `feature` parameter of type `Feature<GeometryObject,
  Record<string, unknown>>` and returns a string. */
  protected tooltipFunction: (feature: Feature<GeometryObject, Record<string, unknown>>) => string;

  /**
   * The constructor initializes a GeoJsonMarkerLayer with default options.
   * @param {string} id - The `id` parameter is a string that represents the unique identifier for the
   * object being constructed. It is used to differentiate between different instances of the object.
   * @param {string} name - The "name" parameter is a string that represents the name of the object
   * being created.
   */
  constructor(id: string, name: string) {
    super(id, name);
    // Default options
    this.options.setOptions({
      pane: id,
      paneType: 'geoJsonPane',
    });

    this.markerLayer = new GeoJsonMarkerLayer(this.id + '_markers');
  }

  /**
   * The function `getLeafletLayer` returns a Promise that resolves to either `null` or a Leaflet Layer
   * object.
   * @returns The method `getLeafletLayer` returns a Promise that resolves to either `null` or an
   * instance of the `L.Layer` class from the Leaflet library.
   */
  public getLeafletLayer(): Promise<null | L.Layer> {
    return this.populateData().then(() => this.createLayer(this.geoJsonData));
  }

  /**
   * It returns the marker layer
   * @returns The markerLayer
   */
  public getMarkerLayer(): GeoJsonMarkerLayer {
    return this.markerLayer;
  }

  /**
   * The function sets up clustered markers on a map with optional customization options.
   * @param [clustered=true] - A boolean value indicating whether the markers should be clustered or
   * not. If set to true, the markers will be grouped into clusters based on their proximity. If set to
   * false, the markers will be displayed individually without clustering.
   * @param clusterOptions - The clusterOptions parameter is an object that allows you to customize the
   * appearance and behavior of the marker clusters. It can include properties such as clusterIconSize,
   * clusterIconAnchor, spiderfyOnMaxZoom, showCoverageOnHover, and more. These options help you
   * control how the clusters are displayed on
   * @param [enableClusterClickFeatureIdentify=false] - This parameter determines whether or not to
   * enable feature identification when a cluster is clicked. If set to true, the feature
   * identification will be enabled. If set to false, it will be disabled.
   * @param [customClusterClickFunc] - The customClusterClickFunc parameter is an optional function
   * that you can provide to handle the click event on a cluster marker. It takes two parameters: an
   * array of L.Marker objects representing the markers within the cluster, and the click event object
   * (L.LeafletMouseEvent). You can define your own logic
   * @returns the instance of the object on which the function is called.
   */
  public setClusteredMarkers(
    clustered = true,
    clusterOptions = new MarkerClusterOptions(),
    enableClusterClickFeatureIdentify = false,
    customClusterClickFunc?: (markers: Array<L.Marker>, clickEvent: L.LeafletMouseEvent) => void,
  ): this {
    this.markerLayer.setClustered(clustered, clusterOptions, enableClusterClickFeatureIdentify, customClusterClickFunc);
    return this;
  }

  /**
   * The function sets a callback function to retrieve data and optionally calls it immediately.
   * @param getDataFunc - getDataFunc is a function that returns a Promise of type GeoJsonObject. This
   * function is used to retrieve data asynchronously.
   * @param [callImmediately=true] - The `callImmediately` parameter is a boolean value that determines
   * whether the `populateData` function should be called immediately after setting the `getDataFunc`
   * function. If `callImmediately` is set to `true`, the `populateData` function will be called
   * immediately. If `callImmediately` is
   * @returns the instance of the class that the method is being called on.
   */
  public setGetDataFunction(getDataFunc: () => Promise<GeoJsonObject>, callImmediately = true): this {
    this.getDataFunc = getDataFunc;
    if (callImmediately) {
      void this.populateData();
    }
    return this;
  }

  /**
   * The function sets the GeoJSON data and returns the current object.
   * @param {GeoJsonObject} data - The parameter "data" is of type GeoJsonObject. It is used to set the
   * GeoJSON data for the object.
   * @returns The method is returning the instance of the class on which it is called, with the updated
   * `geoJsonData` property.
   */
  public setGeoJsonData(data: GeoJsonObject): this {
    this.geoJsonData = data;
    return this;
  }

  /**
   * The function "getGeoJsonData" returns the GeoJSON data.
   * @returns The method is returning a GeoJsonObject.
   */
  public getGeoJsonData(): GeoJsonObject {
    return this.geoJsonData;
  }

  /**
   * The function `setStylingFunction` sets the styling function for a TypeScript class and returns the
   * class instance.
   * @param func - A function that takes no arguments and returns an object of type L.PathOptions.
   * @returns The method returns the instance of the class on which it is called.
   */
  public setStylingFunction(func: () => L.PathOptions): this {
    this.stylingFunction = func;
    return this;
  }

  /**
   * The function `setFeatureDisplayContentFunc` sets a callback function that takes a feature and
   * returns a string, and returns the current object.
   * @param func - A function that takes a feature object as input and returns a string.
   * @returns the instance of the class that the method is being called on.
   */
  public setFeatureDisplayContentFunc(
    func: (feature: Feature<GeometryObject, Record<string, unknown>>) => string,
  ): this {
    this.featureDisplayContentFunc = func;
    return this;
  }

  /**
   * The function sets a click event handler for a feature in a TypeScript class.
   * @param func - A function that takes two parameters: an event of type MouseEvent and a feature of
   * type Feature<GeometryObject, Record<string, unknown>>. The function is responsible for handling
   * the click event on the feature content.
   * @returns the instance of the class that the method belongs to.
   */
  public setFeatureContentClickFunc(
    func: (event: MouseEvent, feature: Feature<GeometryObject, Record<string, unknown>>) => void,
  ): this {
    this.featureContentClickFunction = func;
    return this;
  }

  /**
   * The function `setTooltipFunction` sets a tooltip function for a feature in TypeScript.
   * @param func - A function that takes a feature as input and returns a string.
   * @returns The method is returning the instance of the class on which it is called.
   */
  public setTooltipFunction(func: (feature: Feature<GeometryObject, Record<string, unknown>>) => string): this {
    this.tooltipFunction = func;
    return this;
  }

  /**
   * The function sets the pointToLayerFunction property of an object to a provided function or a
   * default function if none is provided.
   * @param {null | ((geoJsonPoint: Feature<Point, Record<string, unknown>>, latlng: L.LatLng) =>
   * L.Layer)} func - A function that takes two parameters: geoJsonPoint (a GeoJSON point feature) and
   * latlng (a Leaflet LatLng object). The function should return a Leaflet layer object.
   * @returns the instance of the class that the method is defined in.
   */
  public setPointToLayerFunction(
    func: null | ((geoJsonPoint: Feature<Point, Record<string, unknown>>, latlng: L.LatLng) => L.Layer),
  ): this {
    this.pointToLayerFunction = func ? func : (a, b) => this.defaultPointToLayerFunction(a, b);
    return this;
  }

  /**
   * The function sets the z-offset of the marker layer, if it exists.
   * @param {number} [index] - The index parameter is an optional number that represents the z-offset
   * value. It is used to set the z-offset of the marker layer.
   */
  public setZOffset(index?: number): void {
    if (null != this.markerLayer) {
      this.markerLayer.setZOffset(index);
    }
  }

  /**
   * The function returns an empty object as a type of L.PathOptions.
   * @returns An empty object of type L.PathOptions is being returned.
   */
  protected stylingFunction(): L.PathOptions {
    return {} as L.PathOptions;
  }

  /**
   * The function returns a layer for a given GeoJSON point and its corresponding latitude and
   * longitude.
   * @param geoJsonPoint - The `geoJsonPoint` parameter is a GeoJSON feature object representing a
   * point geometry. It contains information about the point's coordinates and any additional
   * properties associated with it.
   * @param latlng - The `latlng` parameter is the latitude and longitude coordinates of the point
   * feature in the GeoJSON data. It is of type `L.LatLng`, which is a Leaflet class representing a
   * geographical point with latitude and longitude values.
   * @returns a layer object.
   */
  protected pointToLayerFunction(geoJsonPoint: Feature<Point, Record<string, unknown>>, latlng: L.LatLng): L.Layer {
    return this.defaultPointToLayerFunction(geoJsonPoint, latlng);
  }

  /** The above code is defining a protected property called `featureContentClickFunction` in a TypeScript
  class. The property is a function that takes two parameters: an event of type `MouseEvent` and a
  feature of type `Feature<GeometryObject, Record<string, unknown>>`. The function itself does nothing
  and returns `null` by default. */
  protected featureContentClickFunction: (
    event: MouseEvent,
    feature: Feature<GeometryObject, Record<string, unknown>>,
  ) => void = () => null;

  /**
   * The function creates a layer with markers and geoJSON data, and returns a promise that resolves to
   * the layer group.
   * @param {GeoJsonObject} geoJsonData - The `geoJsonData` parameter is a GeoJSON object that
   * represents geographic features and their properties. It can contain various types of geometries
   * such as points, lines, and polygons, along with associated attributes. The `createLayer` function
   * uses this data to create a Leaflet layer that can be
   * @returns The function `createLayer` returns either `null` or a `Promise` that resolves to an
   * instance of `L.LayerGroup`.
   */
  protected createLayer(geoJsonData: GeoJsonObject): null | Promise<L.Layer> {
    this.setLayerClickFeatureItemGenerator(
      this.featureDisplayContentFunc
        ? new GeoJsonLayerFeatureItemGenerator(
          this,
          geoJsonData,
          this.featureDisplayContentFunc,
          this.featureContentClickFunction,
        )
        : null,
    );

    this.markerLayer.setMapObject(this.eposLeaflet);
    this.markerLayer.clearMarkers();
    this.geoLayer = null;
    if (geoJsonData != null) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.geoLayer = L.geoJSON(geoJsonData, {
          ...this.options.getAll(),
          style: {
            ...this.stylingFunction(),
            className: 'epos-leaflet-geojson',
          },
          onEachFeature: (feature: Feature<GeometryObject, Record<string, unknown>>, layer: L.Layer) => {
            const tooltip = this.generateTooltip(feature);
            if (tooltip != null) {
              layer.bindTooltip(tooltip);
            }
          },
          pointToLayer: (geoJsonPoint: Feature<Point, Record<string, unknown>>, latlng: L.LatLng): null | L.Layer => {
            let layer: null | L.Layer = this.pointToLayerFunction(geoJsonPoint, latlng);
            layer.options[PopupProperty.PROPERTY_ID] = geoJsonPoint.properties[PopupProperty.PROPERTY_ID];
            // if it's a marker remove it and to our own marker layer,
            //  so that we can optionally cluster
            if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
              const featureHtml = this.generateFeatureHtml(geoJsonPoint);
              const tooltip = this.generateTooltip(geoJsonPoint);
              // eslint-disable-next-line @typescript-eslint/dot-notation
              const markerId = String(layer['id'] != null ? layer['id'] : this.markerLayer.getMarkers().length);
              this.markerLayer.addLeafletMarker(markerId, layer, tooltip, featureHtml, (event) =>
                this.featureContentClickFunction(event as MouseEvent, geoJsonPoint),
              );
              layer = null; // clear it from geo layer
            }
            return layer;
          },
        } as L.GeoJSONOptions);
      } catch (error) {
        console.warn(error);
        this.geoLayer = null;
      }
    }
    return (this.geoLayer == null)
      ? null
      : this.markerLayer.getLeafletLayer().then((leafletMarkerLayer: L.Layer) => {
        return L.layerGroup([this.geoLayer as L.Layer, leafletMarkerLayer]);
      });
  }

  /**
   * The function `populateData` is a protected method that populates the `geoJsonData` property with
   * GeoJSON data, either by directly assigning it, or by calling a provided `getDataFunc` function and
   * storing the result in a promise.
   * @returns The function `populateData()` returns a Promise that resolves to `void`.
   */
  protected populateData(): Promise<void> {
    if (this.geoJsonData != null) {
      return Promise.resolve();
    } else if (this.getDataFunc != null) {
      if (this.dataPromise == null) {
        this.dataPromise = this.getDataFunc()
          .then((data: GeoJsonObject) => {
            this.geoJsonData = data;
          })
          .catch(() => {
            console.warn(`Failed to populate GeoJson data of '${this.name}' layer.`);
          });
      }
      return this.dataPromise;
    } else {
      this.geoJsonData = {
        type: 'FeatureCollection',
        features: [],
      } as GeoJsonObject;
      return Promise.resolve();
    }
  }

  /**
   * The function generates an HTML element based on a feature and a display content function.
   * @param feature - The `feature` parameter is of type `Feature<GeometryObject, Record<string,
   * unknown>>`. This means it is an object that represents a geographic feature with a geometry and
   * additional properties. The `GeometryObject` represents the geometry of the feature, which can be a
   * point, line, polygon,
   * @returns either null or an HTMLElement.
   */
  protected generateFeatureHtml(feature: Feature<GeometryObject, Record<string, unknown>>): null | HTMLElement {
    let element: null | HTMLElement = null;
    if (this.featureDisplayContentFunc) {
      let value: null | string = this.featureDisplayContentFunc(feature);
      if (!/\S+/.test(value)) {
        value = null;
      }
      if (null != value) {
        element = document.createElement('div');
        element.innerHTML = value;
      }
    }
    return element;
  }

  /**
   * The function "generateTooltip" returns a tooltip value based on a feature, using a custom tooltip
   * function.
   * @param feature - A feature object that contains information about a geometry object and additional
   * properties.
   * @returns a value of type `null`, `string`, or `HTMLElement`.
   */
  protected generateTooltip(feature: Feature<GeometryObject, Record<string, unknown>>): null | string | HTMLElement {
    let value: null | string | HTMLElement = null;

    if (this.tooltipFunction) {
      value = this.tooltipFunction(feature);
      if (typeof value === 'string' && !/\S+/.test(value)) {
        value = null;
      }
    }
    return value;
  }

  /**
   * The function creates a Leaflet marker with a Font Awesome icon at a given latitude and longitude.
   * @param geoJsonPoint - The `geoJsonPoint` parameter is a GeoJSON feature object representing a
   * point feature. It contains the geometry and properties of the point feature.
   * @param latlng - The `latlng` parameter is the latitude and longitude coordinates of the point. It
   * is of type `L.LatLng`, which is a Leaflet class representing a geographical point with latitude
   * and longitude coordinates.
   * @returns a Leaflet marker layer with a custom icon.
   */
  protected defaultPointToLayerFunction(
    geoJsonPoint: Feature<Point, Record<string, unknown>>,
    latlng: L.LatLng,
  ): L.Layer {
    const icon = new FaMarker();
    return L.marker(latlng, { icon: icon, bubblingMouseEvents: true } as L.MarkerOptions);
  }

  /**
   * The function updates the opacity of a Leaflet layer and then updates the marker.
   */
  protected updateLeafletLayerOpacity(): void {
    this.updateLeafletLayerMarker();
  }

  /**
   * The function `updateLeafletLayerMarker` updates the style and options of a Leaflet layer and
   * marker based on the values of custom layer options.
   */
  protected updateLeafletLayerMarker(): this {
    if (this.geoLayer != null && typeof this.geoLayer.setStyle === 'function') {
      const style = {
        color: this.options.customLayerOptionColor.get()!,
        opacity: this.options.customLayerOptionOpacity.get()!,
        fillColor: this.options.customLayerOptionFillColor.get()!,
        fillOpacity: this.options.customLayerOptionFillColorOpacity.get()!,
        weight: this.options.customLayerOptionWeight.get()!,
      } as L.PathOptions;

      this.geoLayer.setStyle(style);

      if (this.id.includes(MapLayer.BBOX_LAYER_ID)) {

        const styleForBbox: Record<string, unknown> = style as Record<string, unknown>;

        // check if enable
        styleForBbox.enable = this.options.customLayerOptionEnable.get()!;

        const localStoragePersister = this.eposLeaflet.getLocalStoragePersister();

        void localStoragePersister.get(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_BBOX_STYLE).then((styleMapString: string) => {

          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const styleMap = styleMapString !== null ? new Map(Object.entries(JSON.parse(styleMapString))) : new Map();

          styleMap.set(this.id, styleForBbox);

          localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, JSON.stringify(Object.fromEntries(styleMap)), false, LocalStorageVariables.LS_BBOX_STYLE);

        });

      }
    }

    if (this.markerLayer != null) {
      this.markerLayer.options.customLayerOptionMarkerType.set(this.options.customLayerOptionMarkerType.get());
      this.markerLayer.options.customLayerOptionMarkerValue.set(this.options.customLayerOptionMarkerValue.get()!);
      this.markerLayer.options.customLayerOptionMarkerIconSize.set(this.options.customLayerOptionMarkerIconSize.get()!);
      this.markerLayer.options.customLayerOptionColor.set(this.options.customLayerOptionColor.get()!);
      this.markerLayer.options.customLayerOptionOpacity.set(this.options.customLayerOptionOpacity.get()!);
      this.markerLayer.options.customLayerOptionFillColor.set(this.options.customLayerOptionFillColor.get()!);
      this.markerLayer.options.customLayerOptionFillColorOpacity.set(this.options.customLayerOptionFillColorOpacity.get()!);
      this.markerLayer.options.customLayerOptionWeight.set(this.options.customLayerOptionWeight.get()!);
    }

    return this;
  }

  /**
   * The function brings a specific layer to the front by adjusting its z-offset and calling the
   * bringToFront method on the layer.
   * @param {number} refIndex - The refIndex parameter is a number that represents the reference index
   * of the layer that needs to be brought to the front.
   */
  protected bringLayerToFront(refIndex: number): void {
    this.setZOffset(refIndex);
    if (this.geoLayer != null) {
      this.geoLayer.bringToFront();
    }
  }

  /**
   * The function brings a layer to the back by adjusting its z-offset and calling the bringToBack
   * method on the geoLayer object.
   * @param {number} refIndex - The refIndex parameter is a number that represents the reference index
   * of the layer.
   */
  protected bringLayerToBack(refIndex: number): void {
    this.setZOffset(refIndex);
    if (this.geoLayer != null) {
      this.geoLayer.bringToBack();
    }
  }
}
