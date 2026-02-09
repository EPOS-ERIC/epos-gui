import { MapLayer } from '../../layers/mapLayer.abstract';

/** The `BaseLayerOption` class is a TypeScript class that represents a base layer option for a map,
with properties for name, layers, and thumbnail source. */
export class BaseLayerOption {

  /**
   * The constructor function takes in a name, a function to get layers, and a function to get the
   * thumbnail source, and assigns them to corresponding properties.
   * @param {string} name - A string representing the name of the constructor.
   * @param getLayers - The `getLayers` parameter is a function that returns an array of `MapLayer`
   * objects. It does not take any arguments and should be implemented by the caller of the
   * constructor.
   * @param getThumnailSource - The `getThumnailSource` parameter is a function that returns a string
   * representing the source of the thumbnail image for the map.
   */
  constructor(

    /** The line `public name: string` is declaring a public property named `name` with a type of `string`.
    This property will be accessible outside of the class and can be used to store the name of the
    constructor. */
    public name: string,

    /** The line `public getLayers: () => Array<MapLayer>` is declaring a public property named `getLayers`
    with a type of function. This property is a getter function that returns an array of `MapLayer`
    objects. The `() => Array<MapLayer>` syntax indicates that the function does not take any arguments
    and returns an array of `MapLayer` objects. */
    public getLayers: () => Array<MapLayer>,

    /** The line `public getThumnailSource: () => string` is declaring a public property named
    `getThumnailSource` with a type of function. This property is a getter function that returns a
    string representing the source of the thumbnail image for the map. */
    public getThumnailSource: () => string,

    public supportedCRS: string[] = ['EPSG:3857'],
  ) { }
}
