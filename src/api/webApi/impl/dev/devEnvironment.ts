import { Confirm } from '../../utility/preconditions';
import { SimpleRequestBodyBuilder } from 'api/webApi/utility/requestBodyBuilder';
import { EnvironmentApi } from 'api/webApi/classes/environments/environmentApi.interface';
import { BaseUrl } from 'api/webApi/classes/baseurl.interface';
import { Rest } from 'api/webApi/classes/rest.interface';
import { UrlBuilder } from 'api/webApi/classes/urlBuilder.interface';
import { RequestBodyBuilder } from 'api/webApi/classes/requestBodyBuilder.interface';
import { JSONEnvironmentFactory } from 'api/webApi/data/environments/impl/jsonEnvironmentFactory';
import { Environment } from 'api/webApi/data/environments/environment.interface';
import { EnvironmentResource } from 'api/webApi/data/environments/environmentResource.interface';

/**
 * Responsible for triggering calls to the webApi module "environment" endpoints.
 * - Accepts criteria from caller
 * - Triggers the webApi call via the {@link Rest} class
 * - Processes response data into internal objects
 * - Returns the appropriate response to the caller
 */
export class DevEnvironmentApi implements EnvironmentApi {
  // path
  public static readonly PROCESSING = 'processing';
  private static readonly ENVIRONMENT = 'environment';
  private static readonly RUN = 'runjob';

  // params
  private static readonly NAME = 'name';
  private static readonly DESCRIPTION = 'description';
  private static readonly SERVICE_ID = 'serviceid';
  private static readonly ENVIRONMENT_ID = 'environmentid';
  private static readonly RESOURCES = 'resources';

  constructor(
    private readonly baseUrl: BaseUrl,
    private readonly rest: Rest,
  ) { }


  /**
   * The function `getEnvironments` retrieves a list of environments from a REST API and converts the
   * JSON response into an array of `Environment` objects.
   * @returns a Promise that resolves to an array of Environment objects.
   */
  public getEnvironments(): Promise<Array<Environment>> {

    const urlBulder: UrlBuilder = this.environmentUrlBuilder(['all']);

    return this.rest
      .get(urlBulder.build()).then(json => {
        return JSONEnvironmentFactory.jsonToEnvironmentArray(json);
      });
  }


  /**
   * The function `getEnvironment` retrieves an environment object from a server based on the provided
   * environment ID.
   * @param {Environment} environment - The parameter "environment" is of type "Environment". It
   * represents the environment for which we want to retrieve information.
   * @returns a Promise that resolves to either an Environment object or null.
   */
  public getEnvironment(environment: Environment): Promise<Environment | null> {

    const urlBulder: UrlBuilder = this.environmentUrlBuilder([environment.id]);

    return this.rest
      .get(urlBulder.build()).then(json => {
        const envArray = JSONEnvironmentFactory.jsonToEnvironmentArray(json);
        if (envArray.length === 1) {
          return envArray[0];
        }
        return null;
      });
  }

  /**
   * Update a environment.
   * @param environment
   * @param newDescription
   */
  public updateEnvironment(environment: Environment, newName: string, newDescription: string): Promise<null | Environment> {
    Confirm.requiresValidString(newName);
    Confirm.requiresValidString(newDescription);

    const urlBulder: UrlBuilder = this.environmentUrlBuilder();

    const bodyBuilder = this.requestBodyBuilder()
      .addParameter(DevEnvironmentApi.NAME, newName)
      .addParameter(DevEnvironmentApi.DESCRIPTION, newDescription)
      .addParameter(DevEnvironmentApi.ENVIRONMENT_ID, environment.getIdentifier());

    return this.rest
      // eslint-disable-next-line @typescript-eslint/naming-convention
      .put(urlBulder.build(), bodyBuilder.build(), false, { 'Content-Type': 'application/json' }).then((json: Record<string, unknown>) => {
        return JSONEnvironmentFactory.jsonToEnvironment(json).orNull();
      });
  }
  /**
   * @param name
   * @param type
   */
  public createEnvironment(name: string, description: string, serviceid: string): Promise<null | Environment> {
    Confirm.requiresValidString(name);
    Confirm.requiresValidString(description);
    Confirm.requiresValidString(serviceid);

    // TODO param on a POST should go in the request body not the URL.
    const urlBulder: UrlBuilder = this.environmentUrlBuilder();

    const bodyBuilder = this.requestBodyBuilder()
      .addParameter(DevEnvironmentApi.NAME, name)
      .addParameter(DevEnvironmentApi.DESCRIPTION, description)
      .addParameter(DevEnvironmentApi.SERVICE_ID, serviceid);

    return this.rest
      // eslint-disable-next-line @typescript-eslint/naming-convention
      .post(urlBulder.build(), bodyBuilder.build(), false, { 'Content-Type': 'application/json' }).then((json: Record<string, unknown>) => {
        return JSONEnvironmentFactory.jsonToEnvironment(json).orNull();
      });

  }
  /**
   * Remove one of a users environments
   * @param environment
   */
  public removeEnvironment(environment: Environment): Promise<boolean> {
    const urlBulder: UrlBuilder = this.environmentUrlBuilder([environment.getIdentifier()]);

    return this.rest
      .delete(urlBulder.build()).then(json => {
        return Boolean(json).valueOf();
      });
  }

  /**
   * Run job environment
   * @param environment
   */
  public runJobEnvironment(environment: Environment): Promise<boolean> {
    const urlBulder: UrlBuilder = this.environmentRonJobUrlBuilder([environment.getIdentifier()]);

    return this.rest
      .post(urlBulder.build(), []).then(json => {
        return Boolean(json).valueOf();
      });
  }

  /**
   * Add resources to environment.
   * @param environment
   * @param resources
   */
  public updateResourcesToEnvironment(environment: Environment, resources: Array<EnvironmentResource>): Promise<null | Environment> {

    const urlBulder: UrlBuilder = this.environmentUrlBuilder();

    const bodyBuilder = this.requestBodyBuilder()
      .addParameter(DevEnvironmentApi.ENVIRONMENT_ID, environment.getIdentifier())
      .addParameter(DevEnvironmentApi.RESOURCES, resources);

    // return new Promise((resolve) => { resolve(null); });
    return this.rest
      // eslint-disable-next-line @typescript-eslint/naming-convention
      .put(urlBulder.build(), bodyBuilder.build(), false, { 'Content-Type': 'application/json' }).then((json: Record<string, unknown>) => {
        return JSONEnvironmentFactory.jsonToEnvironment(json).orNull();
      });
  }

  private environmentUrlBuilder(extraPath: Array<string> = []): UrlBuilder {
    const elements = [
      DevEnvironmentApi.PROCESSING,
      DevEnvironmentApi.ENVIRONMENT
    ];

    const urlBulder: UrlBuilder = this.baseUrl.urlBuilder()
      .addPathElements(...[...elements, ...extraPath]);

    return urlBulder;
  }

  private environmentRonJobUrlBuilder(extraPath: Array<string> = []): UrlBuilder {
    const elements = [
      DevEnvironmentApi.PROCESSING,
      DevEnvironmentApi.RUN
    ];

    const urlBulder: UrlBuilder = this.baseUrl.urlBuilder()
      .addPathElements(...[...elements, ...extraPath]);

    return urlBulder;
  }

  private requestBodyBuilder(): RequestBodyBuilder {
    return SimpleRequestBodyBuilder.makeRequestBodyBuilder();
  }

}
