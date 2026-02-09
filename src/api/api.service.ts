import { SearchCriteria } from './webApi/classes/searchCriteria.enum';
import { Api } from './webApi/classes/api.interface';
import { DictionaryType } from './webApi/classes/dictionaryType.enum';
import { Dictionary } from './webApi/data/dictionary.interface';
import { ItemSummary } from './webApi/data/itemSummary.interface';
import { DistributionSummary } from './webApi/data/distributionSummary.interface';
import { DistributionDetails } from './webApi/data/distributionDetails.interface';
import { ParameterValue } from './webApi/data/parameterValue.interface';
import { DiscoverResponse, DiscoverRequest } from './webApi/classes/discoverApi.interface';
import { DistributionFormat } from './webApi/data/distributionFormat.interface';
import { Environment } from './webApi/data/environments/environment.interface';
import { EnvironmentType } from './webApi/data/environments/environmentType.interface';
import { EnvironmentResource } from './webApi/data/environments/environmentResource.interface';
import { Organization } from './webApi/data/organization.interface';
import { Domain } from './webApi/data/domain.interface';

export class ApiService implements Api {

  private delegate: null | Api = null;
  private delegateName: null | string = null;

  private constructor(
    private readonly apiMap: Map<string, Api>,
    private readonly selectionEnabled: boolean,
    private readonly selectionVisible: boolean,
  ) {
  }

  public static make(api: Api, apiName: string, selectionEnabled = true, selectionVisible = true): ApiService {
    const map = new Map();
    map.set(apiName, api);
    const as = new ApiService(map as Map<string, Api>, selectionEnabled, selectionVisible);
    as.selectApi(apiName);
    return as;
  }

  public static makeSelectable(
    apis: Map<string, Api>,
    nameOfDefaultApi: string,
    selectionEnabled = true,
    selectionVisible = true,
  ): ApiService {

    // check map
    if (!apis) {
      console.log('Invalid API map');
      throw new Error('Invalid API map');
    }

    // check map has at least one
    if (apis.size === 0) {
      console.log('Zero APIs in map');
      throw new Error('Zero APIs in map');
    }

    // check map contains default
    const temp = apis.get(nameOfDefaultApi);
    if (!temp) {
      console.log('Default API not found: ' + nameOfDefaultApi);
      throw new Error('Default API not found: ' + nameOfDefaultApi);
    }

    const as = new ApiService(apis, selectionEnabled, selectionVisible);
    as.selectApi(nameOfDefaultApi);
    return as;
  }


  // -----------------

  public isSelectionEnabled(): boolean {
    return this.apiMap.size > 1 && this.selectionEnabled;
  }

  public isSelectionVisible(): boolean {
    return this.selectionVisible;
  }

  public selectApi(apiName: string): void {
    const temp = this.apiMap.get(apiName);
    if (!temp) {
      console.log('couldn\'t find an API called: ' + apiName + ' continue to use: ' + this.delegateName);
      return;
    }
    this.delegateName = apiName;
    this.delegate = temp;
  }

  public getSelectedApiName(): string {
    return this.delegateName ?? '';
  }

  public getApiNames(): Array<string> {
    return Array.from(this.apiMap.keys());
  }

  // -----------------

  public discover(request: DiscoverRequest): Promise<null | DiscoverResponse> {
    this.checkApiBeforeCall();
    return this.delegate!.discover(request);
  }

  // -----------------

  public getFilters(context: string): Promise<null | DiscoverResponse> {
    this.checkApiBeforeCall();
    return this.delegate!.getFilters(context);
  }

  public getDomains(context: string): Promise<null | Array<Domain>> {
    this.checkApiBeforeCall();
    return this.delegate!.getDomains(context);
  }

  public getDictionary(type: DictionaryType): Promise<Dictionary> {
    this.checkApiBeforeCall();
    return this.delegate!.getDictionary(type);
  }

  public doSearch(searchCriteriaMap: Map<SearchCriteria, unknown>): Promise<Array<ItemSummary>> {
    this.checkApiBeforeCall();
    return this.delegate!.doSearch(searchCriteriaMap);
  }

  /**
   * The function `getOrganizations` checks the API before making a call and returns a promise that
   * resolves to an array of `Organization` objects or `null`.
   * @returns a Promise that resolves to either an array of Organization objects or null.
   */
  public getOrganizations(type: string): Promise<Organization[] | null> {
    this.checkApiBeforeCall();
    return this.delegate!.getOrganizations(type);
  }

  public getOrganizationById(id: string): Promise<Organization | null> {
    this.checkApiBeforeCall();
    return this.delegate!.getOrganizationById(id);
  }

  public getDetails(summary: DistributionSummary, context: string): Promise<null | DistributionDetails> {
    this.checkApiBeforeCall();
    return this.delegate!.getDetails(summary, context);
  }
  public getDetailsById(id: string, context: string): Promise<null | DistributionDetails> {
    this.checkApiBeforeCall();
    return this.delegate!.getDetailsById(id, context);
  }

  // exectution
  public executeAuthenticatedUrl(
    url: string,
  ): Promise<Blob> {
    this.checkApiBeforeCall();
    return this.delegate!.executeAuthenticatedUrl(url);
  }

  public executeUrl(
    url: string,
  ): Promise<Blob> {
    this.checkApiBeforeCall();
    return this.delegate!.executeUrl(url);
  }

  public executeDistributionFormat(
    format: DistributionFormat,
    params: null | Array<ParameterValue>,
    asBlob: boolean,
  ): Promise<Record<string, unknown> | Blob> {
    this.checkApiBeforeCall();
    return this.delegate!.executeDistributionFormat(format, params, asBlob);
  }

  public getExecuteUrl(
    format: DistributionFormat,
    params: null | Array<ParameterValue>,
  ): string {
    this.checkApiBeforeCall();
    return this.delegate!.getExecuteUrl(format, params);
  }

  public getOriginatorUrl(distribution: DistributionSummary, params: null | Array<ParameterValue>): Promise<string> {
    this.checkApiBeforeCall();
    return this.delegate!.getOriginatorUrl(distribution, params);
  }

  /**
   * The function `saveConfigurables` saves a configurable value after checking the API before making
   * the call.
   * @param {string} value - The `value` parameter in the `saveConfigurables` function is a string that
   * represents the configuration data that needs to be saved.
   * @returns The `saveConfigurables` method is returning a Promise that resolves to a string value.
   */
  public saveConfigurables(value: string): Promise<string> {
    this.checkApiBeforeCall();
    return this.delegate!.saveConfigurables(value);
  }

  /**
   * The function retrieveConfigurables retrieves configurable settings based on a given key.
   * @param {string} key - The `key` parameter in the `retrieveConfigurables` function is a string that
   * represents the configuration key used to retrieve configurable settings or values.
   * @returns The `retrieveConfigurables` method returns a `Promise` that resolves to a `string` or
   * `null`.
   */
  public retrieveConfigurables(key: string): Promise<string | null> {
    this.checkApiBeforeCall();
    return this.delegate!.retrieveConfigurables(key);
  }

  // Environments
  /**
   * The function `getEnvironments` returns a promise that resolves to an array of `Environment` objects
   * after checking the API before making the call.
   * @returns The method `getEnvironments()` is returning a Promise that resolves to an array of
   * `Environment` objects.
   */
  public getEnvironments(): Promise<Array<Environment>> {
    this.checkApiBeforeCall();
    return this.delegate!.getEnvironments();
  }

  /**
   * The function `getEnvironment` retrieves an environment object based on the provided environment
   * parameter.
   * @param {Environment} environment - The `environment` parameter is of type `Environment`. It
   * represents the environment for which you want to retrieve information.
   * @returns The method is returning a Promise that resolves to either an instance of the Environment
   * class or null.
   */
  public getEnvironment(environment: Environment): Promise<Environment | null> {
    this.checkApiBeforeCall();
    return this.delegate!.getEnvironment(environment);
  }
  public updateEnvironment(environment: Environment, newName: string, newDescription: string): Promise<null | Environment> {
    this.checkApiBeforeCall();
    return this.delegate!.updateEnvironment(environment, newName, newDescription);
  }
  public createEnvironment(name: string, description: string, serviceid: string): Promise<null | Environment> {
    this.checkApiBeforeCall();
    return this.delegate!.createEnvironment(name, description, serviceid);
  }
  public removeEnvironment(environment: Environment): Promise<boolean> {
    this.checkApiBeforeCall();
    return this.delegate!.removeEnvironment(environment);
  }
  public runJobEnvironment(environment: Environment): Promise<boolean> {
    this.checkApiBeforeCall();
    return this.delegate!.runJobEnvironment(environment);
  }
  public updateResourcesToEnvironment(environment: Environment, resources: Array<EnvironmentResource>): Promise<null | Environment> {
    this.checkApiBeforeCall();
    return this.delegate!.updateResourcesToEnvironment(environment, resources);
  }

  public getEnvironmentTypes(): Promise<Array<EnvironmentType>> {
    this.checkApiBeforeCall();
    return this.delegate!.getEnvironmentTypes();
  }

  private checkApiBeforeCall() {
    if (!this.delegate) {
      console.log('Throw: delegate API not selected');
      throw new Error('delegate API not selected');
    }
  }


}
