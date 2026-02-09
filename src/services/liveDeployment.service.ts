import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';

/**
 * This service knows whether this is the live deployment
 * and may run scripts based on this info.
 */
@Injectable()
export class LiveDeploymentService {

  /**
   * The function returns a boolean value indicating whether the application is in a live deployment
   * environment.
   * @returns The method `getIsLiveDeployment()` is returning the value of `environment.production`,
   * which is a boolean value indicating whether the code is running in a production environment.
   */
  public getIsLiveDeployment(): boolean {
    return environment.production;
  }

}
