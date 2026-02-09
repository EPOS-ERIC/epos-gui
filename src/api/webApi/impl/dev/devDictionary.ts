import { DictionaryType } from 'api/webApi/classes/dictionaryType.enum';
import { DictionaryApi } from 'api/webApi/classes/dictionaryApi.interface';
import { Rest } from 'api/webApi/classes/rest.interface';
import { BaseUrl } from 'api/webApi/classes/baseurl.interface';
import { Dictionary } from 'api/webApi/data/dictionary.interface';

/**
 * **NOT CURRENTLY IN USE**
 * Responsible for triggering calls to the webApi module "dictionary" endpoint.
 * - Accepts criteria from caller
 * - Triggers the webApi call via the {@link Rest} class
 * - Processes response data into internal objects
 * - Returns the appropriate response to the caller
 */
export class DevDictionaryApi implements DictionaryApi {

  constructor(private readonly baseUrl: BaseUrl, private readonly rest: Rest) { }

  public getDictionary(type: DictionaryType): Promise<Dictionary> {
    throw new Error('API 1.3 - Method not implemented.');
  }

}
