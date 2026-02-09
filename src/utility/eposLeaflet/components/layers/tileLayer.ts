import * as L from 'leaflet';
import { MapLayer } from './mapLayer.abstract';
import { HttpClient } from '@angular/common/http';

// options: http://leafletjs.com/reference-1.2.0.html#tilelayer
export class TileLayer extends MapLayer {
  public url: string;
  public attr: string;
  public sd: Array<string>;

  constructor(id: string, name?: string) {
    super(id, name);
    // Default options
    this.options.setOptions({
      pane: 'tilePane',
    });
  }

  /**
   * The function `setUrl` in TypeScript sets the URL property of an object and returns the object
   * itself for method chaining.
   * @param {string} url - The `url` parameter in the `setUrl` method is a string type parameter. It is
   * used to set the URL value for the object or instance on which the method is called.
   * @returns The `this` keyword is being returned, which allows for method chaining.
   */
  public setUrl(url: string): this {
    this.url = url;
    return this;
  }

  /**
   * The function `setAttr` sets an attribute value and updates the options with the new attribution.
   * @param {string} attr - The `attr` parameter in the `setAttr` method is a string that represents
   * the attribute value being set for the object.
   * @returns The method `setAttr` is returning `this`, which refers to the current instance of the
   * class.
   */
  public setAttr(attr: string): this {
    this.attr = attr;
    const opt = this.options.getAll();
    opt.attribution = attr;
    this.options.setOptions(opt);
    return this;
  }

  /**
   * The function `setSubdomain` sets the subdomain property of an object and updates the options
   * accordingly.
   * @param sd - The `setSubdomain` method in the code snippet is a function that sets the subdomains
   * for a particular object. The `sd` parameter is an array of strings that represents the subdomains
   * to be set for the object.
   * @returns The `setSubdomain` method is returning the current instance of the class (usually
   * referred to as `this`).
   */
  public setSubdomain(sd: Array<string>): this {
    this.sd = sd;
    const opt = this.options.getAll();
    opt.subdomains = sd;
    this.options.setOptions(opt);
    return this;
  }

  /**
   * The function `getLeafletLayer` returns a Promise that resolves to a Leaflet TileLayer with a
   * specified URL and options.
   * @returns A Promise that resolves to either `null` or an instance of `L.Layer`, specifically a
   * `L.TileLayer` with the provided URL and options.
   */
  public getLeafletLayer(http: HttpClient): Promise<null | L.Layer> {
    return Promise.resolve(new L.TileLayer(this.url, this.options.getAll()));
  }

  public setOptions(options: L.TileLayerOptions): this {
    const current = this.options.getAll();
    this.options.setOptions({ ...current, ...options });
    return this;
  }


}
