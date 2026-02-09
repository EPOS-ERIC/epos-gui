import { LocalStorageVariables } from './localStorageVariables.enum';
import { Persister } from './persister';

/**
 * A {@link Persister} that persists {@link ModelItem}s in local storage.
 */
export class LocalStoragePersister implements Persister {
  /** Prefix for all stored items */
  private readonly STORAGE_PREFIX = LocalStorageVariables.STORAGE_PREFIX;

  /**
   * The `set` function is used to store data in the local storage, with support for nested keys and
   * circular references.
   * @param {string} key - A string representing the key under which the value will be stored in the
   * local storage.
   * @param {unknown} value - The `value` parameter is the value that you want to store in the local
   * storage. It can be of any type (`string`, `number`, `boolean`, `object`, etc.) or `null`.
   * @param [circular=false] - The `circular` parameter is a boolean flag that determines whether
   * circular references should be handled when storing the value in local storage. If `circular` is
   * set to `true`, a special replacer function is used to handle circular references in the value
   * before storing it. If `circular`
   * @param {boolean | string} [subKey=false] - The `subKey` parameter is an optional parameter that
   * can be either a boolean or a string. It is used to specify a subkey within the main key for
   * storing data in local storage. If a subKey is provided, the function will retrieve the existing
   * data for the main key and update or
   */
  public set(key: string, value: unknown, circular = false, subKey: boolean | string = false): void {
    const storageKey = this.STORAGE_PREFIX + key;

    if (subKey !== false) {

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      let data = this.getArrayLocalStorageItem(key);

      if (value == null) {
        // remove subKey from data
        data = data.filter(v => { return v.type !== subKey; });
      } else {

        let found = false;
        data.forEach((i, index) => {
          if (i.type === subKey) {
            found = true;
            data[index] = { type: subKey as string, value: value as string };
          }
        });

        if (data.length === 0 || found === false) {
          // new subkey
          data.push({ type: subKey as string, value: value as string });
        }

      }

      localStorage.setItem(storageKey, JSON.stringify(data));

    } else {
      if (value == null) {
        localStorage.removeItem(storageKey);
      } else if (circular) {
        const getCircularReplacer = () => {
          const seen = new WeakSet();
          // eslint-disable-next-line @typescript-eslint/no-shadow
          return (_key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value as object)) {
                return;
              }
              seen.add(value as object);
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return value;
          };
        };
        const stringified = JSON.stringify(value, getCircularReplacer());
        localStorage.setItem(storageKey, stringified);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(value));
      }
    }
  }

  /**
   * The function `get` retrieves a value from a key-value store and returns it as a Promise.
   * @param {string} key - A string representing the main key to retrieve a value from.
   * @param {boolean | string} [subKey=false] - The `subKey` parameter is an optional parameter that
   * can be either a boolean or a string. It is set to `false` by default.
   * @returns a Promise that resolves to an unknown value.
   */
  public get(key: string, subKey: boolean | string = false): Promise<unknown> {
    const returnValue = this.getValue(key, subKey);
    return Promise.resolve(returnValue);
  }

  /**
   * The function `getValue` retrieves a value from localStorage based on a given key and optional
   * subKey.
   * @param {string} key - The `key` parameter is a string that represents the main key used to retrieve
   * a value from local storage.
   * @param {boolean | string} [subKey=false] - The `subKey` parameter in the `getValue` function can be
   * either a boolean value or a string. It has a default value of `false`.
   * @returns a value of type string or null.
   */
  public getValue(key: string, subKey: boolean | string = false): null | string | number | boolean | Array<string | number> {
    const storageKey = this.STORAGE_PREFIX + key;
    const persistedValue = localStorage.getItem(storageKey);
    let persistedValueParsed: string | Array<LocalStorageItem> | null | LocalStorageItem = null;

    try {
      persistedValueParsed = (null == persistedValue) ? null : JSON.parse(persistedValue) as string | Array<LocalStorageItem> | null | LocalStorageItem;
    } catch (e) {
    }

    let returnValue: null | string | number | Array<string | number> = null;
    if (subKey !== false) {
      if (Array.isArray(persistedValueParsed) && persistedValueParsed !== null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        const localStorageItem = (persistedValueParsed as Array<LocalStorageItem>).find(item => item.type === subKey);
        if (localStorageItem !== undefined) {
          returnValue = (localStorageItem as LocalStorageItem).value as string;
        }
      }
    } else {
      returnValue = (null == persistedValue) ? null : JSON.parse(persistedValue) as null | string | number | Array<string | number>;
    }
    return returnValue as null | string | number | Array<string | number>;
  }

  /**
   * The function `resetAllVariables` clears the localStorage and optionally reloads the page.
   * @param [reloads=false] - The `reloads` parameter in the `resetAllVariables` function is a boolean
   * parameter that determines whether the page should be reloaded after clearing the localStorage. If
   * `reloads` is set to `true`, the page will be reloaded using `location.reload()`. If `reloads`
   */
  public resetAllVariables(reloads = false): void {
    localStorage.clear();

    if (reloads) {
      // reloads the page
      location.reload();
    }
  }

  /**
   * The function retrieves an array of items from local storage using a specified key.
   * @param {string} key - The `key` parameter is a string that represents the key used to retrieve the
   * item from the local storage.
   * @returns an array of LocalStorageItem objects.
   */
  private getArrayLocalStorageItem(key: string): Array<LocalStorageItem> {
    const storageKey = this.STORAGE_PREFIX + key;
    const persistedValue = localStorage.getItem(storageKey);

    try {
      return (null === persistedValue || '""' === persistedValue) ? [] : JSON.parse(persistedValue) as Array<LocalStorageItem>;
    } catch (e) {
      return [];
    }
  }
}

/** The `interface LocalStorageItem` is defining the structure of an object that represents an item
stored in local storage. It has two properties: `type` and `value`, both of which are of type
`string`. This interface is used in the `LocalStoragePersister` class to define the type of the
items stored in local storage. */
export interface LocalStorageItem {
  /** The `type: string;` property in the `LocalStorageItem` interface is defining a property named
  `type` with a type of `string`. This property is used to store the type or identifier of the item
  being stored in local storage. It provides a way to differentiate between different types of items
  stored in local storage. */
  type: string;
  /** The `value: string;` property in the `LocalStorageItem` interface is defining a property named
  `value` with a type of `string`. This property is used to store the actual value of the item being
  stored in local storage. It represents the data that is associated with the `type` property and is
  specific to the item being stored. */
  value: string;
}
