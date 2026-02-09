export class ObjectHelper {
  static isValidString(value: unknown, strict = false): boolean {
    if (typeof value === 'string' && value != null && (!strict || value.trim().length > 0)) {
      return true;
    }
    return false;
  }
  static isValidNumber(value: unknown): boolean {
    if (typeof value === 'number' && value != null && !isNaN(value) && isFinite(value)) {
      return true;
    }
    return false;
  }
  static isValidBoolean(value: unknown): boolean {
    if (typeof value === 'boolean' && value != null) {
      return true;
    }
    return false;
  }
  static isValidArray(value: unknown, strict = false): boolean {
    if (value != null && Array.isArray(value) && (!strict || value.length > 0)) {
      return true;
    }
    return false;
  }
  static getObjectValue<T = unknown>(object: Record<string, unknown>, key: string, warn = false): null | T {
    if (object[key] == null) {
      if (warn) {
        console.warn(`Object has no attribute '${key}'`);
      }
      return null;
    } else {
      return object[key] as T;
    }
  }
  static getObjectArray<T = unknown>(object: Record<string, unknown>, key: string, warn = false): Array<T> {
    const value = this.getObjectValue(object, key, warn);
    const array = ((value != null) && Array.isArray(value)) ? value : [];
    return array as Array<T>;
  }
  static toPrimitiveArray(object: unknown): Array<number | boolean | string> {
    const primitives: Array<number | boolean | string> = [];
    if (ObjectHelper.isValidArray(object)) {
      const array = object as Array<unknown>;
      array.forEach(element => {
        if (ObjectHelper.isValidBoolean(element) || ObjectHelper.isValidNumber(element) || ObjectHelper.isValidString(element)) {
          primitives.push(element as number | boolean | string);
        }
      });
    } else if (ObjectHelper.isValidBoolean(object) || ObjectHelper.isValidNumber(object) || ObjectHelper.isValidString(object)) {
      primitives.push(object as number | boolean | string);
    }
    return primitives;
  }

  static toNumberArray(object: unknown): Array<number> {
    const numbers: Array<number> = [];
    if (ObjectHelper.isValidArray(object)) {
      const array = object as Array<unknown>;
      array.forEach(element => {
        if (ObjectHelper.isValidNumber(element)) {
          numbers.push(Number(element));
        }
      });
    } else if (ObjectHelper.isValidNumber(object)) {
      numbers.push(Number(object));
    }
    return numbers;
  }

  /**
   * It returns a boolean value if the string is 'true' or 'false', otherwise it returns null
   * @param {string} value - The value to be converted to a boolean.
   * @returns A boolean value of true or false.
   */
  static booleanify(value: string): boolean | null {
    const valueLower = value.toLowerCase();

    return valueLower === 'true' ? true : (valueLower === 'false' ? false : null);

  }
}
