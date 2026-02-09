import { ObjectAccessUtility } from 'api/webApi/utility/objectAccessUtility';
import { Optional } from 'api/webApi/utility/optional';
import { EnvironmentType } from '../environmentType.interface';
import { Environment } from '../environment.interface';
import { SimpleEnvironment } from './simpleEnvironment';
import { SimpleEnvironmentType } from './simpleEnvironmentType';
import { EnvironmentServiceType } from '../environmentServiceType.interface';
import { EnvironmentResource } from '../environmentResource.interface';
import { EnvironmentStatus } from '../environmentStatus.enum';


export class JSONEnvironmentFactory {

  private static readonly NAME = 'name';
  private static readonly DESCRIPTION = 'description';
  private static readonly ID = 'environmentid';
  private static readonly ACCESS_URL = 'accessurl';
  private static readonly SERVICE_ID = 'serviceid';
  private static readonly CREATED = 'created';
  private static readonly STATUS = 'status';
  private static readonly RESOURCES = 'resources';
  private static readonly TYPE = 'type';
  private static readonly PARAMETERS = 'parameters';
  private static readonly VALUE = 'value';
  private static readonly SERVICES = 'services';

  private constructor() { }

  /**
   * Convert json response to array of environments.
   * @param json
   */
  public static jsonToEnvironmentArray(json: unknown): Array<Environment> {
    const environments: Array<Environment> = [];

    // Assumption: it's an array
    if (Array.isArray(json)) {
      json.forEach(element => {
        const environment = JSONEnvironmentFactory.jsonToEnvironment(element as Record<string, unknown>);
        environment.ifPresent(ws => environments.push(ws!));
      });
    }
    return environments;
  }

  /**
   * Convert json response to array of environment types.
   * @param json
   */
  public static jsonToEnvironmentTypeArray(json: unknown): Array<EnvironmentType> {
    const environmentTypes: Array<EnvironmentType> = [];

    // Assumption: it's an array
    if (Array.isArray(json)) {
      json.forEach(element => {
        const environment = JSONEnvironmentFactory.jsonToEnvironmentType(element as Record<string, unknown>);
        environment.ifPresent(ws => environmentTypes.push(ws!));
      });
    }
    return environmentTypes;
  }

  /**
   * Convert json response to a environment summary.
   * @param json
   */
  public static jsonToEnvironmentType(json: Record<string, unknown>): Optional<null | EnvironmentType> {

    const environmentTypeType: string = ObjectAccessUtility.getObjectValueString(json, JSONEnvironmentFactory.TYPE, true, null);
    const environmentTypeServices: Array<EnvironmentServiceType> = ObjectAccessUtility.getObjectArray(
      json,
      JSONEnvironmentFactory.SERVICES,
      true,
    );

    const type = SimpleEnvironmentType.make(environmentTypeType, environmentTypeServices);

    return Optional.ofNullable(type);
  }

  /**
   * Convert json response to a environment summary.
   * @param json
   */
  public static jsonToEnvironment(json: Record<string, unknown>): Optional<null | Environment> {

    const environmentName: string = ObjectAccessUtility.getObjectValueString(json, JSONEnvironmentFactory.NAME, true, null);
    const environmentDescription: string = ObjectAccessUtility.getObjectValueString(json, JSONEnvironmentFactory.DESCRIPTION, true, null);
    const environmentId: string = ObjectAccessUtility.getObjectValueString(json, JSONEnvironmentFactory.ID, true, null);
    const environmentServiceId: string = ObjectAccessUtility.getObjectValueString(json, JSONEnvironmentFactory.SERVICE_ID, false);
    const environmentAccessUrl: string = ObjectAccessUtility.getObjectValueString(json, JSONEnvironmentFactory.ACCESS_URL, false, null);
    const environmentCreated: string = ObjectAccessUtility.getObjectValueString(json, JSONEnvironmentFactory.CREATED, false, null);
    const environmentStatus: EnvironmentStatus = ObjectAccessUtility.getObjectValueString(json, JSONEnvironmentFactory.STATUS, false, null) as EnvironmentStatus;
    const environmentResources: Array<EnvironmentResource> = ObjectAccessUtility.getObjectArray(json, JSONEnvironmentFactory.RESOURCES, false);

    const environment = SimpleEnvironment.make(environmentId, environmentName, environmentDescription, environmentServiceId, environmentAccessUrl, environmentResources, environmentCreated, environmentStatus);

    return Optional.ofNullable(environment);
  }

}
