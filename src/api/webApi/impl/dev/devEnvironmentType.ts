import { BaseUrl } from 'api/webApi/classes/baseurl.interface';
import { Rest } from 'api/webApi/classes/rest.interface';
import { UrlBuilder } from 'api/webApi/classes/urlBuilder.interface';
import { JSONEnvironmentFactory } from 'api/webApi/data/environments/impl/jsonEnvironmentFactory';
import { EnvironmentType } from 'api/webApi/data/environments/environmentType.interface';

/**
 * Responsible for triggering calls to the webApi module "environment" endpoints.
 * - Accepts criteria from caller
 * - Triggers the webApi call via the {@link Rest} class
 * - Processes response data into internal objects
 * - Returns the appropriate response to the caller
 */
export class DevEnvironmentTypeApi {
  // path
  public static readonly PROCESSING = 'processing';
  private static readonly SEARCH = 'search';

  constructor(
    private readonly baseUrl: BaseUrl,
    private readonly rest: Rest,
  ) { }

  /**
   * Get (all) environments for user.
   * @param user
   */
  public getEnvironmentTypes(): Promise<Array<EnvironmentType>> {

    const urlBulder: UrlBuilder = this.baseUrl.urlBuilder()
      .addPathElements(DevEnvironmentTypeApi.PROCESSING, DevEnvironmentTypeApi.SEARCH);

    return this.rest
      .get(urlBulder.build()).then(json => {
        return JSONEnvironmentFactory.jsonToEnvironmentTypeArray(json);
      });
    // }
  }

}
