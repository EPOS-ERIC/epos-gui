/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/dot-notation */
import * as L from 'leaflet';

import { Subject } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { Legend } from '../controls/legendControl/legend';
import { LayerOptions } from './options';
import { EposLeafletComponent } from '../eposLeaflet.component';
import { FeatureDisplayItemGenerator } from '../featureDisplay/featureDisplayItemGenerator';
import { FeatureDisplayItem } from '../featureDisplay/featureDisplayItem';
import { SimpleConfigValue } from '../../objects/configAttributes/simpleConfigValue';
import { SimpleConfigObservableWithValue } from '../../objects/configAttributes/simpleConfigObservableWithValue';
import { Stylable } from 'utility/styler/stylable.interface';
import { FeatureCollection, GeoJsonObject } from 'geojson';
import { GeoJSONHelper } from 'utility/maplayers/geoJSONHelper';

/** The above code is defining an abstract class called `MapLayer` in TypeScript. An abstract class is a
class that cannot be instantiated directly, but can be used as a base class for other classes. */
export abstract class MapLayer {

  /** The above code is defining a public static readonly variable called MARKERTYPE_POINT with the
  value 'point'. */
  public static readonly MARKERTYPE_POINT = 'point';

  /** The above code is defining a public static readonly variable named MARKERTYPE_LINE with the value
  'line'. */
  public static readonly MARKERTYPE_LINE = 'line';

  /** The above code is defining a public static readonly variable named MARKERTYPE_POLYGON with the
  value 'poly'. */
  public static readonly MARKERTYPE_POLYGON = 'poly';

  /** The above code is defining a public static readonly variable named MARKERTYPE_IMAGE with the value
  'image'. */
  public static readonly MARKERTYPE_IMAGE = 'image';

  /** The above code is declaring a public static readonly variable named MARKERTYPE_FA and assigning it
  the value 'font_awesome'. */
  public static readonly MARKERTYPE_FA = 'font_awesome';

  /** The above code is defining a public static readonly variable named MARKERTYPE_CHARACTER with the
  value 'character'. */
  public static readonly MARKERTYPE_CHARACTER = 'character';

  /** The above code is declaring a public static readonly variable named MARKERTYPE_PIN_FA and
  assigning it the value 'pin_font_awesome'. */
  public static readonly MARKERTYPE_PIN_FA = 'pin_font_awesome';

  /** The above code is declaring a public static readonly variable named MARKERTYPE_RAW and
  assigning it the value 'raw'. */
  public static readonly MARKERTYPE_RAW = 'raw';

  /** The above code is declaring a public static readonly variable named BBOX_LAYER_ID with the value
  'spatialbbox'. */
  public static readonly BBOX_LAYER_ID = 'spatialbbox';

  /** The above code is declaring a public static readonly variable named BBOX_EDITABLE_LAYER_ID with
  the value 'editablebbox'. */
  public static readonly BBOX_EDITABLE_LAYER_ID = 'editablebbox';

  /** The above code is defining a public static readonly variable named IMAGE_OVERLAY_LAYER_TYPE with
  the value 'imageOverlay'. */
  public static readonly IMAGE_OVERLAY_LAYER_TYPE = 'imageOverlay';

  /** The above code is defining a static readonly array called DEFAULT_LAYER_LEGEND_LABEL. This array
  contains objects with two properties: type and value. Each object represents a different type of
  marker (point, polygon, or line) and its corresponding label. */
  public static readonly DEFAULT_LAYER_LEGEND_LABEL = [
    {
      type: this.MARKERTYPE_POINT,
      value: 'Default Marker'
    },
    {
      type: this.MARKERTYPE_POLYGON,
      value: 'Default Polygon'
    },
    {
      type: this.MARKERTYPE_LINE,
      value: 'Default Line'
    },
  ];

  /** The above code is declaring a public property called "id" of type string in a TypeScript class. */
  public id: string;

  /** The above code is declaring a public property called "name" of type string in a TypeScript class. */
  public name: string;

  /** The above code is declaring a public property called `visibleOnLayerControl` of type
  `SimpleConfigValue<this, boolean>`. It is initializing this property with a new instance of
  `SimpleConfigValue` and passing `this` (referring to the current instance of the class) and `true`
  as arguments to the constructor. */
  public visibleOnLayerControl = new SimpleConfigValue<this, boolean>(this, true);

  /** The above code is declaring a public variable named "tryToRender" of type "SimpleConfigValue" with a
  generic parameter of "this" (referring to the current class) and "boolean". It is initializing this
  variable with a new instance of "SimpleConfigValue" and passing in the current class instance (this)
  and a boolean value of true as arguments. */
  public tryToRender = new SimpleConfigValue<this, boolean>(this, true);

  /** The above code is declaring a public property called "addedToMap" which is an instance of the
  "SimpleConfigObservableWithValue" class. This class is a generic class that takes two type
  parameters: "this" and "null | boolean". The "this" type parameter refers to the current class,
  while the "null | boolean" type parameter represents a value that can be either null or boolean. */
  public addedToMap = new SimpleConfigObservableWithValue<this, null | boolean>(this);

  /** The above code is declaring a public property called "toggleable" of type
  "SimpleConfigObservableWithValue" with a generic parameter of "this" (referring to the current
  class) and "boolean". It is initializing this property with a new instance of
  "SimpleConfigObservableWithValue" and passing in the current class (this) and a boolean value of
  true as arguments. */
  public toggleable = new SimpleConfigObservableWithValue<this, boolean>(this, true);

  /** The above code is declaring a public property called "hidden" of type
  "SimpleConfigObservableWithValue". It is initializing this property with a new instance of
  "SimpleConfigObservableWithValue" and passing in the current object (this) and a boolean value of
  false. */
  public hidden = new SimpleConfigObservableWithValue<this, boolean>(this, false);

  /** The above code is declaring a public property called "options" and initializing it with a new
  instance of the "LayerOptions" class. The "LayerOptions" class is a generic class that takes the
  current class as a type parameter. This allows the "options" property to have access to the
  properties and methods of the current class. */
  public options = new LayerOptions<this>(this);

  /** The above code is defining a protected property called "clickSource" which is an instance of the
  Subject class from the RxJS library. This Subject is specifically configured to emit
  LeafletMouseEvent objects. */
  protected clickSource = new Subject<L.LeafletMouseEvent>();

  /** The above code is declaring a protected property called `layerClickFeatureItemGenerator` with a type
  of `null` or `FeatureDisplayItemGenerator`. */
  protected layerClickFeatureItemGenerator: null | FeatureDisplayItemGenerator;

  /** The above code is defining a protected property called `legendCreatorFunction` in a TypeScript
  class. The property is a function that takes two parameters: `layer` of type `MapLayer` and `http`
  of type `HttpClient`. The function returns a `Promise` that resolves to either `null` or an array of
  `Legend` objects. */
  protected legendCreatorFunction: (layer: MapLayer, http: HttpClient) => Promise<null | Array<Legend>>;

  protected layerBboxRetrieverFunction: (layer: MapLayer, http: HttpClient) => Promise<null | Array<number>>;

  protected layerInfoForTableRetrieverFunction: (layer: MapLayer, http: HttpClient) => Promise<null | Array<JQuery<Element>>>;

  /** The above code is declaring a protected variable called "eposLeaflet" of type
  "EposLeafletComponent". */
  protected eposLeaflet: EposLeafletComponent;

  /** The above code is declaring a protected variable called "leafletWrapperLayer" of type "L.LayerGroup"
  in TypeScript. */
  protected leafletWrapperLayer: L.LayerGroup;

  /** The above code is declaring a protected variable called "leafletMapLayer" of type L.Layer. */
  protected leafletMapLayer: L.Layer;

  /**
   * This is a constructor function that initializes properties and sets up event listeners for a
   * Leaflet layer.
   * @param {string} id - The `id` parameter is a required string that represents the unique identifier
   * for the object being created. It is used to set the `id` property of the `leafletWrapperLayer`
   * object.
   * @param {string} [name] - The `name` parameter is an optional string that represents the name of
   * the object being created. If a value is provided for `name`, it will be assigned to the `name`
   * property of the object. If no value is provided, the `id` parameter will be assigned to the `name
   */
  protected constructor(id: string, name?: string) {
    this.id = id;
    this.leafletWrapperLayer = new L.LayerGroup();
    this.leafletWrapperLayer['id'] = id;

    this.name = name || id;

    this.options.customLayerOptionOpacity.watch().subscribe(() => {
      this.updateLeafletLayerOpacity();
    });
    this.hidden.watch().subscribe(() => {
      this.updateHidden();
    });

    this.options.customLayerOptionColor.watch().subscribe(() => {
      this.updateLeafletLayerMarker();
    });

    this.options.customLayerOptionFillColor.watch().subscribe(() => {
      this.updateLeafletLayerMarker();
    });

    this.options.customLayerOptionFillColorOpacity.watch().subscribe(() => {
      this.updateLeafletLayerMarker();
    });

    this.options.customLayerOptionWeight.watch().subscribe(() => {
      this.updateLeafletLayerMarker();
    });

    this.options.customLayerOptionMarkerIconSize.watch().subscribe(() => {
      this.updateLeafletLayerMarker();
    });

    this.options.customLayerOptionMarkerValue.watch().subscribe(() => {
      this.updateLeafletLayerMarker();
    });

  }

  /**
   * The function `addSelfToMap` adds a Leaflet layer to a map and performs various operations before
   * and after adding the layer.
   * @param {EposLeafletComponent} eposLeaflet - EposLeafletComponent - an instance of the
   * EposLeafletComponent class.
   * @returns The function `addSelfToMap` returns a Promise that resolves to `void`.
   */
  public addSelfToMap(eposLeaflet: EposLeafletComponent, http: HttpClient): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.eposLeaflet == null) {
        this.eposLeaflet = eposLeaflet;
      }
      const leafletMap = eposLeaflet.getLeafletObject();
      if (!this.tryToRender.get()) {
        this.addedToMap.set(false);
        resolve();
      } else {
        this.addedToMap.set(null);

        resolve(
          this.userPreLayerAddFunction()
            .then(() => this.preLayerAdd())
            .then(() => this.getLeafletLayer(http))
            // eslint-disable-next-line arrow-body-style
            .then((leafletLayer: L.Layer) => {
              return new Promise<void>((resolve2) => {
                if (leafletLayer != null) {
                  this.leafletMapLayer = leafletLayer;
                  this.leafletWrapperLayer.addTo(leafletMap);

                  this.checkOpacityOnAdd();

                  void this.ensureAddedToMap().then(() => {
                    this.addedToMap.set(true);
                    resolve2();
                  });
                } else {
                  // TODO: SHOW NOTIFICATION!
                  console.warn('Generated Map Layer was NULL!');
                  this.addedToMap.set(false);
                  resolve2();
                }
              });
            })
            .then(() => this.postLayerAdd())
            .then(() => this.updateHidden())
            .then(() => this.userPostLayerAddFunction(this.leafletMapLayer)),

        );
      }
    });
  }

  /**
   * The `removeSelfFromMap` function removes a layer from a Leaflet map and performs pre and post
   * removal actions.
   * @returns a Promise that resolves to void (i.e., no value).
   */
  public removeSelfFromMap(): Promise<void> {
    const leafletWrapperLayer = this.getLeafletLayerFromMap();
    return leafletWrapperLayer == null
      ? Promise.resolve()
      : this.userPreLayerRemoveFunction(this.leafletMapLayer)
        .then(() => this.preLayerRemove())
        // eslint-disable-next-line arrow-body-style
        .then(() => {
          return new Promise<void>((resolve) => {
            // remove the layer from the wrapper so that it can be refreshed if added again
            if (this.leafletWrapperLayer.hasLayer(this.leafletMapLayer)) {
              this.leafletWrapperLayer.removeLayer(this.leafletMapLayer);
            }
            // remove wrapper layer from map
            this.eposLeaflet.getLeafletObject().removeLayer(this.leafletWrapperLayer);
            const iterationLimit = 20;
            let county = 0;
            const removeIntervalId = setInterval(() => {
              county++;
              if (null == this.getLeafletLayerFromMap() || county > iterationLimit) {
                if (county > iterationLimit) {
                  console.warn('Failed to verify layer removed', this.id);
                }
                clearInterval(removeIntervalId);
                resolve();
              }
            }, 100);
          });
        })
        .then(() => this.postLayerRemove())
        .then(() => this.userPostLayerRemoveFunction(this.leafletMapLayer));
  }

  /**
   * The function sets a pre-layer add function for a TypeScript class.
   * @param {null | (() => Promise<void>)} func - The `func` parameter is a function that takes no
   * arguments and returns a promise that resolves to `void`. It can be either `null` or a function.
   * @returns The method is returning the current instance of the class.
   */
  public setPreLayerAddFunction(func: null | (() => Promise<void>)): this {
    this.userPreLayerAddFunction = (null != func) ? func : () => Promise.resolve();
    return this;
  }
  /**
   * The function sets a callback function to be executed after a Leaflet layer is added to the map.
   * @param {null | ((leafletLayer: L.Layer) => Promise<void>)} func - The `func` parameter is a
   * function that takes a `leafletLayer` object of type `L.Layer` as its argument and returns a
   * `Promise<void>`. It can be either `null` or a function.
   * @returns The method is returning the current instance of the class.
   */
  public setPostLayerAddFunction(func: null | ((leafletLayer: L.Layer) => Promise<void>)): this {
    this.userPostLayerAddFunction = (null != func) ? func : () => Promise.resolve();
    return this;
  }
  /**
   * The function sets a callback function that will be executed before removing a layer in a Leaflet
   * map.
   * @param {null | ((leafletLayer: L.Layer) => Promise<void>)} func - A function that takes a Leaflet
   * layer as a parameter and returns a Promise that resolves when the layer is removed. This function
   * can be null if no pre-layer remove function is needed.
   * @returns The method is returning the current instance of the class.
   */
  public setPreLayerRemoveFunction(func: null | ((leafletLayer: L.Layer) => Promise<void>)): this {
    this.userPreLayerRemoveFunction = (null != func) ? func : () => Promise.resolve();
    return this;
  }
  /**
   * The function sets a callback function to be executed when a leaflet layer is removed.
   * @param {null | ((leafletLayer: L.Layer) => Promise<void>)} func - The `func` parameter is a
   * function that takes a `leafletLayer` object of type `L.Layer` as its argument and returns a
   * `Promise<void>`. It can be either `null` or a function.
   * @returns The method is returning the current instance of the class.
   */
  public setPostLayerRemoveFunction(func: null | ((leafletLayer: L.Layer) => Promise<void>)): this {
    this.userPostLayerRemoveFunction = (null != func) ? func : () => Promise.resolve();
    return this;
  }

  /**
   * The function sets a legend creator function for a map layer in TypeScript.
   * @param legendCreatorFunction - A function that takes two parameters: a MapLayer object and an
   * HttpClient object, and returns a Promise that resolves to either null or an array of Legend
   * objects.
   * @returns The method is returning the instance of the class that the method belongs to.
   */
  public setLegendCreatorFunction(
    legendCreatorFunction: (layer: MapLayer, http: HttpClient) => Promise<null | Array<Legend>>,
  ): this {
    this.legendCreatorFunction = legendCreatorFunction;
    return this;
  }

  public setLayerBboxRetrieverFunction(
    layerBboxRetrieverFunction: (layer: MapLayer, http: HttpClient) => Promise<null | Array<number>>,
  ): this {
    this.layerBboxRetrieverFunction = layerBboxRetrieverFunction;
    return this;
  }

  public setLayerInfoForTableRetrieverFunction(
    layerInfoForTableRetrieverFunction: (layer: MapLayer, http: HttpClient) => Promise<null | Array<JQuery<Element>>>
  ): this{
    this.layerInfoForTableRetrieverFunction = layerInfoForTableRetrieverFunction;
    return this;
  }
  /**
   * The function `getLegendData` returns a promise that resolves to an array of `Legend` objects or
   * `null`, and catches any errors that occur during the promise execution.
   * @param {HttpClient} http - The `http` parameter is of type `HttpClient`. It is likely an instance
   * of the Angular `HttpClient` class, which is used to send HTTP requests and handle responses. It is
   * used in the `legendCreatorFunction` to make an HTTP request and retrieve the legend data.
   * @returns a Promise that resolves to either null or an array of Legend objects.
   */
  public getLegendData(http: HttpClient): Promise<null | Array<Legend>> {
    // returns a promise or null.
    // Catches any problems with the Promise and returns null for the legendArray value
    return Promise.resolve<null | Array<Legend>>(
      this.legendCreatorFunction
        ? this.legendCreatorFunction(this, http).catch(() => {
          console.warn('Legend Data Function Failed.', this.id);
          return null;
        })
        : Promise.resolve(null),
    );
  }

  public getLayerBbox(http: HttpClient): Promise<null | Array<number>> {
    return Promise.resolve<null | Array<number>>(
      this.layerBboxRetrieverFunction
      ? this.layerBboxRetrieverFunction(this, http).catch( () => {
        console.warn('Layer Bbox Retriever Function Failed.', this.id);
        return null;
      })
      : Promise.resolve(null),
    );
  }

  public getWMTSLayerInfoForTable(http: HttpClient): Promise<null | Array<JQuery<Element>>> {
    return Promise.resolve<null | Array<JQuery<Element>>>(
      this.layerInfoForTableRetrieverFunction ?
      this.layerInfoForTableRetrieverFunction(this, http).catch( () => {
        console.warn('WMTSLayerInfoForTable Parser Function Failed');
        return null;
      })
      : Promise.resolve(null),
    );
  }

  /**
   * The click function in TypeScript triggers a click event and emits it to the clickSource.
   * @param clickEvent - The clickEvent parameter is of type L.LeafletMouseEvent. It represents the
   * event object that is triggered when a click event occurs on a Leaflet map.
   */
  public click(clickEvent: L.LeafletMouseEvent): void {
    this.clickSource.next(clickEvent);
  }

  /**
   * The addClickListener function subscribes to a click event source and executes a callback function
   * when a click event occurs.
   * @param func - The `func` parameter is a function that takes a `clickEvent` parameter of type
   * `L.LeafletMouseEvent` and returns `void`.
   * @returns the instance of the object on which the method is called.
   */
  public addClickListener(func: (clickEvent: L.LeafletMouseEvent) => void): this {
    this.clickSource.subscribe(func);
    return this;
  }

  /**
   * The function sets the layer click feature item generator and returns the current object.
   * @param {null | FeatureDisplayItemGenerator} featureItemGenerator - The featureItemGenerator
   * parameter is of type null or FeatureDisplayItemGenerator. It is used to set the generator for
   * creating feature display items when a layer is clicked.
   * @returns The method is returning the instance of the class on which the method is called.
   */
  public setLayerClickFeatureItemGenerator(featureItemGenerator: null | FeatureDisplayItemGenerator): this {
    this.layerClickFeatureItemGenerator = featureItemGenerator;
    return this;
  }

  /**
   * The function returns the layerClickFeatureItemGenerator or null.
   * @returns The method is returning either null or an instance of the FeatureDisplayItemGenerator
   * class.
   */
  public getLayerClickFeatureItemGenerator(): null | FeatureDisplayItemGenerator {
    return this.layerClickFeatureItemGenerator;
  }

  /**
   * The function returns an array of feature display items based on a click event and an HTTP client.
   * @param clickEvent - The clickEvent parameter is an object that represents a Leaflet mouse event.
   * It contains information about the click event, such as the coordinates of the click and the target
   * element that was clicked on.
   * @param {HttpClient} http - The `http` parameter is an instance of the `HttpClient` class, which is
   * used to make HTTP requests. It is likely being used in the `getFeatureDisplayItems` method of the
   * `layerClickFeatureItemGenerator` object to fetch data from a server.
   * @returns a Promise that resolves to an array of FeatureDisplayItem objects.
   */
  public getLayerClickFeatureItem(
    clickEvent: L.LeafletMouseEvent,
    http: HttpClient,
  ): Promise<Array<FeatureDisplayItem>> {
    return this.layerClickFeatureItemGenerator
      ? this.layerClickFeatureItemGenerator.getFeatureDisplayItems(clickEvent, http)
      : Promise.resolve(new Array<FeatureDisplayItem>());
  }

  /**
   * The function returns an instance of the EposLeafletComponent.
   * @returns The method is returning an instance of the EposLeafletComponent.
   */
  public getEposLeaflet(): EposLeafletComponent {
    return this.eposLeaflet;
  }

  /**
   * The function returns an instance of the Stylable class or void.
   */
  public getStylable(): Stylable | void {
  }

  public toLeafletLayer(http: HttpClient): Promise<L.Layer> {
  return this.getLeafletLayer(http).then(layer => {
    if (!layer) {
      throw new Error(`MapLayer ${this.id} has no leaflet layer`);
    }
    return layer;
  });
}



  /** The above code is defining a protected property called `userPreLayerAddFunction` in a TypeScript
  class. The property is a function that takes no arguments and returns a Promise that resolves to
  void. The initial value of the property is a function that immediately resolves the Promise. */
  protected userPreLayerAddFunction: () => Promise<void> = () => Promise.resolve();

  /** The above code is defining a protected property called `userPostLayerAddFunction` in a TypeScript
  class. The property is a function that takes a parameter `leafletLayer` of type `L.Layer`
  (presumably from the Leaflet library) and returns a `Promise` that resolves to `void`. The function
  is assigned a default implementation that simply resolves the `Promise` immediately. */
  protected userPostLayerAddFunction: (leafletLayer: L.Layer) => Promise<void> = () => Promise.resolve();

  /** The above code is defining a protected property called `userPreLayerRemoveFunction` in a TypeScript
  class. The property is a function that takes a `leafletLayer` parameter of type `L.Layer` and
  returns a `Promise<void>`. The function is assigned a default implementation that resolves the
  promise immediately. */
  protected userPreLayerRemoveFunction: (leafletLayer: L.Layer) => Promise<void> = () => Promise.resolve();

  /** The above code is defining a protected property called `userPostLayerRemoveFunction` in a TypeScript
  class. The property is a function that takes a parameter `leafletLayer` of type `L.Layer`
  (presumably from the Leaflet library) and returns a `Promise` that resolves to `void`. The function
  is initialized with an arrow function that immediately resolves the promise with no value. */
  protected userPostLayerRemoveFunction: (leafletLayer: L.Layer) => Promise<void> = () => Promise.resolve();

  // override thes for layer specific operations
  /**
   * The function ensures that a specific pane exists in a Leaflet map.
   * @returns A Promise that resolves to void.
   */
  protected preLayerAdd(): Promise<void> {
    return Promise.resolve().then(() => this.getEposLeaflet().ensurePaneExists(this.id));
  }
  /**
   * The function "postLayerAdd" returns a promise that resolves to void.
   * @returns A Promise that resolves to void.
   */
  protected postLayerAdd(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * The function "preLayerRemove" returns a promise that resolves to void.
   * @returns A Promise that resolves to void.
   */
  protected preLayerRemove(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * The function "postLayerRemove" returns a promise that resolves to void.
   * @returns A Promise that resolves to void.
   */
  protected postLayerRemove(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * The function `ensureAddedToMap` is a protected method that returns a promise and is used to check
   * if a layer has been fully added to a map.
   * @returns A Promise that resolves to void.
   */
  protected ensureAddedToMap(): Promise<void> {
    // called every x secs to see if it's been fully added yet
    return new Promise<void>((resolve) => {
      const iterationLimit = 20;
      let county = 0;
      const refreshIntervalId = setInterval(() => {
        county++;
        if (null != this.getLeafletLayerFromMap() || county > iterationLimit) {
          if (county > iterationLimit) {
            console.warn('Failed to verify layer add', this.id);
          }
          clearInterval(refreshIntervalId);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * The function returns a Leaflet layer object from a map based on a specified ID.
   * @returns either `null` or an instance of `L.Layer`.
   */
  protected getLeafletLayerFromMap(): null | L.Layer {
    let returnVal: null | L.Layer = null;
    if (this.eposLeaflet != null) {
      this.eposLeaflet.getLeafletObject().eachLayer((leafletLayer: L.Layer) => {
        if (this.id === leafletLayer['id']) {
          returnVal = leafletLayer;
        }
      });
    }
    return returnVal;
  }

  /**
   * The function checks the opacity value for a custom layer option and sets it to a default value if
   * it is not provided, and triggers an update if necessary.
   */
  protected checkOpacityOnAdd(): void {
    if (this.options.customLayerOptionOpacity.get() == null) {

      // check stylable
      const stylable = this.options.customLayerOptionStylable.get();
      if (stylable !== null) {
        const style = stylable.getStyle();
        this.options.customLayerOptionOpacity.set(style?.getOpacityColor1());
      } else {
        this.options.customLayerOptionOpacity.set(0.9);
      }

    } else {
      // some layers that don't support "setOpacity" might need a kick (e.g. HeatLayer)
      this.options.customLayerOptionOpacity.trigger();
    }
  }

  /**
   * The function updates the visibility of a Leaflet map layer based on a hidden property.
   */
  protected updateHidden(): void {
    if (this.leafletMapLayer != null) {
      if (this.hidden.get() && this.leafletWrapperLayer.hasLayer(this.leafletMapLayer)) {
        this.leafletWrapperLayer.removeLayer(this.leafletMapLayer);
      } else if (!this.hidden.get() && !this.leafletWrapperLayer.hasLayer(this.leafletMapLayer)) {
        this.leafletWrapperLayer.addLayer(this.leafletMapLayer);
      }
    }
  }

  /**
   * The function updates the opacity of a Leaflet map layer based on a custom option.
   */
  protected updateLeafletLayerOpacity(): void {
    if (this.leafletMapLayer != null && typeof this.leafletMapLayer['setOpacity'] === 'function') {
      this.leafletMapLayer['setOpacity'](this.options.customLayerOptionOpacity.get());
    }
  }

  protected updateLeafletLayerMarker(): this {
    return this;
  }

  /**
   * The function brings a specific layer to the front in a Leaflet map.
   * @param {number} refIndex - The refIndex parameter is a number that represents the index of the
   * layer that you want to bring to the front.
   */
  protected bringLayerToFront(refIndex: number): void {
    if (this.leafletMapLayer != null && this.leafletWrapperLayer.hasLayer(this.leafletMapLayer)) {
      this.leafletMapLayer['bringToFront']();
    }
  }
  /**
   * The function brings a layer to the back of the map.
   * @param {number} refIndex - The refIndex parameter is a number that represents the index of the
   * layer you want to bring to the back.
   */
  protected bringLayerToBack(refIndex: number): void {
    if (this.leafletMapLayer != null && this.leafletWrapperLayer.hasLayer(this.leafletMapLayer)) {
      this.leafletMapLayer['bringToBack']();
    }
  }

  /**
   * The function processes a GeoJsonObject by adding a geometry property to features that don't have
   * one, using the bbox property from an imageOverlayObj.
   * @param {GeoJsonObject} data - The `data` parameter is of type `GeoJsonObject`, which represents a
   * geographic object in GeoJSON format. It can be either a single feature or a collection of features.
   * @returns the modified `data` object after processing it for feature identification.
   */
  protected processForFeatureIdentification(data: GeoJsonObject): GeoJsonObject {
    // clone so's not to affect the original object
    data = JSON.parse(JSON.stringify(data)) as GeoJsonObject;
    if (data.type === 'FeatureCollection') {
      const featureCollection = data as FeatureCollection;
      featureCollection.features = featureCollection.features.map(feature => {
        const imageOverlayObj = feature[GeoJSONHelper.IMAGE_OVERLAY_ATTR] as Record<string, unknown>;
        if ((null == feature.geometry) && (null != imageOverlayObj.bbox)) {
          const bbox = imageOverlayObj.bbox as Array<number>;
          feature.geometry = {
            type: 'Polygon',
            coordinates: [[
              [bbox[1], bbox[0]],
              [bbox[3], bbox[0]],
              [bbox[3], bbox[2]],
              [bbox[1], bbox[2]],
              [bbox[1], bbox[0]]
            ]]
          };
        }
        return feature;
      });
    }
    return data;
  }

  /**
   * The function checks if a given GeoJsonObject has an image overlay.
   * @param {GeoJsonObject} data - The `data` parameter is of type `GeoJsonObject`, which is a generic
   * type representing a GeoJSON object. GeoJSON is a format for encoding a variety of geographic data
   * structures. It can represent different types of geometries (e.g., points, lines, polygons) and
   * collections of features (
   * @returns a boolean value.
   */
  protected hasImageOverlay(data: GeoJsonObject): boolean {
    let result = false;
    data = JSON.parse(JSON.stringify(data)) as GeoJsonObject;
    if (data.type === 'FeatureCollection') {
      const featureCollection = data as FeatureCollection;
      result = GeoJSONHelper.hasImageOverlay(featureCollection.features);
    }
    return result;
  }

  /** The above code is defining an abstract method called `getLeafletLayer` which returns a `Promise`
  that resolves to either `null` or an instance of the `L.Layer` class from the Leaflet library. The
  method is marked as `protected`, which means it can only be accessed within the class or its
  subclasses. */
  protected abstract getLeafletLayer(http: HttpClient): Promise<null | L.Layer>;

}
