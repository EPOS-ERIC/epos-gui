import { Injector } from '@angular/core';
import { Stylable } from 'utility/styler/stylable.interface';
import { Feature, GeoJsonObject, GeometryObject } from 'geojson';
import { FeatureDisplayItem, GeoJsonLayerFeatureItemGenerator, ImageLegendItem, Legend, LegendItem, MapLayer } from 'utility/eposLeaflet/eposLeaflet';
import { GeoJSONHelper } from './geoJSONHelper';
import { JsonHelper } from './jsonHelper';
import * as JP from 'jsonpath';
import * as L from 'leaflet';
import { ObjectHelper } from './objectHelper';
import { PopupProperty } from './popupProperty';
import { ExecutionService } from 'services/execution.service';
import { AuthenticatedClickService } from 'services/authenticatedClick.service';

export class GeoJSONImageOverlayMapLayer extends MapLayer {

  private popupFunction: (feature: ImageOverlayData) => string; // http://leafletjs.com/reference-1.3.0.html#layer-bindpopup
  private popupClickFunction: (event: MouseEvent) => void;
  private tooltipFunction: (feature: ImageOverlayData) => string; // http://leafletjs.com/reference-1.3.0.html#layer-bindpopup


  private imageOverlayData: Array<ImageOverlayData>; //   data
  private populatingDataPromise: Promise<void>;

  private leafletLayers = new Array<L.Layer>();

  private getDataFunc: () => Promise<Array<ImageOverlayData>>;

  private readonly executionService: ExecutionService;
  private readonly authentificationClickService: AuthenticatedClickService;

  constructor(
    injector: Injector,
    id: string,
    name: string,
    protected stylable: Stylable,
    getDataFunction: () => Promise<GeoJsonObject>,
  ) {

    super(id + GeoJSONHelper.IMAGE_OVERLAY_ID_SUFFIX, name);

    // Default options
    this.options.setOptions({
      pane: 'overlayPane',
    });

    this.executionService = injector.get<ExecutionService>(ExecutionService);
    this.authentificationClickService = injector.get<AuthenticatedClickService>(AuthenticatedClickService);

    this.setPreLayerAddFunction(() => {
      return getDataFunction()
        .then((geo: GeoJSON.GeoJsonObject) => {
          this.imagePreLayerAdd(geo);
        })
        .catch((r) => {
          console.warn(`Failed to populate GeoJson data of '${name}' layer.`);
          console.warn(r);
        });

    })
      .setTooltipFunction((feature: ImageOverlayData): string => {
        return JsonHelper.getLabelFromProperties(feature.properties, name);
      })
      .setPopupFunction((feature: ImageOverlayData): string => {
        return GeoJSONHelper.getPopupContentFromProperties(feature.properties, name);
      })
      .setPopupClickFunction((ev: MouseEvent) => {
        GeoJSONHelper.popupClick(ev, this.executionService, this.authentificationClickService);
      });

    this.options.customLayerOptionStylable.set(stylable as Stylable);
  }

  /**
   * The function "getRealId" returns the original ID of an object, removing a specific suffix if it
   * exists.
   * @returns The method `getRealId()` returns a string.
   */
  public getRealId(): string {
    if (this.id.endsWith(GeoJSONHelper.IMAGE_OVERLAY_ID_SUFFIX)) {
      return this.id.slice(0, -(GeoJSONHelper.IMAGE_OVERLAY_ID_SUFFIX.length));
    }
    return this.id;
  }

  /**
   * The function checks if the "leafletLayers" array is null or empty and returns a boolean value.
   * @returns The method `isEmpty()` returns a boolean value.
   */
  public isEmpty(): boolean {
    return ((null == this.leafletLayers) || (this.leafletLayers.length === 0));
  }

  /**
   * The function `getLeafletLayer` returns a Promise that resolves to a Leaflet Layer, either by
   * creating it from existing data or by populating the data first.
   * @returns A Promise that resolves to an instance of the L.Layer class.
   */
  public getLeafletLayer(): Promise<L.Layer> {
    return (this.imageOverlayData)
      ? Promise.resolve(this.createLayer(this.imageOverlayData))
      : this.populateData()
        .then(() => this.createLayer(this.imageOverlayData));
  }

  /**
   * The function `getFeatureDisplayItemById` retrieves a list of `FeatureDisplayItem` objects based on a
   * given `propertyId` and `layerName`.
   * @param {Array<number> | undefined} propertyId - The `propertyId` parameter is an array of numbers or
   * undefined. It represents the IDs of the properties you want to retrieve the feature display items
   * for.
   * @param {string} layerName - The `layerName` parameter is a string that represents the name of the
   * layer in which the feature is located.
   * @returns a Promise that resolves to an array of FeatureDisplayItem objects or void (undefined).
   */
  public getFeatureDisplayItemById(propertyId: Array<number> | undefined, layerName: string): Promise<Array<FeatureDisplayItem> | void> {
    const data = this.imageOverlayData;
    return GeoJSONHelper.getFeatureDisplayItemById(data, propertyId, layerName);
  }

  /**
   * The function updates the opacity of a Leaflet layer based on a custom option.
   */
  protected updateLeafletLayerOpacity(): void {
    if (this.leafletMapLayer != null) {
      const opacity = this.options.customLayerOptionOpacity.get();
      if (null != opacity) {
        (this.leafletMapLayer as L.LayerGroup).getLayers().forEach((layer: L.ImageOverlay) => {
          layer.setOpacity(opacity);
        });
      }
    }
  }

  /**
   * The `imagePreLayerAdd` function adds image overlays to a map layer in TypeScript, transforming the
   * data and setting up click events and popup content for each overlay.
   * @param geo - The `geo` parameter is a GeoJSON object, which represents geographic features and their
   * properties. It can be any valid GeoJSON object, such as a FeatureCollection, Feature, or Geometry
   * object.
   */
  protected imagePreLayerAdd(
    geo: GeoJSON.GeoJsonObject,
  ): void {

    //   transform data
    const data: Array<ImageOverlayData> = [];

    const features = JP.query(geo, '$..*[?(@.type=="Feature")]') as Array<Record<string, unknown>>;

    features.forEach((feature, index) => {

      // Overlay
      const overlay = ObjectHelper.getObjectValue<Record<string, unknown>>(feature, GeoJSONHelper.IMAGE_OVERLAY_ATTR, false);
      if (overlay !== null) {

        // Image
        const href = ObjectHelper.getObjectValue(overlay, 'href', true);
        const hrefImage = (ObjectHelper.isValidString(href, true)) ? (href as string).trim() : null;

        // Bbox
        const bbox = ObjectHelper.getObjectArray(overlay, 'bbox', true);
        const bboxArray: Array<number> = (ObjectHelper.isValidArray(bbox)) ? ObjectHelper.toNumberArray(bbox) : [];

        // Legend
        let hrefLegend: null | string = null;
        const legend = ObjectHelper.getObjectValue<Record<string, unknown>>(overlay, 'legend', false);
        if (legend != null) {
          const href2 = ObjectHelper.getObjectValue(legend, 'href', false);
          if (ObjectHelper.isValidString(href2, true)) {
            hrefLegend = (href2 as string).trim();
          }
        }

        // Properties
        let properties = ObjectHelper.getObjectValue<Record<string, unknown>>(feature, 'properties', false);
        properties = (properties == null) ? {} as Record<string, unknown> : properties;

        properties[PopupProperty.PROPERTY_ID] = this.getRealId() + '#' + index.toString() + '#';

        // Valid image and bbox - minimum for an overlay
        if (ObjectHelper.isValidString(hrefImage, true) && bboxArray.length === 4) {
          const overlayData = new ImageOverlayData(hrefImage!, bboxArray, hrefLegend, properties);

          data.push(overlayData);
        }

        // add specific layer pane
        void Promise.resolve().then(() => this.getEposLeaflet().ensurePaneExists(this.id));

      }

    });

    // important for click manager
    this.options.customLayerOptionPaneType.set(MapLayer.IMAGE_OVERLAY_LAYER_TYPE);

    // set popup click for layer
    this.setLayerClickFeatureItemGenerator(
      new GeoJsonLayerFeatureItemGenerator(
        this,
        this.imageProcessForFeatureIdentification(geo),
        (feature: Feature<GeometryObject, Record<string, unknown>>) => {
          return GeoJSONHelper.getPopupContentFromProperties(feature.properties, this.name);
        },
        (ev: MouseEvent, feature: Feature<GeometryObject, Record<string, unknown>>) => {
          JsonHelper.popupClick(ev, this.executionService, this.authentificationClickService);
        })
    );

    this.setImageOverlayData(data);
  }

  private createLayer(imageOverlayData: Array<ImageOverlayData>): Promise<L.Layer> {

    const layers: Array<L.Layer> = [];

    if (imageOverlayData) {
      try {
        const legendItems: Array<LegendItem> = [];

        imageOverlayData.forEach((overlay: ImageOverlayData) => {

          // Options
          const options = {
            alt: this.generateTooltip(overlay),
            interactive: true,
            bubblingMouseEvents: true, // a mouse event will trigger the same event on the map (click manager)
          } as L.ImageOverlayOptions;

          const bounds = L.latLngBounds(
            L.latLng(overlay.bbox[0], overlay.bbox[1]),
            L.latLng(overlay.bbox[2], overlay.bbox[3])
          );

          const imageOverlay = new L.ImageOverlay(overlay.hrefImage, bounds, options);

          // Tooltip
          const tooltip = this.generateTooltip(overlay);
          if (tooltip != null) {
            imageOverlay.bindTooltip(tooltip, { sticky: true });
          }

          // Legend for overlay image
          if (ObjectHelper.isValidString(overlay.hrefLegend, true)) {
            legendItems.push(new ImageLegendItem(overlay.getLabel(), overlay.hrefLegend!, overlay.properties[PopupProperty.PROPERTY_ID] as string));
          }

          imageOverlay.options.pane = this.id;

          imageOverlay.options[PopupProperty.PROPERTY_ID] = overlay.properties[PopupProperty.PROPERTY_ID];

          layers.push(imageOverlay);
        });

        // If any legends were created
        if (legendItems.length > 0) {
          this.setLegendCreatorFunction(() => {
            return Promise.resolve([new Legend(this.id, this.name).setLegendItems(legendItems)]);
          });
        }

      } catch (error) {
        console.warn(error);
      }
    }
    this.leafletLayers = layers;

    return Promise.resolve(new L.LayerGroup(layers));
  }

  private setPopupFunction(func: (feature: ImageOverlayData) => string): this {
    this.popupFunction = func;
    return this;
  }

  private setPopupClickFunction(func: (event: MouseEvent) => void): this {
    this.popupClickFunction = func;
    return this;
  }

  private setTooltipFunction(func: (feature: ImageOverlayData) => string): this {
    this.tooltipFunction = func;
    return this;
  }

  private imageProcessForFeatureIdentification(data: GeoJsonObject): GeoJsonObject {
    return this.processForFeatureIdentification(data);
  }

  private setImageOverlayData(data: Array<ImageOverlayData>): this {
    this.imageOverlayData = data;
    return this;
  }

  private populateData(): Promise<void> {
    if (this.imageOverlayData != null) {
      return Promise.resolve();
    } else if (this.getDataFunc != null) {
      if (this.imageOverlayData == null) {
        this.populatingDataPromise = this.getDataFunc()
          .then((data: Array<ImageOverlayData>) => {
            this.imageOverlayData = data;
          })
          .catch(() => {
            console.warn(`Failed to populate GeoJson Image data of '${this.name}' layer.`);
          });
      }
      return this.populatingDataPromise;
    } else {
      this.imageOverlayData = [];
      return Promise.resolve();
    }
  }

  private generateTooltip(overlayData: ImageOverlayData): null | string | HTMLElement {
    let value: null | string | HTMLElement = null;

    if (this.tooltipFunction) {
      value = this.tooltipFunction(overlayData);
      if ((typeof value === 'string') && (!/\S+/.test(value))) {
        value = null;
      }
    }
    return value;
  }

}

export class ImageOverlayData {

  constructor(
    readonly hrefImage: string,
    readonly bbox: Array<number>,
    readonly hrefLegend: null | string = null,
    readonly properties: Record<string, unknown> = {},
  ) {

  }

  /**
   * The function `getLabel` returns a label extracted from the properties using a helper function called
   * `getLabelFromProperties`.
   * @returns The `getLabel()` method is returning a string value.
   */
  public getLabel(): string {
    return JsonHelper.getLabelFromProperties(this.properties);
  }

}
