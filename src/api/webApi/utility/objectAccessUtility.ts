export class ObjectAccessUtility {
  public static getObjectValue<T = unknown>(object: Record<string, unknown>, key: string, warn = false): null | T {
    if (object[key] == null) {
      if (warn) { // Will not throw any warnings when type is 'value'.
        console.warn(`Object has no attribute '${key}'`);
        console.warn(object);
      }
      return null;
    } else {
      return object[key] as T;
    }
  }

  public static getObjectValueString(object: Record<string, unknown>, key: string, warn = false, defaulty?: null | string): string {
    const value = this.getObjectValue(object, key, warn);
    return (value != null && typeof value === 'string') ? value : ((defaulty == null) ? '' : defaulty);
  }

  public static getObjectValueNumber(object: Record<string, unknown>, key: string, warn = false): number {
    const value = this.getObjectValue(object, key, warn);

    // eslint-disable-next-line @typescript-eslint/ban-types
    const num: Number = (value != null && typeof value === 'number') ? Number(value) : Number.NaN;
    return num.valueOf();
  }

  public static getObjectValueBoolean(object: Record<string, unknown>, key: string, warn = false, defaulty = false): boolean {
    const value = this.getObjectValue(object, key, warn);

    // eslint-disable-next-line @typescript-eslint/ban-types
    const bool: Boolean = (value != null && typeof value === 'boolean') ? Boolean(value) : defaulty;
    return bool.valueOf();
  }

  public static getObjectArray<T = unknown>(object: Record<string, unknown>, key: string, warn = false): Array<T> {
    const value = this.getObjectValue(object, key, warn);

    const array = (value != null && Array.isArray(value)) ? value : [];
    return array as Array<T>;
  }

  public static hasKey(object: Record<string, unknown>, key: string): boolean {
    return (object[key] != null);
  }

}
