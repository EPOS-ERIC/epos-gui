import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { FeatureDisplayItem } from '../featureDisplay/featureDisplayItem';
import { FeatureDisplayItemGenerator } from '../featureDisplay/featureDisplayItemGenerator';
import { HtmlFeatureIdentifier } from '../featureDisplay/htmlFeatureIdentifier';
import { JsonFeatureIdentifier } from '../featureDisplay/jsonFeatureIdentifier';
import { WmsTileLayer } from './wmsTileLayer';
import 'jquery';

export enum WmsFeatureFormat {
  JSON = 'application/json',
  GEO_JSON = 'application/geojson',
  PLAIN_TEXT = 'text/plain',
  HTML_TEXT = 'text/html',
}

/** The `WmsFeatureDisplayItemGenerator` class is responsible for generating feature display items for a
WMS tile layer based on user interactions. */
export class WmsFeatureDisplayItemGenerator implements FeatureDisplayItemGenerator {

  /** The above code is declaring a protected property called "itemGenerators" which is a Map object. The
  keys of the map are of type WmsFeatureFormat and the values are of type FeatureDisplayItemGenerator. */
  protected itemGenerators = new Map<WmsFeatureFormat, FeatureDisplayItemGenerator>();

  /** The above code is declaring a protected property called "preferredFormats" which is an array of
  objects of type "WmsFeatureFormat". */
  protected preferredFormats = new Array<WmsFeatureFormat>();

  /** The above code is declaring a protected property called "allowedFormats" which is an array of
  WmsFeatureFormat objects. */
  protected allowedFormats: Array<WmsFeatureFormat>;

  /** The above code is declaring a protected property called `selectedFormat` in a TypeScript class.
  The property can hold either a value of `null` or an instance of the `WmsFeatureFormat` class. */
  protected selectedFormat: null | WmsFeatureFormat;

  /** The above code is declaring a protected property called `featureCallParams` which is a `Map`
  object in TypeScript. The `Map` object is used to store key-value pairs, where the keys are
  strings and the values are also strings. */
  protected featureCallParams = new Map<string, string>();

  /**
   * The constructor function initializes a WmsTileLayer object and sets default values.
   * @param {WmsTileLayer} layer - The `layer` parameter is of type `WmsTileLayer` and it is marked as
   * `protected`. This means that it can only be accessed within the class and its subclasses.
   */
  constructor(protected layer: WmsTileLayer) {
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
   * The `createUrl` function generates a URL for a WMS GetFeatureInfo request based on the provided
   * layer, click event, and optional override parameters.
   * @param {WmsTileLayer} layer - The `layer` parameter is of type `WmsTileLayer` and represents the
   * WMS tile layer that the click event occurred on.
   * @param clickEvent - The `clickEvent` parameter is of type `L.LeafletMouseEvent` and represents the
   * mouse event that occurred when the user clicked on the map. It contains information about the
   * clicked point, such as the container point (x, y coordinates relative to the map container) and
   * the latlng (
   * @param [overrideParamsFunction] - The `overrideParamsFunction` is an optional parameter that is a
   * function. It allows you to override any of the parameters in the `parameters` map before
   * constructing the URL. The function should return a map where the keys are the parameter names and
   * the values are the new values for those parameters.
   * @returns a string, which is the constructed URL for a GetFeatureInfo request in a WMS (Web Map
   * Service) layer.
   */
  public static createUrl(
    layer: WmsTileLayer,
    clickEvent: L.LeafletMouseEvent,
    overrideParamsFunction?: () => Map<string, string>,
  ): string {
    const eposLeaflet = layer.getEposLeaflet();
    if (null != eposLeaflet) {
      const bounds = eposLeaflet.getMapExtent();
      const mapSize = eposLeaflet.getMapSize();

      const parameters = new Map<string, null | string>();
      parameters.set('request', 'GetFeatureInfo');
      parameters.set('service', 'WMS');
      parameters.set('version', layer.options.get('version') ? layer.options.get('version') : null);
      parameters.set('x', clickEvent.containerPoint.round().x.toString());
      parameters.set('i', clickEvent.containerPoint.round().x.toString()); // backwards compatible x
      parameters.set('y', clickEvent.containerPoint.round().y.toString());
      parameters.set('j', clickEvent.containerPoint.round().y.toString()); // backwards compatible y
      parameters.set('layers', layer.options.get('layers'));
      parameters.set('query_layers', layer.options.get('layers'));
      parameters.set('styles', layer.options.get('styles') ? layer.options.get('styles') : null);
      parameters.set('crs', layer.options.get('crs') ? layer.options.get('crs') : 'CRS:84');
      parameters.set('bbox', bounds.asArray().reverse().join(','));
      parameters.set('width', mapSize.widthPx.toString());
      parameters.set('height', mapSize.heightPx.toString());
      parameters.set('feature_count', layer.options.get('feature_count') ? layer.options.get('feature_count') : null);
      // parameters.set('info_format', (layer.options.get('info_format')) ? layer.options.get('info_format') : 'application/geojson');

      if (null != overrideParamsFunction) {
        overrideParamsFunction().forEach((value: string, key: string) => {
          parameters.set(key, value);
        });
      }

      const url =
        layer.url +
        '?' +
        Array.from(parameters.keys())
          .filter((key) => null != parameters.get(key))
          .map((key) => `${key}=${parameters.get(key)}`)
          .join('&');

/*
        const parametersBbox = parameters.get('bbox');

        const parametersBboxArray: string [] = [];

        parametersBboxArray.push(parametersBbox as string);
        console.log(parametersBboxArray);

 */
      return url.replace(/ /g, '');
    } else {
      return '';
    }
  }

  /**
   * The function sets the preferred formats for a WmsFeatureFormat array and returns the updated
   * object.
   * @param formats - The parameter "formats" is an array of WmsFeatureFormat objects.
   * @returns The method is returning the instance of the class that the method is being called on.
   */
  public setPreferredFormats(formats: Array<WmsFeatureFormat>): this {
    this.preferredFormats = formats.slice();
    return this;
  }

  /**
   * The function sets a format handler and item generator for a WmsFeatureFormat.
   * @param {WmsFeatureFormat} format - The format parameter is of type WmsFeatureFormat. It represents
   * the format in which the WMS feature will be displayed.
   * @param {FeatureDisplayItemGenerator} itemGenerator - The `itemGenerator` parameter is a
   * `FeatureDisplayItemGenerator` object. It is responsible for generating display items for features
   * in a specific format.
   * @returns The method is returning the instance of the class that the method is being called on.
   */
  public setFormatHandler(format: WmsFeatureFormat, itemGenerator: FeatureDisplayItemGenerator): this {
    this.itemGenerators.set(format, itemGenerator);
    return this;
  }

  /**
   * The function retrieves feature display items based on a click event and an HTTP client, using a
   * selected format or retrieving the format if not already selected.
   * @param clickEvent - The clickEvent parameter is of type L.LeafletMouseEvent, which is an event
   * object that is triggered when a user clicks on a Leaflet map. It contains information about the
   * click event, such as the coordinates of the clicked location.
   * @param {HttpClient} http - The `http` parameter is an instance of the `HttpClient` class, which is
   * used to make HTTP requests. It is likely used in the `getFormat` and `getFeatureDisplayItems`
   * methods to fetch data from a server.
   * @returns a Promise that resolves to an array of FeatureDisplayItem objects.
   */
  public getFeatureDisplayItems(clickEvent: L.LeafletMouseEvent, http: HttpClient): Promise<Array<FeatureDisplayItem>> {
    return ((null != this.selectedFormat)
      ? Promise.resolve(this.selectedFormat)
      : this.getFormat(http)
    ).then((format) => {
      this.selectedFormat = format;
      const itemGenerator = (null == format) ? null : this.itemGenerators.get(format);
      return null == itemGenerator ? [] : itemGenerator.getFeatureDisplayItems(clickEvent, http);
    });
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
   * The function `getFormat` returns the preferred format from a list of allowed formats, after
   * populating the allowed formats if necessary.
   * @param {HttpClient} http - The `http` parameter is of type `HttpClient`. It is likely an instance
   * of a class that is used to make HTTP requests, such as the Angular `HttpClient` module.
   * @returns a Promise that resolves to either `null` or an instance of `WmsFeatureFormat`.
   */
  protected getFormat(http: HttpClient): Promise<null | WmsFeatureFormat> {
    return (null == this.allowedFormats
      ? this.populateAllowedFormats(http)
      : Promise.resolve()
    ).then(() => {
      return this.preferredFormats.find((preferredFormat) => this.allowedFormats.includes(preferredFormat)) ?? null;
    });
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
    const jsonGenerator = new JsonFeatureIdentifier(this.layer, (layer: WmsTileLayer, clickEvent) =>
      WmsFeatureDisplayItemGenerator.createUrl(layer, clickEvent, getParams),
    );
    const htmlGenerator = new HtmlFeatureIdentifier(this.layer, (layer: WmsTileLayer, clickEvent) =>
      WmsFeatureDisplayItemGenerator.createUrl(layer, clickEvent, getParams),
    );

    this.itemGenerators.set(WmsFeatureFormat.GEO_JSON, jsonGenerator);
    this.itemGenerators.set(WmsFeatureFormat.JSON, jsonGenerator);
    this.itemGenerators.set(WmsFeatureFormat.HTML_TEXT, htmlGenerator);
    this.itemGenerators.set(WmsFeatureFormat.PLAIN_TEXT, htmlGenerator);

    this.preferredFormats.push(WmsFeatureFormat.GEO_JSON);
    this.preferredFormats.push(WmsFeatureFormat.JSON);
    this.preferredFormats.push(WmsFeatureFormat.HTML_TEXT);
    this.preferredFormats.push(WmsFeatureFormat.PLAIN_TEXT);
  }

  /**
   * The function `populateAllowedFormats` retrieves the capabilities XML from a WMS layer and extracts
   * the supported feature formats.
   * @param {HttpClient} http - The `http` parameter is an instance of the `HttpClient` class, which is
   * used to make HTTP requests. It is passed to the `getCapabilitiesXml` method of the `layer` object
   * to retrieve the capabilities XML document.
   * @returns The function `populateAllowedFormats` returns a Promise that resolves to `void`.
   */
  protected populateAllowedFormats(http: HttpClient): Promise<void> {
    return this.layer.getCapabilitiesXml(http).then(($xml: JQuery<XMLDocument>) => {
      const formats = $xml.find('GetFeatureInfo>Format') ?? [];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      this.allowedFormats = Array.from(formats)
        .map((element: Element) => {
          return WmsFeatureDisplayItemGenerator.getEnumFromValue<WmsFeatureFormat>(
            String(element.textContent),
            WmsFeatureFormat,
          );
        })
        .filter((item) => null != item) as Array<WmsFeatureFormat>;
    });
  }
}
