import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { FeatureDisplayItem } from '../featureDisplay/featureDisplayItem';
import { FeatureDisplayItemGenerator } from '../featureDisplay/featureDisplayItemGenerator';
import { HtmlFeatureIdentifier } from '../featureDisplay/htmlFeatureIdentifier';
import { JsonFeatureIdentifier } from '../featureDisplay/jsonFeatureIdentifier';
import { WMTSParameter, WmtsTileLayer } from './wmtsTileLayer';
import 'jquery';

export enum WmtsFeatureFormat {
  JSON = 'application/json',
  GEO_JSON = 'application/geojson',
  PLAIN_TEXT = 'text/plain',
  HTML_TEXT = 'text/html',
}

/** The `WmtsFeatureDisplayItemGenerator` class is responsible for generating feature display items for a
WMTS tile layer based on user interactions. */
export class WmtsFeatureDisplayItemGenerator implements FeatureDisplayItemGenerator {

  /** The above code is declaring a protected property called "itemGenerators" which is a Map object. The
  keys of the map are of type WmtsFeatureFormat and the values are of type FeatureDisplayItemGenerator. */
  protected itemGenerators = new Map<WmtsFeatureFormat, FeatureDisplayItemGenerator>();

  /** The above code is declaring a protected property called "preferredFormats" which is an array of
  objects of type "WmtsFeatureFormat". */
  protected preferredFormats = new Array<WmtsFeatureFormat>();

  /** The above code is declaring a protected property called "allowedFormats" which is an array of
  WmtsFeatureFormat objects. */
  protected allowedFormats: Array<WmtsFeatureFormat>;

  /** The above code is declaring a protected property called `selectedFormat` in a TypeScript class.
  The property can hold either a value of `null` or an instance of the `WmtsFeatureFormat` class. */
  protected selectedFormat: null | WmtsFeatureFormat;

  /** The above code is declaring a protected property called `featureCallParams` which is a `Map`
  object in TypeScript. The `Map` object is used to store key-value pairs, where the keys are
  strings and the values are also strings. */
  protected featureCallParams = new Map<string, string>();

  /**
   * The constructor function initializes a WmtsTileLayer object and sets default values.
   * @param {WmtsTileLayer} layer - The `layer` parameter is of type `WmtsTileLayer` and it is marked as
   * `protected`. This means that it can only be accessed within the class and its subclasses.
   */
  constructor(protected layer: WmtsTileLayer) {
    this.setDefaults();
  }

  /**
   * The function `getEnumFromValue` retrieves the enum key from a given value in TypeScript.
   * @param {string | number} value - The `value` parameter can be either a string or a number. It
   * represents the value that you want to find the corresponding enum for.
   * @param enumerator - The `enumerator` parameter is an object that represents an enumeration. It
   * contains key-value pairs where the keys are string representations of the enumeration values, and
   * the values are the corresponding enumeration values.
   * @returns either null or the enum value of type T.
   */
  public static getEnumFromValue<T>(value: string | number, enumerator: Record<string, unknown>): null | T {
    // get the string key from the value
    const key = Object.keys(enumerator).find((thisKey: string | number) => enumerator[thisKey] === value);
    return (null != key) ? enumerator[key] as T : null;
  }

  /**
   * The `createUrl` function generates a URL for a WMTS GetFeatureInfo request based on the provided
   * layer, click event, and optional override parameters.
   * @param {WmtsTileLayer} layer - The `layer` parameter is of type `WmtsTileLayer` and represents the
   * WMTS tile layer that the click event occurred on.
   * @param clickEvent - The `clickEvent` parameter is of type `L.LeafletMouseEvent` and represents the
   * mouse event that occurred when the user clicked on the map. It contains information about the
   * clicked point, such as the container point (x, y coordinates relative to the map container) and
   * the latlng (
   * @param [overrideParamsFunction] - The `overrideParamsFunction` is an optional parameter that is a
   * function. It allows you to override any of the parameters in the `parameters` map before
   * constructing the URL. The function should return a map where the keys are the parameter names and
   * the values are the new values for those parameters.
   * @returns a string, which is the constructed URL for a GetFeatureInfo request in a WMTS (Web Map
   * Service) layer.
   */
  public static createUrl(
    layer: WmtsTileLayer,
    clickEvent: L.LeafletMouseEvent,
    overrideParamsFunction?: () => Map<string, string>,
  ): string {
    const eposLeaflet = layer.getEposLeaflet();
    const map = eposLeaflet.getLeafletObject();
    if (null != eposLeaflet) {

      const width = (layer.options.get(WMTSParameter.WIDTH) ?? 256) as number;
      const height = (layer.options.get(WMTSParameter.HEIGHT) ?? 256) as number;

      const pixelPoint = map.project(clickEvent.latlng, map.getZoom()).floor();
      const coordNoFloor = pixelPoint.unscaleBy(new L.Point(width, height));
      const coord = coordNoFloor.floor();

      const i = Math.floor((coordNoFloor.x - coord.x) * width);
      const j = Math.floor((coordNoFloor.y - coord.y) * height);

      const parameters = new Map<string, null | string>();
      parameters.set('request', 'GetFeatureInfo');
      parameters.set('service', 'WMTS');
      parameters.set(WMTSParameter.LAYER, layer.options.get(WMTSParameter.LAYER));
      parameters.set('I', i + '');
      parameters.set('J', j + '');

      const tilematrixset = layer.options.get(WMTSParameter.TILEMATRIXSET) as string;
      parameters.set(WMTSParameter.TILEMATRIXSET, tilematrixset);
      const tilematrix = `${tilematrixset}:${eposLeaflet.getLeafletObject().getZoom()}`;
      parameters.set(WMTSParameter.TILEMATRIX, tilematrix);
      parameters.set(WMTSParameter.TILEROW, `${coord.y}` );
      parameters.set(WMTSParameter.TILECOL, `${coord.x}` );
      parameters.set(WMTSParameter.STYLE, layer.styleFromXML); // TOBE CHECKED: when i've got multiple WMTS layers active, will styleFromXML retrieve the one matching the actual layer? Should, but check
      parameters.set('info_format', 'application/json');

      /* if (null != overrideParamsFunction) {
        overrideParamsFunction().forEach((value: string, key: string) => {
          parameters.set(key, value);
        });
      } */
      // URL template
      const getFeatureInfoUrlTemplate = layer.getFeatureInfoBaseURL;
      // initialize url variable, will hold final URL with replaced params
      let url = '';

      if (getFeatureInfoUrlTemplate !== '') {
        // initialize url with the template
        url = getFeatureInfoUrlTemplate;
        // extract placeholders from the template (e.g. ["STYLE", "TILEMATRIX", ...]), arrange them in an array and make them uppercase
        const placeholders = Array.from(getFeatureInfoUrlTemplate.matchAll(/\{([^}]+)\}/g), m => m[1].toUpperCase());
        // Replace each placeholder with corresponding parameter value if it exists
        placeholders.forEach((param) => {
          if (parameters.has(param)) {
            const value = parameters.get(param);
            // Replace all occurrences of the placeholder (case-insensitive inside {})
            // RegExp that matches the exact placeholder inside {}
            const regex = new RegExp(`\\{${param}\\}`, 'gi');
            url = url.replace(regex, value ?? '');
          }
        });
      }
      return url.replace(/ /g, '');
    } else {
      return '';
    }
  }

  /**
   * The function sets a format handler and item generator for a WmtsFeatureFormat.
   * @param {WmtsFeatureFormat} format - The format parameter is of type WmtsFeatureFormat. It represents
   * the format in which the WMTS feature will be displayed.
   * @param {FeatureDisplayItemGenerator} itemGenerator - The `itemGenerator` parameter is a
   * `FeatureDisplayItemGenerator` object. It is responsible for generating display items for features
   * in a specific format.
   * @returns The method is returning the instance of the class that the method is being called on.
   */
  public setFormatHandler(format: WmtsFeatureFormat, itemGenerator: FeatureDisplayItemGenerator): this {
    this.itemGenerators.set(format, itemGenerator);
    return this;
  }


  /**
   * The function `getFeatureDisplayItems` retrieves feature display items based on a click event and
   * an HTTP client in TypeScript.
   * @param clickEvent - The `clickEvent` parameter is an event object that represents a mouse click
   * event on a Leaflet map. It contains information such as the coordinates of the click, the target
   * element that was clicked, and other relevant data related to the click event.
   * @param {HttpClient} http - The `http` parameter in the `getFeatureDisplayItems` function is of
   * type `HttpClient`, which is likely used to make HTTP requests within the function. You can use
   * this parameter to send HTTP requests to a server to fetch data or perform other operations like
   * fetching feature display items based on the `
   * @returns An array of FeatureDisplayItem objects is being returned.
   */
  public getFeatureDisplayItems(clickEvent: L.LeafletMouseEvent, http: HttpClient): Promise<Array<FeatureDisplayItem>> {

    const itemGenerator = this.itemGenerators.get(WmtsFeatureFormat.JSON);
    if (itemGenerator !== undefined) {
      return itemGenerator.getFeatureDisplayItems(clickEvent, http);
    }

    return new Promise((resolve) => { resolve([]); });

  }

  /**
   * The function sets the feature call parameters by copying the values from the given map.
   * @param params - A map of string keys and string values.
   * @returns The method is returning the instance of the class on which it is called, represented by
   * the keyword "this".
   */
  public setFeatureCallParams(params: Map<string, string>): this {
    this.featureCallParams = new Map<string, string>();

    if (null != params) {
      params.forEach((value: string, key: string) => {
        this.featureCallParams.set(key, value);
      });
    }
    return this;
  }

  /**
   * The `setDefaults` function sets up default values and configurations for generating feature
   * display items in different formats.
   */
  protected setDefaults(): void {
    const getParams = () => {
      this.featureCallParams.set('info_format', String(this.selectedFormat));
      return this.featureCallParams;
    };

    // JSON
    const jsonGenerator = new JsonFeatureIdentifier(this.layer, (layer: WmtsTileLayer, clickEvent) =>
      WmtsFeatureDisplayItemGenerator.createUrl(layer, clickEvent, getParams),
    );
    const htmlGenerator = new HtmlFeatureIdentifier(this.layer, (layer: WmtsTileLayer, clickEvent) =>
      WmtsFeatureDisplayItemGenerator.createUrl(layer, clickEvent, getParams),
    );

    this.itemGenerators.set(WmtsFeatureFormat.GEO_JSON, jsonGenerator);
    this.itemGenerators.set(WmtsFeatureFormat.JSON, jsonGenerator);
    this.itemGenerators.set(WmtsFeatureFormat.HTML_TEXT, htmlGenerator);
    this.itemGenerators.set(WmtsFeatureFormat.PLAIN_TEXT, htmlGenerator);

    this.preferredFormats.push(WmtsFeatureFormat.GEO_JSON);
    this.preferredFormats.push(WmtsFeatureFormat.JSON);
    this.preferredFormats.push(WmtsFeatureFormat.HTML_TEXT);
    this.preferredFormats.push(WmtsFeatureFormat.PLAIN_TEXT);
  }

}
