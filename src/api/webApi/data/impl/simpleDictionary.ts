import { Confirm } from 'api/webApi/utility/preconditions';
import { Dictionary } from 'api/webApi/data/dictionary.interface';
import { DictionaryItem } from 'api/webApi/data/dictionaryItem.interface';


/**
 *
 */
export class SimpleDictionary implements Dictionary {

  private constructor(private readonly dictionaryItems: Map<string, DictionaryItem>) {
    this.dictionaryItems = Confirm.requiresValid(dictionaryItems);
  }

  public static makeEmptyDictionary(): Dictionary {
    const map: Map<string, DictionaryItem> = new Map<string, DictionaryItem>();
    return new SimpleDictionary(map);
  }

  public static makeDictionary(dictionaryItems: DictionaryItem[]): Dictionary {
    const map: Map<string, DictionaryItem> = new Map<string, DictionaryItem>();
    for (const item of dictionaryItems) {
      map.set(item.getIdentifier(), item);
    }
    return new SimpleDictionary(map);
  }

  public static makeDictionaryFromStrings(items: string[]): Dictionary {
    const map: Map<string, DictionaryItem> = new Map<string, DictionaryItem>();
    if (items) {
      for (const item of items) {
        map.set(item, SimpleDictionaryItem.makeItem(item, item));
      }
    }
    return new SimpleDictionary(map);
  }

  public static makeDictionaryFromStringsWithPrefix(prefix: string, items: string[]): Dictionary {
    const map: Map<string, DictionaryItem> = new Map<string, DictionaryItem>();
    if (items) {
      for (const item of items) {
        const key = prefix + item;
        map.set(key, SimpleDictionaryItem.makeItem(key, item));
      }
    }
    return new SimpleDictionary(map);
  }

  values(): DictionaryItem[] {
    return Array.from(this.dictionaryItems.values());
  }

  keys(): string[] {
    return Array.from(this.dictionaryItems.keys());
  }

  get(key: string): DictionaryItem {
    return this.dictionaryItems.get(key);
  }

  empty(): boolean {
    return this.dictionaryItems.size === 0;
  }


}


/**
 * SimpleDictionaryItem
 */
export class SimpleDictionaryItem implements DictionaryItem {

  private constructor(private readonly identifier: string, private readonly value: string, private readonly subDictionary: Dictionary) {
    this.identifier = identifier;
    this.value = value;
    this.subDictionary = subDictionary;
  }

  public static makeItemWithSub(identifier: string, value: string, sub: Dictionary): DictionaryItem {
    Confirm.requiresValidString(identifier);
    Confirm.requiresValidString(value);
    Confirm.requiresValid(sub);
    return new SimpleDictionaryItem(identifier, value, sub);
  }

  public static makeItem(identifier: string, value: string): DictionaryItem {
    Confirm.requiresValidString(identifier);
    Confirm.requiresValidString(value);
    return new SimpleDictionaryItem(identifier, value, SimpleDictionary.makeEmptyDictionary());
  }

  getName(): string {
    return this.value;
  }
  getIdentifier(): string {
    return this.identifier;
  }

  sub(): Dictionary {
    return this.subDictionary;
  }

  hasSubItems(): boolean {
    return !this.subDictionary.empty();
  }

}
