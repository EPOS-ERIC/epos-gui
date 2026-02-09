import { EventEmitter, Injectable } from '@angular/core';
import { ApiService } from 'api/api.service';
import { Model } from './model/model.service';
import { UserNotificationService } from 'components/userNotifications/userNotifications.service';
import { LoggingService } from './logging.service';
import { EnvironmentType } from 'api/webApi/data/environments/environmentType.interface';
import { Environment } from 'api/webApi/data/environments/environment.interface';
import { EnvironmentResource } from 'api/webApi/data/environments/environmentResource.interface';

/**
 * A service that exposes methods for accessing the webAPI environment functionality
 * to the rest of the GUI.
 * It also interacts with the {@link Model} ensure data consistency.
 */
@Injectable()
export class EnvironmentService {

  public refreshEnvs = new EventEmitter();

  constructor(
    private readonly _apiService: ApiService,
    private readonly model: Model,
    private readonly userNotificationService: UserNotificationService,
    private readonly loggingService: LoggingService,
  ) { }

  private _createEnvironment(name: string, description: string, serviceid: string): Promise<null | Environment> {
    return this._apiService.createEnvironment(name, description, serviceid);
  }
  /**
   * Creates a new environment. After successful creation, calls {@link #environmentsModelRefresh}
   * to refresh the list of available environments.
   * @param name Name of the environment.
   * @param description Description of the environment.
   */
  public createEnvironment(name: string, description: string, serviceid: string): Promise<Environment | null> {
    return this._createEnvironment(name, description, serviceid);
  }

  /**
   * Deletes a environment.
   * @param environment Environment to be deleted.
   */
  private _removeEnvironment(environment: Environment): Promise<boolean> {
    return this._apiService.removeEnvironment(environment);
  }
  /**
   * Uses {@link #_removeEnvironment} to delete a environment. After successful deletion,
   * calls {@link #environmentsModelRefresh} to refresh the list of available environments.
   * @param environment Environment to be deleted.
   */
  public removeEnvironment(environment: Environment): Promise<boolean> {
    return this._removeEnvironment(environment);
  }

  /**
   * The function `runjobEnvironment` takes an `environment` parameter and returns a promise that
   * resolves to a boolean indicating whether the job environment was successfully run.
   * @param {Environment} environment - The `environment` parameter is an object that represents the
   * environment in which a job will be run. It likely contains information such as the operating system,
   * software dependencies, and configuration settings required for the job to execute successfully.
   * @returns A Promise<boolean> is being returned.
   */
  public runjobEnvironment(environment: Environment): Promise<boolean> {
    return this._apiService.runJobEnvironment(environment);
  }

  /**
   * Updates a environment's name and description.
   * @param environment Environment to be updated.
   * @param newName New name of the environment.
   * @param newDescription New Description of the environment.
   */
  private _updateEnvironment(
    environment: Environment,
    newName: string,
    newDescription: string,
  ): Promise<null | Environment> {
    return this._apiService.updateEnvironment(environment, newName, newDescription);
  }
  /**
   * Uses {@link #_updateEnvironment} to update a environment's name and description. After
   * successfully updating, calls {@link #environmentsModelRefresh} to refresh the list
   * of available environments.
   * @param environment Environment to be updated.
   * @param newName New name of the environment.
   * @param newDescription New Description of the environment.
   */
  public updateEnvironment(environment: Environment, newName: string, newDescription: string): Promise<Environment | null> {
    return this._updateEnvironment(environment, newName, newDescription);
  }

  /**
 * Updates a environment's name and description.
 * @param environment Environment to be updated.
 * @param newName New name of the environment.
 * @param newDescription New Description of the environment.
 */
  private _updateResourcesToEnvironment(
    environment: Environment,
    resources: Array<EnvironmentResource>
  ): Promise<null | Environment> {
    return this._apiService.updateResourcesToEnvironment(environment, resources);
  }
  /**
   * Uses {@link #_updateResourcesToEnvironment} to add resources to environment. After
   * successfully updating, calls {@link #environmentsModelRefresh} to refresh the list
   * of available environments.
   * @param environment Environment to be updated.
   * @param resources Lists of resources.
   */
  public updateResourcesToEnvironment(environment: Environment, resources: Array<EnvironmentResource>): Promise<Environment | null> {
    return this._updateResourcesToEnvironment(environment, resources);
  }

  /**
   * Uses the {@link ApiService} to retrieve all environments (for a user).
   * Also logs the call using the {@link LoggingService}.
   */
  public getAllEnvironments(): Promise<null | Array<Environment>> {
    return Promise.resolve<null | Array<Environment>>(
      this.loggingService.logForPromise<Array<Environment>>(
        this._apiService.getEnvironments(),
        this.getMessage('Fetch all environments'),
      ).catch(() => null)
    );
  }

  /**
   * The function `getEnvironment` returns a promise that resolves to either an `Environment` object or
   * `null`, by calling an API service to fetch the environment data and logging the process.
   * @param {Environment} environment - The `environment` parameter is of type `Environment`.
   * @returns a Promise that resolves to either null or an instance of the Environment class.
   */
  public getEnvironment(environment: Environment): Promise<null | Environment> {
    return Promise.resolve<null | Environment>(
      this.loggingService.logForPromise<Environment | null>(
        this._apiService.getEnvironment(environment),
        this.getMessage('Fetch environment ' + environment.id),
      ).catch(() => null)
    );
  }

  /**
 * Uses the {@link ApiService} to retrieve all environments (for a user).
 * Also logs the call using the {@link LoggingService}.
 */
  public getAllEnvironmentTypes(): Promise<null | Array<EnvironmentType>> {
    return Promise.resolve<null | Array<EnvironmentType>>(
      this.loggingService.logForPromise<Array<EnvironmentType>>(
        this._apiService.getEnvironmentTypes(),
        this.getMessage('Fetch all environment type'),
      ).catch(() => null)
    );
  }

  /**
   * Adds a standard prefix to the message before returning it.
   * @param message Message.
   */
  private getMessage(
    message: string,
  ): string {
    return `Environment API Call - ${message}`;
  }

}
