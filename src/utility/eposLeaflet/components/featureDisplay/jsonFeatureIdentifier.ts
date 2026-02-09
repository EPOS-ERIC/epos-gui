import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { FeatureDisplayItemGenerator } from './featureDisplayItemGenerator';
import { FeatureDisplayItem } from './featureDisplayItem';
import { MapLayer } from '../layers/mapLayer.abstract';

/**
 * This class allows you to optionally define:
 * - how a feature service is called, or use default caller but define the url generation,
 * - how the call response is handled and processed,
 * - how the feature details are extracted,
 * - how the feature details are displayed.
 * This is done by setting the dynamic functions that are used in the process
 */
export class JsonFeatureIdentifier implements FeatureDisplayItemGenerator {

  /** The `featureServiceCaller` is a function that is used to call a service to retrieve feature data. In
  this code, it is initially set to the `defaultFeatureServiceCaller` function, which is bound to the
  current instance of the `JsonFeatureIdentifier` class using the `bind` method. The `as` keyword is
  used to specify the function signature of the `featureServiceCaller` function, which takes three
  parameters (`http`, `layer`, and `clickEvent`) and returns a `Promise` that resolves to a
  `Record<string, unknown>`. This allows the `featureServiceCaller` to be used as a type for the
  variable and ensures that the function signature is enforced. */
  protected featureServiceCaller = this.defaultFeatureServiceCaller.bind(this) as
    (
      http: HttpClient,
      layer: MapLayer,
      clickEvent: L.LeafletMouseEvent,
    ) => Promise<Record<string, unknown>>;

  /** The `urlCreator` is a protected property of the `JsonFeatureIdentifier` class. It is a function
  that takes two parameters (`layer` of type `MapLayer` and `clickEvent` of type
  `L.LeafletMouseEvent`) and returns either `null` or a string. */
  protected urlCreator: (layer: MapLayer, clickEvent: L.LeafletMouseEvent) => null | string;

  /** The line `protected responseResultsExtractor = this.defaultResponseResultsExtractor.bind(this) as
  (res: Record<string, unknown>) => Array<Record<string, unknown>>;` is creating a protected property
  `responseResultsExtractor` and assigning it a function. */
  protected responseResultsExtractor = this.defaultResponseResultsExtractor.bind(this) as
    (res: Record<string, unknown>) =>
      Array<Record<string, unknown>>;

  /** The line `protected resultDetailsExtractor = this.defaultResultDetailsExtractor.bind(this) as
  (featureDetails: Record<string, unknown>) => Map<string, string>;` is creating a protected property
  `resultDetailsExtractor` and assigning it a function. */
  protected resultDetailsExtractor = this.defaultResultDetailsExtractor.bind(this) as
    (featureDetails: Record<string, unknown>) => Map<string, string>;

  /** The line `protected itemDisplayGenerator = this.defaultDisplayElementGenerator.bind(this) as
  (detailsMap: Map<string, string>, layer: MapLayer,) => HTMLElement;` is creating a protected
  property `itemDisplayGenerator` and assigning it a function. The function is
  `defaultDisplayElementGenerator` which is bound to the current instance of the
  `JsonFeatureIdentifier` class using the `bind` method. The function takes two parameters
  (`detailsMap` of type `Map<string, string>` and `layer` of type `MapLayer`) and returns an
  `HTMLElement`. The `as` keyword is used to specify the function signature of the
  `itemDisplayGenerator` function, ensuring that the function signature is enforced. */
  protected itemDisplayGenerator = this.defaultDisplayElementGenerator.bind(this) as
    (detailsMap: Map<string, string>, layer: MapLayer,) => HTMLElement;

  /**
   * The constructor function takes a MapLayer and a urlCreator function as parameters and assigns them
   * to the corresponding properties of the class.
   * @param {MapLayer} layer - The `layer` parameter is of type `MapLayer` and represents the layer on
   * which the click event occurred.
   * @param urlCreator - The `urlCreator` parameter is a function that takes in two arguments: `layer`
   * and `clickEvent`. It returns either `null` or a string.
   */
  constructor(
    protected layer: MapLayer,
    urlCreator: (layer: MapLayer, clickEvent: L.LeafletMouseEvent) => null | string,
  ) {
    this.urlCreator = urlCreator;
  }

  /**
   * Called by the map component to get feature display element generation functions
   * @param http http client for use if required
   * @param mapState current MapState object
   * @param clickEvent Map click mouse event
   */
  public getFeatureDisplayItems(
    clickEvent: L.LeafletMouseEvent,
    http: HttpClient,
  ): Promise<Array<FeatureDisplayItem>> {

    return this.featureServiceCaller(
      http,
      this.layer,
      clickEvent,
    )
      .then((res: Record<string, unknown>) => {
        const mapFeatureItems = new Array<FeatureDisplayItem>();
        const features = this.responseResultsExtractor(res);
        if (features != null) {
          features.forEach((element: Record<string, unknown>) => {
            mapFeatureItems.push(
              new FeatureDisplayItem(
                element,
                () => {
                  const detailsMap = this.resultDetailsExtractor(element);
                  return this.itemDisplayGenerator(detailsMap, this.layer);
                },
              )
            );
          });
        }
        return mapFeatureItems;
      })
      .catch(() => {
        console.warn(`ERROR processing feature identify info for layer: ${this.layer.name}`);
        return new Array<FeatureDisplayItem>();
      });
  }

  /**
   * set this function to define how a service is called
   * @param featureServiceCaller Function that will return a function that returns feature details
   */
  public setFeatureServiceCaller(
    featureServiceCaller: (
      http: HttpClient,
      layer: MapLayer,
      clickEvent: L.LeafletMouseEvent,
    ) => Promise<Record<string, unknown>>,
  ): this {
    this.featureServiceCaller = featureServiceCaller;
    return this;
  }

  /**
   * @param urlCreator Function that defines how the the url is generated for
   * the default featureServiceCaller method
   */
  public setUrlCreator(
    urlCreator: (layer: MapLayer, clickEvent: L.LeafletMouseEvent) => string,
  ): this {
    this.urlCreator = urlCreator;
    return this;
  }

  /**
   * @param responseResultsExtractor function that defines how the feature response is
   * split into individual feature objects
   */
  public setResponseResultsExtractor(
    responseResultsExtractor: (res: Record<string, unknown>) => Array<Record<string, unknown>>,
  ): this {
    this.responseResultsExtractor = responseResultsExtractor;
    return this;
  }

  /**
   * @param resultDetailsExtractor function that defines how the required attributes of
   * the individual feature objects are extracted
   */
  public setResultDetailsExtractor(
    resultDetailsExtractor: (featureDetails: Record<string, unknown>) => Map<string, string>,
  ): this {
    this.resultDetailsExtractor = resultDetailsExtractor;
    return this;
  }

  /**
   * @param itemDisplayGenerator function that defines how the required feature attributes
   * are displayed
   */
  public setItemDisplayGenerator(
    itemDisplayGenerator: (
      itemDetails: Map<string, string>,
      layer: MapLayer,
    ) => HTMLElement,
  ): this {
    this.itemDisplayGenerator = itemDisplayGenerator;
    return this;
  }

  /**
   * The function is a TypeScript method that makes an HTTP GET request to retrieve feature identify
   * information for a given map layer and click event.
   * @param {HttpClient} http - The `http` parameter is an instance of the `HttpClient` class, which is
   * used to make HTTP requests.
   * @param {MapLayer} layer - The `layer` parameter is a MapLayer object that represents a layer on a
   * map. It contains information about the layer such as its name, type, and other properties.
   * @param clickEvent - The clickEvent parameter is an object that represents a Leaflet mouse event.
   * It contains information about the mouse click, such as the coordinates of the click and the target
   * element that was clicked on.
   * @returns a Promise that resolves to either null or a Record<string, unknown>.
   */
  protected defaultFeatureServiceCaller(
    http: HttpClient,
    layer: MapLayer,
    clickEvent: L.LeafletMouseEvent,
  ): Promise<null | Record<string, unknown>> {
    const url = this.urlCreator(layer, clickEvent);
    return Promise.resolve<null | Record<string, unknown>>(
      (null == url)
        ? null
        : http
          .get(url)
          .toPromise()
          .then((res: Record<string, unknown>) => res)
          .catch(() => {
            console.warn(`ERROR retrieving feature identify info for layer: ${layer.name}`);
            return null;
          }));
  }

  /**
   * The function extracts the "features" property from a response object and returns it as an array of
   * records.
   * @param res - The parameter `res` is of type `Record<string, unknown>`, which means it is an object
   * with string keys and unknown values.
   * @returns An array of objects, where each object has string keys and unknown values.
   */
  protected defaultResponseResultsExtractor(res: Record<string, unknown>): Array<Record<string, unknown>> {
    return res.features as Array<Record<string, unknown>>;
  }

  /**
   * The function extracts details from a feature and returns them as a map of string key-value pairs.
   * @param featureDetails - A record object containing feature details.
   * @returns a Map<string, string> object.
   */
  protected defaultResultDetailsExtractor(featureDetails: Record<string, unknown>): Map<string, string> {
    const returnMap = new Map<string, string>();
    const properties = featureDetails.properties as Record<string, unknown>;
    Object.keys(properties).forEach((key: string) => {
      returnMap.set(key, String(properties[key]));
    });
    return returnMap;
  }


  /**
   * The function generates an HTML element containing a table with key-value pairs from a map, along
   * with a title.
   * @param detailsMap - A map containing key-value pairs of details to be displayed in the table. The
   * keys are strings representing the details' names, and the values are strings representing the
   * details' values.
   * @param {MapLayer} layer - The `layer` parameter is of type `MapLayer`. It represents a layer in a
   * map.
   * @returns an HTMLElement.
   */
  protected defaultDisplayElementGenerator(
    detailsMap: Map<string, string>,
    layer: MapLayer,
  ): HTMLElement {
    const tbodyElement = document.createElement('tbody');

    detailsMap.forEach((value: string, key: string) => {
      const keyContent = document.createElement('td');
      keyContent.innerHTML = key;
      const valueContent = document.createElement('td');
      valueContent.innerHTML = value;

      const row = document.createElement('tr');
      row.appendChild(keyContent);
      row.appendChild(valueContent);
      tbodyElement.appendChild(row);
    });

    const tableElement = document.createElement('table');
    tableElement.classList.add('table');
    tableElement.classList.add('table-striped');
    tableElement.appendChild(tbodyElement);

    const titleElement = document.createElement('h5');
    titleElement.classList.add('popup-title');
    titleElement.innerHTML = layer.name;

    const displayElement = document.createElement('div');
    displayElement.appendChild(titleElement);
    displayElement.appendChild(tableElement);
    displayElement.classList.add('table-wrapper');

    return displayElement;
  }
}

/** The FeatureIdentifyDisplayItem class represents an item with a title and content in a display. */
export class FeatureIdentifyDisplayItem {
  constructor(

    /** The above code is declaring a TypeScript class with a public property called "title" of type
    HTMLElement. */
    public title: HTMLElement,

    /** The above code is defining a TypeScript class with a public property called "content" of type
    HTMLElement. */
    public content: HTMLElement,
  ) {
  }
}
