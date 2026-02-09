import { Stylable } from 'utility/styler/stylable.interface';
import { Gettable, Settable } from '../../objects/configAttributes/configAttributeInterfaces';
import { SimpleConfigObservableWithValue } from '../../objects/configAttributes/simpleConfigObservableWithValue';
import { SimpleConfigValue } from '../../objects/configAttributes/simpleConfigValue';

/** The `LayerOptions` class represents a set of configurable options for a layer, with properties for
various settings such as pane, opacity, color, fill color, weight, marker, clustering, enable,
styling, and z-index. */
export class LayerOptions<T1> {

  /** The line `public pane = new SimpleConfigValue<T1, string>(this._context);` is declaring a public
  property named `pane` of type `SimpleConfigValue<T1, string>`. It is initializing the property with
  a new instance of the `SimpleConfigValue` class, passing `this._context` as an argument to the
  constructor. */
  public pane = new SimpleConfigValue<T1, string>(this._context);

  /** The line `public customLayerOptionPaneType = new SimpleConfigValue<T1, string>(this._context);` is
  declaring a public property named `customLayerOptionPaneType` of type `SimpleConfigValue<T1,
  string>`. It is initializing the property with a new instance of the `SimpleConfigValue` class,
  passing `this._context` as an argument to the constructor. */
  public customLayerOptionPaneType = new SimpleConfigValue<T1, string>(this._context);

  /** The line `public customLayerOptionOpacity = new SimpleConfigObservableWithValue<T1,
  number>(this._context);` is declaring a public property named `customLayerOptionOpacity` of type
  `SimpleConfigObservableWithValue<T1, number>`. It is initializing the property with a new instance
  of the `SimpleConfigObservableWithValue` class, passing `this._context` as an argument to the
  constructor. This property represents an observable value for the opacity of a custom layer option. */
  public customLayerOptionOpacity = new SimpleConfigObservableWithValue<T1, number>(this._context);

  /** The line `public customLayerOptionColor = new SimpleConfigObservableWithValue<T1,
  string>(this._context);` is declaring a public property named `customLayerOptionColor` of type
  `SimpleConfigObservableWithValue<T1, string>`. It is initializing the property with a new instance
  of the `SimpleConfigObservableWithValue` class, passing `this._context` as an argument to the
  constructor. This property represents an observable value for the color of a custom layer option. */
  public customLayerOptionColor = new SimpleConfigObservableWithValue<T1, string>(this._context);

  /** The line `public customLayerOptionFillColor = new SimpleConfigObservableWithValue<T1,
  string>(this._context);` is declaring a public property named `customLayerOptionFillColor` of type
  `SimpleConfigObservableWithValue<T1, string>`. It is initializing the property with a new instance
  of the `SimpleConfigObservableWithValue` class, passing `this._context` as an argument to the
  constructor. This property represents an observable value for the fill color of a custom layer
  option. */
  public customLayerOptionFillColor = new SimpleConfigObservableWithValue<T1, string>(this._context);

  /** The line `public customLayerOptionFillColorOpacity = new SimpleConfigObservableWithValue<T1,
  number>(this._context);` is declaring a public property named `customLayerOptionFillColorOpacity` of
  type `SimpleConfigObservableWithValue<T1, number>`. It is initializing the property with a new
  instance of the `SimpleConfigObservableWithValue` class, passing `this._context` as an argument to
  the constructor. This property represents an observable value for the opacity of the fill color of a
  custom layer option. */
  public customLayerOptionFillColorOpacity = new SimpleConfigObservableWithValue<T1, number>(this._context);

  /** The line `public customLayerOptionWeight = new SimpleConfigObservableWithValue<T1,
  number>(this._context);` is declaring a public property named `customLayerOptionWeight` of type
  `SimpleConfigObservableWithValue<T1, number>`. It is initializing the property with a new instance
  of the `SimpleConfigObservableWithValue` class, passing `this._context` as an argument to the
  constructor. This property represents an observable value for the weight of a custom layer option. */
  public customLayerOptionWeight = new SimpleConfigObservableWithValue<T1, number>(this._context);

  /** The line `public customLayerOptionHasMarker = new SimpleConfigValue<T1, boolean>(this._context);` is
  declaring a public property named `customLayerOptionHasMarker` of type `SimpleConfigValue<T1,
  boolean>`. It is initializing the property with a new instance of the `SimpleConfigValue` class,
  passing `this._context` as an argument to the constructor. This property represents a configuration
  option for whether a custom layer has a marker. */
  public customLayerOptionHasMarker = new SimpleConfigValue<T1, boolean>(this._context);

  /** The line `public customLayerOptionMarkerType = new SimpleConfigValue<T1, string>(this._context);` is
  declaring a public property named `customLayerOptionMarkerType` of type `SimpleConfigValue<T1,
  string>`. It is initializing the property with a new instance of the `SimpleConfigValue` class,
  passing `this._context` as an argument to the constructor. This property represents a configuration
  option for the marker type of a custom layer. */
  public customLayerOptionMarkerType = new SimpleConfigValue<T1, string>(this._context);

  /** The line `public customLayerOptionMarkerIconSize = new SimpleConfigObservableWithValue<T1,
  number>(this._context);` is declaring a public property named `customLayerOptionMarkerIconSize` of
  type `SimpleConfigObservableWithValue<T1, number>`. It is initializing the property with a new
  instance of the `SimpleConfigObservableWithValue` class, passing `this._context` as an argument to
  the constructor. This property represents an observable value for the icon size of a marker in a
  custom layer option. */
  public customLayerOptionMarkerIconSize = new SimpleConfigObservableWithValue<T1, number>(this._context);

  /** The line `public customLayerOptionMarkerOriginValue = new SimpleConfigValue<T1,
  string>(this._context);` is declaring a public property named `customLayerOptionMarkerOriginValue`
  of type `SimpleConfigValue<T1, string>`. It is initializing the property with a new instance of the
  `SimpleConfigValue` class, passing `this._context` as an argument to the constructor. This property
  represents a configuration option for the origin value of a marker in a custom layer. */
  public customLayerOptionMarkerOriginValue = new SimpleConfigValue<T1, string>(this._context);

  /** The line `public customLayerOptionMarkerValue = new SimpleConfigObservableWithValue<T1,
  string>(this._context);` is declaring a public property named `customLayerOptionMarkerValue` of type
  `SimpleConfigObservableWithValue<T1, string>`. It is initializing the property with a new instance
  of the `SimpleConfigObservableWithValue` class, passing `this._context` as an argument to the
  constructor. This property represents an observable value for the marker value of a custom layer
  option. */
  public customLayerOptionMarkerValue = new SimpleConfigObservableWithValue<T1, string>(this._context);

  /** The line `public customLayerOptionClustering = new SimpleConfigObservableWithValue<T1,
  boolean>(this._context);` is declaring a public property named `customLayerOptionClustering` of type
  `SimpleConfigObservableWithValue<T1, boolean>`. It is initializing the property with a new instance
  of the `SimpleConfigObservableWithValue` class, passing `this._context` as an argument to the
  constructor. This property represents an observable value for the clustering option of a custom
  layer. */
  public customLayerOptionClustering = new SimpleConfigObservableWithValue<T1, boolean>(this._context);

  /** The line `public customLayerOptionEnable = new SimpleConfigObservableWithValue<T1,
  boolean>(this._context);` is declaring a public property named `customLayerOptionEnable` of type
  `SimpleConfigObservableWithValue<T1, boolean>`. It is initializing the property with a new instance
  of the `SimpleConfigObservableWithValue` class, passing `this._context` as an argument to the
  constructor. This property represents an observable value for the enable option of a custom layer. */
  public customLayerOptionEnable = new SimpleConfigObservableWithValue<T1, boolean>(this._context);

  /** The line `public customLayerOptionStylable = new SimpleConfigValue<T1, Stylable>(this._context);` is
  declaring a public property named `customLayerOptionStylable` of type `SimpleConfigValue<T1,
  Stylable>`. It is initializing the property with a new instance of the `SimpleConfigValue` class,
  passing `this._context` as an argument to the constructor. This property represents a configuration
  option for the styling of a custom layer. The `Stylable` type represents the styling options that
  can be applied to the custom layer. */
  public customLayerOptionStylable = new SimpleConfigValue<T1, Stylable>(this._context);

  /** The line `public customLayerOptionZIndex = new SimpleConfigObservableWithValue<T1,
  string>(this._context);` is declaring a public property named `customLayerOptionZIndex` of type
  `SimpleConfigObservableWithValue<T1, string>`. It is initializing the property with a new instance
  of the `SimpleConfigObservableWithValue` class, passing `this._context` as an argument to the
  constructor. This property represents an observable value for the z-index of a custom layer option.
  The z-index determines the stacking order of elements on a webpage, with higher values appearing on
  top of lower values. */
  public customLayerOptionZIndex = new SimpleConfigObservableWithValue<T1, string>(this._context);

  // Also this property is needed specifically for WMTS layers. When creating new WMS/WMTS layers from Table, this option will be populated with the GetMap/GetTile of the template url.
  public customURLTemplate = new SimpleConfigObservableWithValue<T1, string>(this._context);

  /**
   * The constructor function takes a parameter of type T1 and assigns it to the protected property
   * _context.
   * @param {T1} _context - The `_context` parameter is a protected property of type `T1`. It is used
   * to store a reference to an object of type `T1` that is passed to the constructor when creating an
   * instance of the class. The `protected` keyword indicates that the property can only be accessed
   * within the
   */
  constructor(protected _context: T1) { }

  /**
   * The function getAll() returns an object containing the values of properties that have a "get"
   * method.
   * @returns an object of type `Record<string, unknown>`.
   */
  public getAll(): Record<string, unknown> {
    const returnObj: Record<string, unknown> = {};
    Object.keys(this).forEach((key: string) => {
      if (typeof (this[key] as Gettable<T1, unknown>).get === 'function') {
        returnObj[key] = this.get(key);
      }
    });
    return returnObj;
  }

  /**
   * The function `setOptions` sets the options of an object based on a given record of key-value
   * pairs.
   * @param options - The `options` parameter is an object that contains key-value pairs. Each key
   * represents a setting or option, and the corresponding value represents the value to be set for
   * that option.
   * @returns The method `setOptions` is returning `this._context`.
   */
  public setOptions(options: Record<string, unknown>): T1 {
    for (const key in options) {
      // eslint-disable-next-line no-prototype-builtins
      if (options.hasOwnProperty(key)) {
        this.set(key, options[key]);
      }
    }
    return this._context;
  }

  /**
   * The function sets a value for a given key in a TypeScript class and returns the class instance.
   * @param {string} key - A string representing the key for the value to be set in the configuration.
   * @param {T2} value - The `value` parameter is the value that you want to set for the given key. It
   * can be of any type (`T2`).
   * @returns The method is returning the `_context` property of the object.
   */
  public set<T2 = unknown>(key: string, value: T2): T1 {
    if (typeof this[key] === 'undefined') {
      this[key] = new SimpleConfigValue<T1, null | T2>(this._context, null, value);
    } else {
      (this[key] as Settable<T1, T2>).set(value);
    }
    return this._context;
  }

  /**
   * The function `get` retrieves a value from an object using a specified key, and returns null if the
   * value is not found or does not have a `get` method.
   * @param {string} key - The `key` parameter is a string that represents the key of the property we
   * want to retrieve from an object.
   * @returns The method is returning either null or the value of type T2.
   */
  public get<T2 = unknown>(key: string): null | T2 {
    const option = (this[key] as Gettable<T1, T2>);
    return ((option != null) && (typeof option.get === 'function'))
      ? option.get()
      : null;
  }
}
