import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { FeatureDisplayItemGenerator } from './featureDisplayItemGenerator';
import { FeatureDisplayItem } from './featureDisplayItem';
import { MapLayer } from '../layers/mapLayer.abstract';

export class HtmlFeatureIdentifier implements FeatureDisplayItemGenerator {
  // used to call service for feature data
  protected featureServiceCaller = this.defaultFeatureServiceCaller.bind(this) as (
    http: HttpClient,
    layer: MapLayer,
    clickEvent: L.LeafletMouseEvent,
  ) => Promise<string>;
  // used (by the default feature service caller) to generate a url to get the feature details
  protected urlCreator: (layer: MapLayer, clickEvent: L.LeafletMouseEvent) => string;

  protected itemDisplayGenerator = this.defaultDisplayElementGenerator.bind(this) as (
    content: string,
    layer: MapLayer,
  ) => HTMLElement;

  constructor(protected layer: MapLayer, urlCreator: (layer: MapLayer, clickEvent: L.LeafletMouseEvent) => string) {
    this.urlCreator = urlCreator;
  }

  /**
   * Called by the map component to get feature display element generation functions
   * @param http http client for use if required
   * @param mapState current MapState object
   * @param clickEvent Map click mouse event
   */
  public getFeatureDisplayItems(clickEvent: L.LeafletMouseEvent, http: HttpClient): Promise<Array<FeatureDisplayItem>> {
    return this.featureServiceCaller(http, this.layer, clickEvent)
      .then((body: string) => {
        const features = new Array<FeatureDisplayItem>();
        if (0 !== body.trim().length) {
          features.push(
            new FeatureDisplayItem(null, () => {
              return this.itemDisplayGenerator(body, this.layer);
            }),
          );
        }
        return features;
      })
      .catch(() => {
        console.warn(`ERROR processing feature identify info for layer: ${this.layer.name}`);
        return Promise.resolve(new Array<FeatureDisplayItem>());
      });
  }

  /**
   * set this function to define how a service is called
   * @param featureServiceCaller Function that will return a function that returns feature details
   */
  public setFeatureServiceCaller(
    featureServiceCaller: (http: HttpClient, layer: MapLayer, clickEvent: L.LeafletMouseEvent) => Promise<string>,
  ): this {
    this.featureServiceCaller = featureServiceCaller;
    return this;
  }

  /**
   * @param urlCreator Function that defines how the the url is generated for
   * the default featureServiceCaller method
   */
  public setUrlCreator(urlCreator: (layer: MapLayer, clickEvent: L.LeafletMouseEvent) => string): this {
    this.urlCreator = urlCreator;
    return this;
  }

  /**
   * @param itemDisplayGenerator function that defines how the required feature attributes
   * are displayed
   */
  public setItemDisplayGenerator(itemDisplayGenerator: (content: string, layer: MapLayer) => HTMLElement): this {
    this.itemDisplayGenerator = itemDisplayGenerator;
    return this;
  }

  // default featureServiceCaller
  // uses the set urlCreator function
  protected defaultFeatureServiceCaller(
    http: HttpClient,
    layer: MapLayer,
    clickEvent: L.LeafletMouseEvent,
  ): Promise<null | string | undefined> {
    const url = this.urlCreator(layer, clickEvent);
    return Promise.resolve<null | string | undefined>(
      (null == url)
        ? null
        : http
          .get(url, { responseType: 'text' })
          .toPromise()
          .catch(() => {
            console.warn(`ERROR retrieving feature identify info for layer: ${layer.name}`);
            return null;
          }),
    );
  }

  // default itemDisplayGenerator
  // displays feature details in a table
  protected defaultDisplayElementGenerator(content: string, layer: MapLayer): HTMLElement {
    const titleElement = document.createElement('h5');
    titleElement.classList.add('popup-title');
    titleElement.innerHTML = layer.name;

    const displayElement = document.createElement('div');
    displayElement.classList.add('html-feature-wrapper');
    displayElement.innerHTML = content;
    displayElement.append();

    const featureWrapper = document.createElement('div');
    featureWrapper.appendChild(titleElement);
    featureWrapper.appendChild(displayElement);

    return featureWrapper;
  }
}
