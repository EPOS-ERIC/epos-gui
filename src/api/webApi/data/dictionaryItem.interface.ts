import { Dictionary } from 'api/webApi/data/dictionary.interface';
import { Identifiable } from 'api/webApi/data/identifiable.interface';


/**
 * DictionaryItem
 */
export interface DictionaryItem extends Identifiable {
  sub(): Dictionary;
  hasSubItems(): boolean;
}
