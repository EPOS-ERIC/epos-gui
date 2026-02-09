/** The `Style` class represents a style object with properties for colors, opacity, weight, marker
value, z-index, enable/disable status, and clustering status. */
export class Style {


  /** The line `public static readonly ZINDEX_TOP: string = '500';` is declaring a static constant
  property `ZINDEX_TOP` in the `Style` class. The property is of type `string` and its value is set to
  `'500'`. The `readonly` keyword indicates that the property cannot be modified once it is assigned a
  value. */
  public static readonly ZINDEX_TOP: string = '500';

  /** The line `public color1: number;` is declaring a public instance variable `color1` in the `Style`
  class. The variable is of type `number` and is not assigned a value in the constructor. It is used
  to store the color value for the first color in the style. */
  public color1: number;

  /** The line `public opacityColor1: number;` is declaring a public instance variable `opacityColor1` in
  the `Style` class. The variable is of type `number` and is not assigned a value in the constructor.
  It is used to store the opacity value for the first color in the style. */
  public opacityColor1: number;

  /** The line `public color2: number;` is declaring a public instance variable `color2` in the `Style`
  class. The variable is of type `number` and is not assigned a value in the constructor. It is used
  to store the color value for the second color in the style. */
  public color2: number;

  /** The line `public opacityColor2: number;` is declaring a public instance variable `opacityColor2` in
  the `Style` class. The variable is of type `number` and is not assigned a value in the constructor.
  It is used to store the opacity value for the second color in the style. */
  public opacityColor2: number;

  /** The line `public color1CssString: string;` is declaring a public instance variable `color1CssString`
  in the `Style` class. The variable is of type `string` and is not assigned a value in the
  constructor. It is used to store the CSS string representation of the first color in the style. */
  public color1CssString: string;

  /** The line `public color2CssString: string;` is declaring a public instance variable `color2CssString`
  in the `Style` class. The variable is of type `string` and is not assigned a value in the
  constructor. It is used to store the CSS string representation of the second color in the style. */
  public color2CssString: string;

  /** The line `public weight: number;` is declaring a public instance variable `weight` in the `Style`
  class. The variable is of type `number` and is not assigned a value in the constructor. It is used
  to store the weight value for the style. */
  public weight: number;

  /** The line `public markerValue: string;` is declaring a public instance variable `markerValue` in the
  `Style` class. The variable is of type `string` and is not assigned a value in the constructor. It
  is used to store the marker value for the style. */
  public markerValue: string;

  /** The line `public markerIconSize: number;` is declaring a public instance variable `markerIconSize`
  in the `Style` class. The variable is of type `number` and is not assigned a value in the
  constructor. It is used to store the size of the marker icon for the style. */
  public markerIconSize: number;

  /** The line `public zIndex: string;` is declaring a public instance variable `zIndex` in the `Style`
  class. The variable is of type `string` and is not assigned a value in the constructor. It is used
  to store the z-index value for the style. */
  public zIndex: string;

  /** The line `public enable: boolean;` is declaring a public instance variable `enable` in the `Style`
  class. The variable is of type `boolean` and is not assigned a value in the constructor. It is used
  to store the enable/disable status for the style. */
  public enable: boolean;

  /** The line `public clustering: boolean | null;` is declaring a public instance variable `clustering`
  in the `Style` class. The variable is of type `boolean | null`, which means it can either hold a
  boolean value or a null value. It is used to store the clustering status for the style. If the value
  is `true`, it indicates that clustering is enabled for the style. If the value is `false`, it
  indicates that clustering is disabled for the style. If the value is `null`, it indicates that the
  clustering status is not set or unknown. */
  public clustering: boolean | null;

  /**
   * The constructor function initializes the properties of a class instance with default values and
   * allows for optional parameters to be passed in.
   * @param {number | string} [color1=ffffff] - The color1 parameter is used to set the first color of
   * the marker. It can be either a number or a string representing a color value. The default value is
   * 'ffffff' (white).
   * @param {number | string} [color2=ffffff] - The `color2` parameter is used to specify the second
   * color for the constructor. It can be either a number or a string representing the color value. The
   * default value is `'ffffff'`, which corresponds to white.
   * @param {null | string} [id=null] - The `id` parameter is used to store an identifier for the object.
   * It can be either `null` or a string value.
   * @param [opacityColor1=0.8] - The `opacityColor1` parameter is used to set the opacity of `color1`.
   * It accepts a value between 0 and 1, where 0 represents fully transparent and 1 represents fully
   * opaque. The default value is 0.8.
   * @param [opacityColor2=0.8] - The `opacityColor2` parameter is used to set the opacity of the second
   * color in the constructor. It determines how transparent or opaque the second color will appear when
   * rendered. The default value is `0.8`, which means the second color will be 80% opaque.
   * @param [weight=3] - The weight parameter determines the thickness of the line or border of the
   * marker.
   * @param [markerValue] - The `markerValue` parameter is used to set the value of the marker. It can be
   * any string value that you want to associate with the marker.
   * @param [markerIconSize=20] - The `markerIconSize` parameter is used to specify the size of the
   * marker icon in pixels.
   * @param zIndex - The `zIndex` parameter determines the stacking order of the marker on the map. It
   * can have one of the following values:
   * @param [enable=true] - The `enable` parameter is a boolean value that determines whether the feature
   * is enabled or disabled. If `enable` is set to `true`, the feature is enabled. If `enable` is set to
   * `false`, the feature is disabled.
   * @param {null | boolean} [clustering=null] - The `clustering` parameter is used to enable or disable
   * clustering for markers. If it is set to `null`, the default clustering behavior will be used. If it
   * is set to `true`, clustering will be enabled. If it is set to `false`, clustering will be disabled.
   */
  constructor(
    color1: number | string = 'ffffff',
    color2: number | string = 'ffffff',
    private id: null | string = null,
    opacityColor1 = 0.8,
    opacityColor2 = 0.8,
    weight = 3,
    markerValue = '',
    markerIconSize = 20,
    zIndex = Style.ZINDEX_TOP,
    enable = true,
    clustering: null | boolean = null,
  ) {
    this.setColor1(color1);
    this.setColor2(color2);
    this.opacityColor1 = opacityColor1;
    this.opacityColor2 = opacityColor2;
    this.weight = weight;
    this.markerValue = markerValue;
    this.markerIconSize = markerIconSize;
    this.zIndex = zIndex;
    this.enable = enable;
    this.clustering = clustering;
  }

  /**
   * The function takes a simple object as input and returns a Style object with the corresponding
   * properties.
   * @param object - The `object` parameter is a JavaScript object that contains key-value pairs. The
   * keys are strings, and the values can be either strings or numbers.
   * @returns either null or an instance of the Style class.
   */
  public static makeFromSimpleObject(
    object: Record<string, string | number>,
  ): null | Style {
    return (null == object)
      ? null
      : new Style(
        Number(object.color1),
        Number(object.color2),
        String(object.id),
        Number(object.opacityColor1),
        Number(object.opacityColor2),
        Number(object.weight),
        String(object.markerValue),
        Number(object.markerIconSize),
        String(object.zIndex),
        Boolean(object.enable),
        object.clustering !== null ? Boolean(object.clustering) : null,
      );
  }

  /**
   * The function sets the id property of an object and returns the object itself.
   * @param {string} id - A string representing the ID value to be set.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setId(id: string): this {
    this.id = id;
    return this;
  }

  /**
   * The function `getId` returns the ID of an object, which can be either null or a string.
   * @returns The method is returning either null or a string value.
   */
  public getId(): null | string {
    return this.id;
  }

  /**
   * The function sets the enable property of an object and returns the object itself.
   * @param {boolean} enable - A boolean value that determines whether the feature or functionality
   * should be enabled or disabled.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setEnable(enable: boolean): this {
    this.enable = enable;
    return this;
  }

  /**
   * The function "getEnable" returns a boolean value indicating whether a certain feature is enabled or
   * not.
   * @returns The method is returning a boolean value, specifically the value of the variable "enable".
   */
  public getEnable(): boolean {
    return this.enable;
  }

  /**
   * The `setColor1` function sets the color1 property of an object and returns the object itself.
   * @param {number | string} color - The `color` parameter can be either a number or a string.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setColor1(color: number | string): this {
    this.color1 = this.parseColor(color);
    this.color1CssString = this.toString(this.color1, true);
    return this;
  }

  /**
   * The `setColor2` function sets the color of an object and returns the object itself.
   * @param {number | string} color - The `color` parameter can be either a number or a string.
   * @returns The method is returning the instance of the class itself (`this`).
   */
  public setColor2(color: number | string): this {
    this.color2 = this.parseColor(color);
    this.color2CssString = this.toString(this.color2, true);
    return this;
  }

  /**
   * The getColor1String function returns the color1 value as a string, either as a CSS hex string or a
   * regular string.
   * @param [asCssHexString=true] - The "asCssHexString" parameter is a boolean value that determines
   * whether the color should be returned as a CSS hexadecimal string or not. If the value is set to
   * true, the color will be returned as a CSS hexadecimal string (e.g., "#FF0000" for red). If the value
   * @returns The `getColor1String` method returns a string representation of the `color1` property. If
   * the `asCssHexString` parameter is set to `true`, the string will be in CSS hexadecimal format.
   */
  public getColor1String(asCssHexString = true): string {
    return this.toString(this.color1, asCssHexString);
  }

  /**
   * The getColor2String function returns the color2 property as a string, either as a CSS hex string or
   * a regular string.
   * @param [asCssHexString=true] - The `asCssHexString` parameter is a boolean value that determines
   * whether the color should be returned as a CSS hex string or not. If `asCssHexString` is set to
   * `true`, the color will be returned as a CSS hex string (e.g., "#FF0000"). If `
   * @returns The `getColor2String` method returns a string representation of the `color2` property. The
   * `asCssHexString` parameter determines whether the string representation should be in CSS hexadecimal
   * format or not.
   */
  public getColor2String(asCssHexString = true): string {
    return this.toString(this.color2, asCssHexString);
  }

  /**
   * The function getOpacityColor1() returns the value of the opacityColor1 property.
   * @returns The value of the variable `this.opacityColor1` is being returned.
   */
  public getOpacityColor1(): number {
    return this.opacityColor1;
  }

  /**
   * The function sets the opacity of color 1 and returns the instance of the class.
   * @param {number} opacity - The "opacity" parameter is a number that represents the opacity value for
   * a color. It determines how transparent or opaque the color will appear.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setOpacityColor1(opacity: number): this {
    this.opacityColor1 = opacity;
    return this;
  }

  /**
   * The function "getOpacityColor2" returns the value of the "opacityColor2" property.
   * @returns The value of the variable `this.opacityColor2` is being returned.
   */
  public getOpacityColor2(): number {
    return this.opacityColor2;
  }

  /**
   * The function sets the opacity of a color and returns the object it was called on.
   * @param {number} opacity - The "opacity" parameter is a number that represents the opacity value for
   * a color. It determines how transparent or opaque the color will appear.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setOpacityColor2(opacity: number): this {
    this.opacityColor2 = opacity;
    return this;
  }

  /**
   * The function "getWeight" returns the weight of an object.
   * @returns The weight of the object.
   */
  public getWeight(): number {
    return this.weight;
  }

  /**
   * The function "setWeight" sets the weight property of an object and returns the object itself.
   * @param {number} weight - The "weight" parameter is a number that represents the weight value to be
   * set.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setWeight(weight: number): this {
    this.weight = weight;
    return this;
  }

  /**
   * The function "getMarkerValue" returns the value of the marker.
   * @returns The method is returning a string value.
   */
  public getMarkerValue(): string {
    return this.markerValue;
  }

  /**
   * The function sets the value of a marker and returns the instance of the class.
   * @param {string} url - A string representing the URL value to be set for the marker.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setMarkerValue(url: string): this {
    this.markerValue = url;
    return this;
  }

  /**
   * The function returns the marker icon size.
   * @returns The method is returning the value of the variable `markerIconSize`, which is of type
   * `number`.
   */
  public getMarkerIconSize(): number {
    return this.markerIconSize;
  }

  /**
   * The function sets the size of a marker icon and returns the instance of the class.
   * @param {number} size - The size parameter is a number that represents the desired size of the marker
   * icon.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setMarkerIconSize(size: number): this {
    this.markerIconSize = size;
    return this;
  }

  /**
   * The function "getZIndex" returns the value of the "zIndex" property as a string.
   * @returns The `getZIndex` method is returning a string value.
   */
  public getZIndex(): string {
    return this.zIndex;
  }

  /**
   * The function sets the z-index property of an object and returns the object itself.
   * @param {string} zIndex - The zIndex parameter is a string that represents the desired z-index value
   * for an element. The z-index determines the stacking order of elements on a web page. Elements with a
   * higher z-index value will appear on top of elements with a lower z-index value.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setZIndex(zIndex: string): this {
    this.zIndex = zIndex;
    return this;
  }

  /**
   * The function "getClustering" returns a boolean value indicating whether clustering is enabled or
   * not, or null if the value is not set.
   * @returns The method is returning a boolean value or null.
   */
  public getClustering(): boolean | null {
    return this.clustering;
  }

  /**
   * The function sets the clustering property of an object and returns the object itself.
   * @param {boolean} clustering - A boolean value indicating whether clustering should be enabled or
   * disabled.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setClustering(clustering: boolean): this {
    this.clustering = clustering;
    return this;
  }

  /**
   * The `toString` function converts a color value to either a CSS hex string or a regular hex string
   * based on the `asCssHexString` parameter.
   * @param {number} color - The color parameter is a number that represents a color value.
   * @param [asCssHexString=false] - The `asCssHexString` parameter is a boolean flag that determines
   * whether the color should be converted to a CSS hex string format or a regular hex string format. If
   * `asCssHexString` is set to `true`, the color will be converted to a CSS hex string format. If `asCss
   * @returns The method is returning a string.
   */
  private toString(color: number, asCssHexString = false): string {
    return (asCssHexString)
      ? this.toCssHexString(color)
      : this.toHexString(color);
  }

  /**
   * The function converts a number representing a color to a hexadecimal string.
   * @param {number} color - The color parameter is a number that represents a color value.
   * @returns a string representation of the given color number in hexadecimal format.
   */
  private toHexString(color: number): string {
    return color.toString(16).padStart(6, '0');
  }

  /**
   * The function converts a number representing a color to a CSS hexadecimal string.
   * @param {number} color - The `color` parameter is a number representing a color value.
   * @returns a string that represents the given color in CSS hexadecimal format.
   */
  private toCssHexString(color: number): string {
    return `#${this.toHexString(color)}`;
  }

  /**
   * The function `parseColor` converts a color value from either a number or a string format to a number
   * format.
   * @param {number | string} color - The `color` parameter can be either a number or a string.
   * @returns a number.
   */
  private parseColor(color: number | string): number {
    return ('string' === typeof color) ? parseInt(color, 16) : color;
  }
}
