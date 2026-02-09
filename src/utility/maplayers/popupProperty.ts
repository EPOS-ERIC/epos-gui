/** The class `PopupProperty` represents a property of a popup in a TypeScript application, with various
properties and methods for managing and formatting the property's values. */
export class PopupProperty {

  /** The line `public static readonly LONG_LAT = 'longitude , latitude';` is declaring a public static
  readonly property named `LONG_LAT` in the `PopupProperty` class. The value of this property is a
  string `'longitude , latitude'`. This property is used to represent the name of a property that
  contains longitude and latitude values in a popup. */
  public static readonly LONG_LAT = 'longitude , latitude';

  /** The line `public static readonly PROPERTY_ID = 'propertyId';` is declaring a public static
  readonly property named `PROPERTY_ID` in the `PopupProperty` class. The value of this property is
  a string `'propertyId'`. This property is used to represent the name of a property that identifies
  a specific popup. */
  public static readonly PROPERTY_ID = 'propertyId';

  /** The line `public static readonly POINTS_ON_MAP = 'pointsOnMap';` is declaring a public static
  readonly property named `POINTS_ON_MAP` in the `PopupProperty` class. The value of this property
  is a string `'pointsOnMap'`. This property is used to represent the name of a property that
  contains points on a map in a popup. */
  public static readonly POINTS_ON_MAP = 'pointsOnMap';

  /** The line `public static readonly TOGGLE_ON_MAP = 'toggleOnMap';` is declaring a public static
  readonly property named `TOGGLE_ON_MAP` in the `PopupProperty` class. The value of this property is
  a string `'toggleOnMap'`. This property is used to represent the name of a property that indicates
  whether to toggle the popup on a map or not. */
  public static readonly TOGGLE_ON_MAP = 'toggleOnMap';

  /** The line `public static readonly SHOW_ON_MAP = 'showOnMap';` is declaring a public static readonly
  property named `SHOW_ON_MAP` in the `PopupProperty` class. The value of this property is a string
  `'showOnMap'`. This property is used to represent the name of a property that indicates whether to
  show the popup on a map or not. */
  public static readonly SHOW_ON_MAP = 'showOnMap';

  public static readonly IMAGES = 'eposImages';

  /** The line `public readonly isEmpty: boolean;` is declaring a public readonly property named
  `isEmpty` in the `PopupProperty` class. This property is of type boolean and is used to determine
  if the `values` array of the `PopupProperty` instance is empty or not. It is initialized in the
  constructor of the `PopupProperty` class by checking the length of the `values` array. If the
  length is 0, `isEmpty` is set to `true`, indicating that the `values` array is empty. Otherwise,
  `isEmpty` is set to `false`. */
  public readonly isEmpty: boolean;

  /** The line `public readonly isSingleValue: boolean;` is declaring a public readonly property named
  `isSingleValue` in the `PopupProperty` class. This property is of type boolean and is used to
  determine if the `values` array of the `PopupProperty` instance contains a single value or not. */
  public readonly isSingleValue: boolean;

  /** The `public readonly valuesConcatString: string;` property in the `PopupProperty` class is used to
  store a concatenated string representation of the values in the `values` array. This property is
  of type string and is declared as `public` and `readonly`, meaning it can be accessed from outside
  the class but cannot be modified. */
  public readonly valuesConcatString: string;

  /** The line `public isIdentify = false;` is declaring a public property named `isIdentify` in the
  `PopupProperty` class and initializing it with the value `false`. This property is of type boolean
  and is used to determine if the `PopupProperty` instance represents an identification property. If
  `isIdentify` is `true`, it means that the `name` property of the `PopupProperty` instance is equal
  to the `PROPERTY_ID` property of the `PopupProperty` class, indicating that it is an
  identification property. */
  public isIdentify = false;

  /** The line `public formatType = '';` is declaring a public property named `formatType` in the
  `PopupProperty` class and initializing it with an empty string (`''`). This property is used to
  store the format type of the popup property. It can be set using the `setFormatType` method of the
  `PopupProperty` class. */
  public formatType = '';

  public description = '';

  /**
   * The constructor initializes the properties of a PopupProperty object and performs some additional
   * checks and assignments.
   * @param {string} name - The name parameter is a string that represents the name of the popup
   * property.
   * @param values - An array that can contain numbers, booleans, or strings.
   * @param type - The `type` parameter is of type `PopupPropertyType` and is used to specify the type
   * of the popup property. It has a default value of `PopupPropertyType.SIMPLE`.
   * @param [authenticatedDownloadFileName] - The `authenticatedDownloadFileName` parameter is a string
   * that represents the name of the file that will be downloaded when the user is authenticated. It is
   * an optional parameter and its default value is an empty string.
   */
  constructor(
    public name: string,
    public readonly values: Array<number | boolean | string>,
    public type = PopupPropertyType.SIMPLE,
    public readonly authenticatedDownloadFileName = '',
  ) {
    this.name = name.trim();
    this.authenticatedDownloadFileName = authenticatedDownloadFileName.trim();
    this.isEmpty = this.values.length === 0;
    this.isSingleValue = this.values.length === 1;
    this.valuesConcatString = values.toString().toLowerCase();

    if (this.name === PopupProperty.PROPERTY_ID) {
      this.isIdentify = true;
    }
  }

  /**
   * The function checks if a given value is present in a concatenated string of values.
   * @param {string} value - The parameter "value" is a string that represents the value we want to
   * check if it exists in the "valuesConcatString" property.
   * @returns A boolean value is being returned.
   */
  public contains(value: string): boolean {
    return (this.valuesConcatString.indexOf(value) > -1);
  }

  /**
   * The function sets the format type and returns the instance of the class.
   * @param {string} formatType - The formatType parameter is a string that represents the type of
   * format to be set.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setFormatType(formatType: string): this {
    this.formatType = formatType;
    return this;
  }

  public setType(type: PopupPropertyType): this {
    this.type = type;
    return this;
  }

  public setDescription(description: string): this {
    this.description = description;
    return this;
  }
}

/* The `export enum PopupPropertyType` is defining an enumeration in TypeScript. An enumeration, or
enum, is a way to define a set of named values. In this case, the `PopupPropertyType` enum has two
values: `SIMPLE` and `AUTHENTICATED_DOWNLOAD`. */
export enum PopupPropertyType {
  SIMPLE,
  AUTHENTICATED_DOWNLOAD,
  IMAGE,
}
