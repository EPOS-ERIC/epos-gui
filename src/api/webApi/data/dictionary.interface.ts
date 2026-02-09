import { DictionaryItem } from 'api/webApi/data/dictionaryItem.interface';

/**
 * Dictionary
 */
export interface Dictionary {
  values(): Array<DictionaryItem>;
  keys(): Array<string>;
  get(key: string): DictionaryItem;
  empty(): boolean;
}

