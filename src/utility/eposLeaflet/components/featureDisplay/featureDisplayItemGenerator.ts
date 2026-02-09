import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { FeatureDisplayItem } from './featureDisplayItem';

/** The `export interface FeatureDisplayItemGenerator {` statement is defining an interface named
`FeatureDisplayItemGenerator`. An interface in TypeScript is a way to define a contract for objects.
In this case, the `FeatureDisplayItemGenerator` interface specifies that any class implementing it
must have a `getFeatureDisplayItems` method that takes a `clickEvent` of type `L.LeafletMouseEvent`
and an `http` of type `HttpClient` as parameters, and returns a promise that resolves to an array of
`FeatureDisplayItem` objects. */
export interface FeatureDisplayItemGenerator {

  /** The `getFeatureDisplayItems` method is a function that takes two parameters: `clickEvent` of type
  `L.LeafletMouseEvent` and `http` of type `HttpClient`. It returns a promise that resolves to an
  array of `FeatureDisplayItem` objects. */
  getFeatureDisplayItems(
    clickEvent: L.LeafletMouseEvent,
    http: HttpClient,
  ): Promise<Array<FeatureDisplayItem>>;
}

/** The `SimpleFeatureDisplayItemGenerator` class is a TypeScript implementation of the
`FeatureDisplayItemGenerator` interface that retrieves a list of feature display items based on a
Leaflet mouse click event and an HTTP client. */
export class SimpleFeatureDisplayItemGenerator implements FeatureDisplayItemGenerator {
  /**
   * The constructor takes in a function that retrieves a list of feature display items based on a
   * Leaflet mouse click event and an HTTP client.
   * @param getLayerFeatureDisplayItemFunc - The `getLayerFeatureDisplayItemFunc` parameter is a
   * function that takes two arguments: `clickEvent` of type `L.LeafletMouseEvent` and `http` of type
   * `HttpClient`. This function returns a promise that resolves to an array of `FeatureDisplayItem`
   * objects.
   */
  constructor(
    protected getLayerFeatureDisplayItemFunc: (
      clickEvent: L.LeafletMouseEvent,
      http: HttpClient,
    ) => Promise<Array<FeatureDisplayItem>>,
  ) { }

  /**
   * The function `getFeatureDisplayItems` takes a click event and an HTTP client as parameters and
   * returns a promise that resolves to an array of `FeatureDisplayItem` objects.
   * @param clickEvent - The click event that triggered the function. It contains information about the
   * location where the click occurred on the map.
   * @param {HttpClient} http - The `http` parameter is an instance of the `HttpClient` class, which is
   * used to make HTTP requests. It is typically used to send requests to a server and receive
   * responses.
   * @returns An array of FeatureDisplayItem objects.
   */
  public getFeatureDisplayItems(
    clickEvent: L.LeafletMouseEvent,
    http: HttpClient,
  ): Promise<Array<FeatureDisplayItem>> {
    return this.getLayerFeatureDisplayItemFunc(
      clickEvent,
      http,
    );
  }
}
