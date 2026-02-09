import { BaseUrl } from 'api/webApi/classes/baseurl.interface';
import { Rest } from 'api/webApi/classes/rest.interface';
import { ShareApi } from 'api/webApi/classes/shareApi.interface';
import { UrlBuilder } from 'api/webApi/classes/urlBuilder.interface';
import { ObjectAccessUtility } from 'api/webApi/utility/objectAccessUtility';
import { HttpResponse } from '@angular/common/http';

/**
 * Responsible for triggering calls to the webApi module "execute" endpoint.
 * - Accepts criteria from caller
 * - Triggers the webApi call via the {@link Rest} class
 * - Processes response data into internal objects
 * - Returns the appropriate response to the caller
 */
export class DevShareApi implements ShareApi {

  constructor(private readonly baseUrl: BaseUrl, private readonly rest: Rest) { }

  /**
   * The `saveConfigurables` function in TypeScript saves a configurable value using a POST request and
   * returns a Promise with the result.
   * @param {string} value - The `saveConfigurables` function takes a `value` parameter of type string.
   * This value represents the configuration that needs to be saved. The function then constructs a URL
   * using a `baseUrl` and sends a POST request with the configuration data to the specified URL. After
   * receiving a response, it
   * @returns The function `saveConfigurables` is returning a Promise that resolves to a string. Inside
   * the Promise, it is making a POST request to a specified URL with a body containing a configuration
   * value. After the POST request is completed, it is extracting the value associated with the key
   * 'key' from the response body using `ObjectAccessUtility.getObjectValue` function. If the value is
   * found, it
   */
  public saveConfigurables(value: string): Promise<string> {

    const builder: UrlBuilder = this.baseUrl.urlBuilder();
    builder.addPathElements('share');

    // the search URL
    const url = builder.build();
    const body = {
      configuration: value
    };

    return this.rest.post(url, body, true).then((json: HttpResponse<unknown>) => {

      return ObjectAccessUtility.getObjectValue(json.body as Record<string, unknown>, 'key', true) ?? '';

    });
  }

  /**
   * The function `retrieveConfigurables` retrieves a configurable value from a specified key in a JSON
   * response.
   * @param {string} key - The `key` parameter in the `retrieveConfigurables` function is a string that
   * is used to retrieve configurable settings from a specific endpoint.
   * @returns The retrieveConfigurables function returns a Promise that resolves to a string value. The
   * string value is obtained by accessing the 'configuration' property from the JSON response object
   * using ObjectAccessUtility.getObjectValueString method.
   */
  public retrieveConfigurables(key: string): Promise<string> {

    const builder: UrlBuilder = this.baseUrl.urlBuilder();
    builder.addPathElements('share');
    builder.addPathElements(key);
    const url = builder.build();
    return this.rest.get(url).then((json: Record<string, unknown>) => {

      return ObjectAccessUtility.getObjectValueString(json, 'configuration', true, '');

    });
  }
}
