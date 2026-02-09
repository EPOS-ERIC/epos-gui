import { Environment } from 'api/webApi/data/environments/environment.interface';
import { EnvironmentResource } from 'api/webApi/data/environments/environmentResource.interface';

export interface EnvironmentApi {

  /**
   * [GET]
   * Gets all environments for specified user.
   */
  getEnvironments(): Promise<Array<Environment>>;

  /**
   * [GET]
   * Gets environment by id.
   */
  getEnvironment(environment: Environment): Promise<Environment | null>;

  /**
   * [PUT]
   * updates the name and description
   */
  updateEnvironment(environment: Environment, newName: string, newDescription: string): Promise<null | Environment>;

  /**
   * [POST]
   * create environment
   */
  createEnvironment(name: string, description: string, serviceid: string): Promise<null | Environment>;
  /**
   * [DELETE]
   * remove environment
   * {"Result":"Environment 5a4dfbb6e4b002ed7db6579f Removed Successfully"}
   */
  removeEnvironment(environment: Environment): Promise<boolean>;

  /**
   * [POST]
   * run environment job
   */
  runJobEnvironment(environment: Environment): Promise<boolean>;

  /**
   * [PUT]
   * updates the environment with new resource
   * @param environment
   * @param urlResource
   */
  updateResourcesToEnvironment(environment: Environment, resources: Array<EnvironmentResource>): Promise<Environment | null>;

}
