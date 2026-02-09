import { EnvironmentType } from 'api/webApi/data/environments/environmentType.interface';

export interface EnvironmentTypeApi {

  /**
   * [GET]
   * Gets all environments for specified user.
   * [{"_id":{"$oid":"5a4dfbb6e4b002ed7db6579f"},"userid":"user","name":"foo","description":"bar","items":[]}]
   */
  getEnvironmentTypes(): Promise<Array<EnvironmentType>>;

}
