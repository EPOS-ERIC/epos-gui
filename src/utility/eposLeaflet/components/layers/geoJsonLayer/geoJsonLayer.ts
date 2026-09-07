import * as L from 'leaflet';
import { GeoJsonObject, Feature, FeatureCollection, GeometryObject, Point } from 'geojson'; //  CoverageCollection
import { MapLayer } from '../mapLayer.abstract';
import { MarkerClusterOptions, MarkerLayer } from '../markerLayer';
import { FaMarker } from '../../marker/faMarker/faMarker';
import { EposLeafletComponent } from '../../eposLeaflet.component';
import { GeoJsonLayerFeatureItemGenerator } from './geoJsonLayerFeatureItemGenerator';
import { LayerWithMarkers } from '../layerWithMarkers.interface';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { PopupProperty } from 'utility/maplayers/popupProperty';
import { FeatureDisplayItem } from '../../featureDisplay/featureDisplayItem';
import { Legend } from '../../controls/legendControl/legend';
import { ElementLegendItem } from '../../controls/legendControl/elementLegendItem';
import * as D3Chromatic from 'd3-scale-chromatic';
import { color as parseD3Color } from 'd3-color';

export type MarkerStyleMode = 'fixed' | 'parameter';

export interface NumericGeoJsonProperty {
  name: string;
  min: number;
  max: number;
}

export interface GeoJsonMarkerParameterStyle {
  color: {
    mode: MarkerStyleMode;
    property: string | null;
    paletteId: string | null;
    minValue: number | null;
    maxValue: number | null;
  };
  size: {
    mode: MarkerStyleMode;
    property: string | null;
    minValue: number | null;
    maxValue: number | null;
    minPx: number;
    maxPx: number;
  };
}

export interface ResolvedGeoJsonMarkerStyle {
  color?: string;
  size?: number;
  outOfRange: boolean;
}

export interface GeoJsonMarkerColorPalette {
  id: string;
  colors: Array<string>;
  interpolator: (value: number) => string;
}

const D3_INTERPOLATOR_PREFIX = 'interpolate';
const PALETTE_SAMPLE_COUNT = 17;

const D3_MARKER_COLOR_PALETTES = Object.entries(D3Chromatic)
  .filter(([name, value]) => name.startsWith(D3_INTERPOLATOR_PREFIX) && typeof value === 'function')
  .sort(([nameA], [nameB]) => {
    const defaultPaletteOrder = Number(nameA !== 'interpolateViridis') - Number(nameB !== 'interpolateViridis');
    return defaultPaletteOrder || nameA.localeCompare(nameB);
  })
  .map(([name, value]): GeoJsonMarkerColorPalette => {
    const d3Interpolator = value as (normalized: number) => string;
    const interpolator = (normalized: number): string => {
      const interpolatedColor = d3Interpolator(normalized);
      return parseD3Color(interpolatedColor)?.formatHex() ?? interpolatedColor;
    };
    return {
      id: name.substring(D3_INTERPOLATOR_PREFIX.length).toLowerCase(),
      colors: Array.from(
        { length: PALETTE_SAMPLE_COUNT },
        (_item, index) => interpolator(index / (PALETTE_SAMPLE_COUNT - 1)),
      ),
      interpolator,
    };
  });

export class GeoJsonMarkerLayer extends MarkerLayer {
  public setMapObject(eposLeaflet: EposLeafletComponent): void {
    this.eposLeaflet = eposLeaflet;
  }

  public updateMarkerSize(size: number): void {
    this.getMarkers().forEach(marker => {
      if (marker instanceof L.CircleMarker) {
        marker.setRadius(size / 2);
      } else {
        const icon = marker.options.icon;
        if (icon instanceof FaMarker) {
          icon.setSize(size);
          marker.setIcon(icon);
        }
      }
    });
  }

  public previewMarkerSizeScale(scaleFactor: number, previousScaleFactor: number): void {
    if (previousScaleFactor <= 0) {
      return;
    }
    const incrementalScale = scaleFactor / previousScaleFactor;
    this.getMarkers().forEach(marker => {
      if (marker instanceof L.CircleMarker) {
        marker.setRadius(marker.getRadius() * incrementalScale);
      } else {
        const markerContent = marker.getElement()?.firstElementChild;
        if (markerContent instanceof HTMLElement) {
          markerContent.style.transform = `scale(${scaleFactor})`;
          markerContent.style.transformOrigin = marker.options.icon instanceof FaMarker
            ? '50% 100%'
            : '50% 50%';
        }
      }
    });
  }

  public updateMarkerStrokeColor(color: string): void {
    this.getMarkers().forEach(marker => {
      if (marker instanceof L.CircleMarker) {
        marker.setStyle({ color });
      } else {
        const icon = marker.options.icon;
        if (icon instanceof FaMarker) {
          if (icon.icon == null) {
            icon.setStrokeColor(color);
          } else {
            icon.setColor(color);
          }
          marker.setIcon(icon);
        }
      }
    });
  }
}

export class GeoJsonLayer extends MapLayer implements LayerWithMarkers {

  public static readonly MARKER_COLOR_PALETTES = D3_MARKER_COLOR_PALETTES;

  private static readonly OUT_OF_RANGE_MARKER_COLOR = '#9e9e9e';

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

  private markerParameterStyle: GeoJsonMarkerParameterStyle = {
    color: { mode: 'fixed', property: null, paletteId: null, minValue: null, maxValue: null },
    size: { mode: 'fixed', property: null, minValue: null, maxValue: null, minPx: 10, maxPx: 50 },
  };

  private numericMarkerProperties = new Array<NumericGeoJsonProperty>();

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

  public getFeatureDisplayItemById(
    propertyId: Array<number> | string | undefined,
    layerName: string,
  ): Promise<Array<FeatureDisplayItem> | void> {
    if (propertyId === undefined || this.geoJsonData.type !== 'FeatureCollection') {
      return Promise.resolve<Array<FeatureDisplayItem>>([]);
    }
    const feature = (this.geoJsonData as FeatureCollection).features.find(item => {
      return item.properties?.[PopupProperty.PROPERTY_ID] === propertyId;
    }) as Feature<GeometryObject, Record<string, unknown>> | undefined;
    if (feature == null || this.featureDisplayContentFunc == null) {
      return Promise.resolve<Array<FeatureDisplayItem>>([]);
    }
    return Promise.resolve([
      new FeatureDisplayItem(
        feature,
        () => this.featureDisplayContentFunc(feature),
        event => this.featureContentClickFunction(event, feature),
      ),
    ]);
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
    this.numericMarkerProperties = this.extractNumericMarkerProperties(data);
    return this;
  }

  /**
   * The function "getGeoJsonData" returns the GeoJSON data.
   * @returns The method is returning a GeoJsonObject.
   */
  public getGeoJsonData(): GeoJsonObject {
    return this.geoJsonData;
  }

  public getNumericMarkerProperties(): Array<NumericGeoJsonProperty> {
    return this.numericMarkerProperties.map(property => ({ ...property }));
  }

  public getMarkerParameterStyle(): GeoJsonMarkerParameterStyle {
    return {
      color: { ...this.markerParameterStyle.color },
      size: { ...this.markerParameterStyle.size },
    };
  }

  public setMarkerParameterStyle(style: GeoJsonMarkerParameterStyle): this {
    let minPx = Math.max(5, Math.min(100, style.size.minPx));
    let maxPx = Math.max(5, Math.min(100, style.size.maxPx));
    if (minPx >= maxPx) {
      minPx = Math.min(minPx, 95);
      maxPx = minPx + 5;
    }
    this.markerParameterStyle = {
      color: { ...style.color },
      size: {
        ...style.size,
        minPx,
        maxPx,
      },
    };
    return this;
  }

  public getMarkerColorPalette(): GeoJsonMarkerColorPalette | null {
    return GeoJsonLayer.MARKER_COLOR_PALETTES.find(
      palette => palette.id === this.markerParameterStyle.color.paletteId
    ) ?? null;
  }

  public resolveMarkerParameterStyle(
    feature: Feature<Point, Record<string, unknown>>,
  ): ResolvedGeoJsonMarkerStyle {
    const resolved: ResolvedGeoJsonMarkerStyle = { outOfRange: false };
    const colorConfig = this.markerParameterStyle.color;
    const colorProperty = colorConfig.property == null
      ? null
      : this.numericMarkerProperties.find(property => property.name === colorConfig.property);
    if (colorConfig.mode === 'parameter' && colorProperty != null) {
      const value = this.toFiniteNumber(feature.properties?.[colorProperty.name]);
      if (value != null) {
        const range = this.getMarkerValueRange(colorConfig, colorProperty);
        resolved.outOfRange = value < range.min || value > range.max;
        resolved.color = this.interpolateMarkerColor(
          colorConfig.paletteId,
          this.normalizeMarkerValue(value, range.min, range.max),
        );
      } else {
        resolved.outOfRange = true;
      }
    }

    const sizeConfig = this.markerParameterStyle.size;
    const sizeProperty = sizeConfig.property == null
      ? null
      : this.numericMarkerProperties.find(property => property.name === sizeConfig.property);
    if (sizeConfig.mode === 'parameter' && sizeProperty != null) {
      const value = this.toFiniteNumber(feature.properties?.[sizeProperty.name]);
      if (value != null) {
        const range = this.getMarkerValueRange(sizeConfig, sizeProperty);
        resolved.outOfRange = resolved.outOfRange || value < range.min || value > range.max;
        const normalized = this.normalizeMarkerValue(value, range.min, range.max);
        resolved.size = sizeConfig.minPx + normalized * (sizeConfig.maxPx - sizeConfig.minPx);
      } else {
        resolved.outOfRange = true;
      }
    }
    if (resolved.outOfRange) {
      resolved.color = GeoJsonLayer.OUT_OF_RANGE_MARKER_COLOR;
    }
    return resolved;
  }

  public addMarkerParameterLegendItems(legend: Legend): void {
    const colorConfig = this.markerParameterStyle.color;
    const colorProperty = colorConfig.property == null
      ? null
      : this.numericMarkerProperties.find(property => property.name === colorConfig.property);
    const palette = this.getMarkerColorPalette();
    if (colorConfig.mode === 'parameter' && colorProperty != null && palette != null) {
      const range = this.getMarkerValueRange(colorConfig, colorProperty);
      const gradient = document.createElement('span');
      gradient.style.display = 'inline-block';
      gradient.style.width = '70px';
      gradient.style.height = '12px';
      gradient.style.border = '1px solid #777';
      gradient.style.background = range.min === range.max
        ? this.interpolateMarkerColor(palette.id, 0.5)
        : `linear-gradient(to right, ${this.getPaletteGradientStops(palette).join(', ')})`;
      const colorRange = range.min === range.max
        ? this.formatLegendNumber(range.min)
        : `${this.formatLegendNumber(range.min)} – ${this.formatLegendNumber(range.max)}`;
      legend.addLegendItem(new ElementLegendItem(
        `Color · ${colorProperty.name}: ${colorRange}`,
        gradient,
      ));
    }

    const sizeConfig = this.markerParameterStyle.size;
    const sizeProperty = sizeConfig.property == null
      ? null
      : this.numericMarkerProperties.find(property => property.name === sizeConfig.property);
    if (sizeConfig.mode === 'parameter' && sizeProperty != null) {
      const range = this.getMarkerValueRange(sizeConfig, sizeProperty);
      const normalizedValues = range.min === range.max ? [0.5] : [0, 0.5, 1];
      normalizedValues.forEach(normalized => {
        const value = range.min + normalized * (range.max - range.min);
        const previewSize = 6 + normalized * 14;
        const marker = document.createElement('span');
        marker.style.display = 'inline-block';
        marker.style.width = `${previewSize}px`;
        marker.style.height = `${previewSize}px`;
        marker.style.border = '1px solid currentColor';
        marker.style.borderRadius = '50%';
        marker.style.backgroundColor = 'currentColor';
        legend.addLegendItem(new ElementLegendItem(
          `Size · ${sizeProperty.name}: ${this.formatLegendNumber(value)}`,
          marker,
        ));
      });
    }

    if (this.getPointFeatures(this.geoJsonData).some(feature => this.resolveMarkerParameterStyle(feature).outOfRange)) {
      const marker = document.createElement('span');
      marker.style.display = 'inline-block';
      marker.style.width = '12px';
      marker.style.height = '12px';
      marker.style.border = '1px solid #777';
      marker.style.backgroundColor = GeoJsonLayer.OUT_OF_RANGE_MARKER_COLOR;
      legend.addLegendItem(new ElementLegendItem('Out of range / no numeric value', marker));
    }
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
            if (layer instanceof L.CircleMarker) {
              const resolvedStyle = this.resolveMarkerParameterStyle(geoJsonPoint);
              if (resolvedStyle.color != null) {
                layer.setStyle({ color: resolvedStyle.color, fillColor: resolvedStyle.color });
              }
              if (resolvedStyle.size != null) {
                layer.setRadius(resolvedStyle.size / 2);
              }
            }
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
            this.setGeoJsonData(data);
          })
          .catch(() => {
            console.warn(`Failed to populate GeoJson data of '${this.name}' layer.`);
          });
      }
      return this.dataPromise;
    } else {
      this.setGeoJsonData({
        type: 'FeatureCollection',
        features: [],
      } as GeoJsonObject);
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
      this.markerLayer.options.customLayerOptionOpacity.set(this.options.customLayerOptionOpacity.get()!);
      if (this.markerParameterStyle.color.mode === 'fixed' && this.markerParameterStyle.size.mode === 'fixed') {
        this.markerLayer.options.customLayerOptionMarkerType.set(this.options.customLayerOptionMarkerType.get());
        this.markerLayer.options.customLayerOptionMarkerValue.set(this.options.customLayerOptionMarkerValue.get()!);
        this.markerLayer.options.customLayerOptionMarkerIconSize.set(this.options.customLayerOptionMarkerIconSize.get()!);
        this.markerLayer.options.customLayerOptionColor.set(this.options.customLayerOptionColor.get()!);
        this.markerLayer.options.customLayerOptionFillColor.set(this.options.customLayerOptionFillColor.get()!);
        this.markerLayer.options.customLayerOptionFillColorOpacity.set(this.options.customLayerOptionFillColorOpacity.get()!);
        this.markerLayer.options.customLayerOptionWeight.set(this.options.customLayerOptionWeight.get()!);
      } else if (this.markerParameterStyle.size.mode === 'fixed') {
        const markerSize = this.options.customLayerOptionMarkerIconSize.get();
        if (markerSize != null) {
          this.markerLayer.updateMarkerSize(markerSize);
        }
      }
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

  private extractNumericMarkerProperties(data: GeoJsonObject): Array<NumericGeoJsonProperty> {
    const features = this.getPointFeatures(data);
    const preferredKeys = new Array<string>();
    const valuesByKey = new Map<string, Array<number>>();
    const excludedKeys = new Set([PopupProperty.PROPERTY_ID, '@epos_style_id', '@epos_style_lookup_id']);

    features.forEach(feature => {
      const properties = feature.properties ?? {};
      ['@epos_map_keys', '@epos_data_keys'].forEach(metadataKey => {
        const metadataValue = properties[metadataKey];
        if (Array.isArray(metadataValue)) {
          metadataValue.forEach(key => {
            if (typeof key === 'string' && !preferredKeys.includes(key)) {
              preferredKeys.push(key);
            }
          });
        }
      });
      Object.keys(properties).forEach(key => {
        if (excludedKeys.has(key)) {
          return;
        }
        const value = this.toFiniteNumber(properties[key]);
        if (value != null) {
          const values = valuesByKey.get(key) ?? [];
          values.push(value);
          valuesByKey.set(key, values);
        }
      });
    });

    const orderedKeys = preferredKeys.filter(key => valuesByKey.has(key));
    Array.from(valuesByKey.keys())
      .filter(key => !orderedKeys.includes(key))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
      .forEach(key => orderedKeys.push(key));

    return orderedKeys.map(name => {
      const values = valuesByKey.get(name)!;
      return { name, min: Math.min(...values), max: Math.max(...values) };
    });
  }

  private getPointFeatures(data: unknown): Array<Feature<Point, Record<string, unknown>>> {
    if (data == null || typeof data !== 'object') {
      return [];
    }
    const geoJson = data as {
      type?: string;
      geometry?: unknown;
      features?: Array<unknown>;
    };
    if (geoJson.type === 'FeatureCollection') {
      return (geoJson.features ?? []).reduce<Array<Feature<Point, Record<string, unknown>>>>(
        (features, feature) => features.concat(this.getPointFeatures(feature)),
        [],
      );
    }
    if (geoJson.type === 'Feature' && this.geometryContainsPoint(geoJson.geometry)) {
      return [geoJson as unknown as Feature<Point, Record<string, unknown>>];
    }
    return [];
  }

  private geometryContainsPoint(geometry: unknown): boolean {
    if (geometry == null || typeof geometry !== 'object') {
      return false;
    }
    const value = geometry as { type?: string; geometries?: Array<unknown> };
    if (value.type === 'Point' || value.type === 'MultiPoint') {
      return true;
    }
    return value.type === 'GeometryCollection'
      && (value.geometries?.some(item => this.geometryContainsPoint(item)) ?? false);
  }

  private toFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const numericValue = Number(value);
      return Number.isFinite(numericValue) ? numericValue : null;
    }
    return null;
  }

  private normalizeMarkerValue(value: number, min: number, max: number): number {
    if (min === max) {
      return 0.5;
    }
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  private getMarkerValueRange(
    config: { minValue: number | null; maxValue: number | null },
    property: NumericGeoJsonProperty,
  ): { min: number; max: number } {
    const min = config.minValue ?? property.min;
    const max = config.maxValue ?? property.max;
    return Number.isFinite(min) && Number.isFinite(max) && min <= max
      ? { min, max }
      : { min: property.min, max: property.max };
  }

  private interpolateMarkerColor(paletteId: string | null, normalized: number): string {
    const palette = GeoJsonLayer.MARKER_COLOR_PALETTES.find(item => item.id === paletteId)
      ?? GeoJsonLayer.MARKER_COLOR_PALETTES[0];
    return palette.interpolator(normalized);
  }

  private getPaletteGradientStops(palette: GeoJsonMarkerColorPalette): Array<string> {
    return palette.colors.map(
      (color, index) => `${color} ${(index / (palette.colors.length - 1)) * 100}%`
    );
  }

  private formatLegendNumber(value: number): string {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(value);
  }
}
