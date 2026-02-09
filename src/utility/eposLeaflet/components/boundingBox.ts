export class BoundingBox {

  protected id: string;

  /** The `protected bounded: boolean;` line is declaring a protected property named `bounded` of type
  boolean in the `BoundingBox` class. The `protected` keyword means that the property can only be
  accessed within the class and its subclasses. */
  protected bounded: boolean;

  /** The line `protected maxLat: number;` is declaring a protected property named `maxLat` of type number
  in the `BoundingBox` class. The `protected` keyword means that the property can only be accessed
  within the class and its subclasses. This property represents the maximum latitude value of the
  bounding box. */
  protected maxLat: number;

  /** The line `protected maxLon: number;` is declaring a protected property named `maxLon` of type number
  in the `BoundingBox` class. The `protected` keyword means that the property can only be accessed
  within the class and its subclasses. This property represents the maximum longitude value of the
  bounding box. */
  protected maxLon: number;

  /** The line `protected minLat: number;` is declaring a protected property named `minLat` of type number
  in the `BoundingBox` class. The `protected` keyword means that the property can only be accessed
  within the class and its subclasses. This property represents the minimum latitude value of the
  bounding box. */
  protected minLat: number;

  /** The line `protected minLon: number;` is declaring a protected property named `minLon` of type number
  in the `BoundingBox` class. The `protected` keyword means that the property can only be accessed
  within the class and its subclasses. This property represents the minimum longitude value of the
  bounding box. */
  protected minLon: number;

  /**
   * The constructor function initializes the bounded property and assigns values to the maxLat,
   * maxLon, minLat, and minLon properties if they are not null.
   * @param {null | number} maxLat - The `maxLat` parameter represents the maximum latitude value. It
   * can be either a number or `null`.
   * @param {null | number} maxLon - The `maxLon` parameter represents the maximum longitude value. It
   * specifies the easternmost point of a bounding box or area.
   * @param {null | number} minLat - The `minLat` parameter represents the minimum latitude value for a
   * bounding box. It is a nullable number, meaning it can either be a number or null.
   * @param {null | number} minLon - The `minLon` parameter represents the minimum longitude value. It
   * is used to define the lower boundary of a geographical area.
   */
  public constructor(maxLat: null | number, maxLon: null | number, minLat: null | number, minLon: null | number) {

    this.bounded = null != maxLat && null != maxLon && null != minLat && null != minLon;

    if (this.bounded) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      this.maxLat = maxLat!.valueOf();
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      this.maxLon = maxLon!.valueOf();
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      this.minLat = minLat!.valueOf();
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      this.minLon = minLon!.valueOf();
    }
  }

  /**
   * The function "isDifferent" compares two BoundingBox objects and returns true if they are
   * different, and false if they are the same.
   * @param {BoundingBox} bbox1 - The parameter `bbox1` is of type `BoundingBox`.
   * @param {BoundingBox} bbox2 - The `bbox2` parameter is of type `BoundingBox`.
   * @returns a boolean value.
   */
  public static isDifferent(bbox1: BoundingBox, bbox2: BoundingBox): boolean {
    const bbox1Array = bbox1 == null ? [] : bbox1.asArray();
    const bbox2Array = bbox2 == null ? [] : bbox2.asArray();

    return JSON.stringify(bbox1Array) !== JSON.stringify(bbox2Array);
  }

  /**
   * The function "makeFromArray" takes an array of unknown values and returns a new BoundingBox object
   * with the values converted to numbers.
   * @param boundsArray - An array containing the values for the bounding box coordinates. The array
   * should have four elements, where each element represents a coordinate value for the bounding box.
   * @returns a new instance of the BoundingBox class.
   */
  static makeFromArray(boundsArray: Array<unknown>): BoundingBox {
    return new BoundingBox(
      Number(boundsArray[0]).valueOf(),
      Number(boundsArray[1]).valueOf(),
      Number(boundsArray[2]).valueOf(),
      Number(boundsArray[3]).valueOf(),
    );
  }

  /**
   * The function "makeUnbounded" returns a new instance of the BoundingBox class with null values for
   * its coordinates.
   * @returns An instance of the BoundingBox class with null values for its properties.
   */
  static makeUnbounded(): BoundingBox {
    return new BoundingBox(null, null, null, null);
  }

  getId(): string {
    return this.id;
  }

  /**
   * The getMaxLat function returns the maximum latitude value.
   * @returns The getMaxLat() function is returning the value of the maxLat variable, which is a
   * number.
   */
  getMaxLat(): number {
    return this.maxLat;
  }

  /**
   * The getMaxLon function returns the maximum longitude value.
   * @returns The getMaxLon() function is returning the value of the maxLon property, which is a
   * number.
   */
  getMaxLon(): number {
    return this.maxLon;
  }

  /**
   * The function returns the minimum latitude value.
   * @returns the value of the variable `minLat`, which is of type `number`.
   */
  getMinLat(): number {
    return this.minLat;
  }

  /**
   * The function returns the minimum longitude value.
   * @returns the value of the variable `minLon`, which is of type `number`.
   */
  getMinLon(): number {
    return this.minLon;
  }

  /**
   * The function "isBounded" returns a boolean value indicating whether the object is bounded.
   * @returns The method isBounded() returns a boolean value, which indicates whether the object is
   * bounded or not.
   */
  isBounded(): boolean {
    return this.bounded;
  }

  /**
   * The function "asArray" returns an array of four numbers representing the maximum and minimum
   * latitude and longitude values.
   * @returns An array of numbers is being returned.
   */
  asArray(): [number, number, number, number] {
    return [this.getMaxLat(), this.getMaxLon(), this.getMinLat(), this.getMinLon()];
  }

  /**
   * The function `asArrayFormat` in TypeScript returns geographic coordinates in a specified format.
   * @param [format=nesw] - The `format` parameter in the `asArrayFormat` method specifies the desired
   * format for the output array. In the provided code snippet, the method checks the `format`
   * parameter and rearranges the elements of the array accordingly based on the specified format.
   * @returns The function `asArrayFormat` is returning an array of numbers in the format specified by
   * the `format` parameter. If the `format` is 'nswe', the function returns an array with the maximum
   * latitude, minimum longitude, minimum latitude, and maximum longitude. If the `format` is any other
   * value, the function returns the original array obtained from `this.asArray()`.
   */
  asArrayFormat(format = 'nesw'): [number, number, number, number] {
    let result: [number, number, number, number] = this.asArray();
    switch (format) {
      case 'nswe':
        result = [
          this.getMaxLat(),
          this.getMinLat(),
          this.getMinLon(),
          this.getMaxLon(),
        ];
        break;

      default:
        break;
    }
    return result;
  }

  setId(id: string): BoundingBox {
    this.id = id;
    return this;
  }
}
