import { DictionaryType } from './dictionaryType.enum';
import { Dictionary } from 'api/webApi/data/dictionary.interface';


export interface DictionaryApi {

  getDictionary(type: DictionaryType): Promise<Dictionary>;
}
