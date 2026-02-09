import { DetailsApi } from '../../classes/detailsApi.interface';
import { SearchCriteria } from '../../classes/searchCriteria.enum';
import { DictionaryType } from '../../classes/dictionaryType.enum';
import { DictionaryApi } from '../../classes/dictionaryApi.interface';
import { Api } from '../../classes/api.interface';
import { SearchApi } from '../../classes/searchApi.interface';
import { ItemSummary } from '../../data/itemSummary.interface';
import { Dictionary } from '../../data/dictionary.interface';
import { ExecutionApi } from '../../classes/executionApi.interface';
import { DiscoverApi, DiscoverResponse, DiscoverRequest } from '../../classes/discoverApi.interface';
import { DistributionSummary } from 'api/webApi/data/distributionSummary.interface';
import { DistributionDetails } from '../../data/distributionDetails.interface';
import { ParameterValue } from '../../data/parameterValue.interface';
import { AaaiApi } from 'api/webApi/classes/aaaiApi.interface';
import { DistributionFormat } from 'api/webApi/data/distributionFormat.interface';
import { EnvironmentApi } from 'api/webApi/classes/environments/environmentApi.interface';
import { Environment } from 'api/webApi/data/environments/environment.interface';
import { EnvironmentTypeApi } from 'api/webApi/classes/environments/environmentTypeApi.interface';
import { EnvironmentType } from 'api/webApi/data/environments/environmentType.interface';
import { EnvironmentResource } from 'api/webApi/data/environments/environmentResource.interface';
import { Organization } from 'api/webApi/data/organization.interface';
import { Domain } from 'api/webApi/data/domain.interface';
import { ShareApi } from 'api/webApi/classes/shareApi.interface';

export class DevCompositeApi implements Api {

  constructor(
    private readonly discoverApi: DiscoverApi,
    private readonly aaaiApi: AaaiApi,
    private readonly dictionaryApi: DictionaryApi,
    private readonly searchApi: SearchApi,
    private readonly detailsApi: DetailsApi,
    private readonly executionApi: ExecutionApi,
    private readonly shareApi: ShareApi,
    private readonly environmentApi: EnvironmentApi,
    private readonly environmentTypeApi: EnvironmentTypeApi,
  ) { }

  // ---------------------------

  discover(request: DiscoverRequest): Promise<null | DiscoverResponse> {
    return this.discoverApi.discover(request);
  }

  getFilters(context: string): Promise<null | DiscoverResponse> {
    return this.discoverApi.getFilters(context);
  }

  getDomains(context: string): Promise<null | Array<Domain>> {
    return this.discoverApi.getDomains(context);
  }

  // ---------------------------

  getDetails(summary: DistributionSummary, context: string): Promise<null | DistributionDetails> {
    return this.detailsApi.getDetails(summary, context);
  }

  getDetailsById(id: string, context: string): Promise<null | DistributionDetails> {
    return this.detailsApi.getDetailsById(id, context);
  }

  // ---------------------------

  doSearch(searchCriteriaMap: Map<SearchCriteria, unknown>): Promise<Array<ItemSummary>> {
    return this.searchApi.doSearch(searchCriteriaMap);
  }

  // ---------------------------

  getDictionary(type: DictionaryType): Promise<Dictionary> {
    return this.dictionaryApi.getDictionary(type);
  }

  getOrganizations(type: string): Promise<Organization[] | null> {
    return this.searchApi.getOrganizations(type);
  }

  getOrganizationById(organizationId: string): Promise<Organization | null> {
    return this.searchApi.getOrganizationById(organizationId);
  }

  // ---------------------------

  // Configuration

  executeAuthenticatedUrl(
    url: string,
  ): Promise<Blob> {
    return this.executionApi.executeAuthenticatedUrl(url);
  }

  executeUrl(
    url: string,
  ): Promise<Blob> {
    return this.executionApi.executeUrl(url);
  }

  executeDistributionFormat(
    format: DistributionFormat,
    params: null | Array<ParameterValue>,
    asBlob: boolean,
  ): Promise<Record<string, unknown> | Blob> {
    return this.executionApi.executeDistributionFormat(format, params, asBlob);
  }

  getExecuteUrl(
    format: DistributionFormat,
    params: null | Array<ParameterValue>,
  ): string {
    return this.executionApi.getExecuteUrl(format, params);
  }


  /**
   * Not for execution, just for reference to the originator (TCS)
   */
  getOriginatorUrl(
    distribution: DistributionSummary,
    params: Array<ParameterValue>
  ): Promise<string> {
    return this.executionApi.getOriginatorUrl(distribution, params);
  }


  /**
   * The function `saveConfigurables` saves a string value using the `shareApi` and returns a Promise
   * with the saved value.
   * @param {string} value - The `value` parameter in the `saveConfigurables` function is a string that
   * represents the configuration data that needs to be saved.
   * @returns The `saveConfigurables` function returns a Promise that resolves to a string value.
   */
  saveConfigurables(value: string): Promise<string> {
    return this.shareApi.saveConfigurables(value);
  }

  /**
   * The function `retrieveConfigurables` retrieves configurable settings based on a given key
   * asynchronously.
   * @param {string} key - The `key` parameter is a string that is used to retrieve configurable
   * settings from the `shareApi`.
   * @returns The `retrieveConfigurables` function is returning a Promise that resolves to a string or
   * null value.
   */
  retrieveConfigurables(key: string): Promise<string | null> {
    return this.shareApi.retrieveConfigurables(key);
  }


  // Environment
  /**
   * The function `getEnvironments` returns a promise that resolves to an array of `Environment` objects.
   * @returns The function `getEnvironments()` is returning a Promise that resolves to an array of
   * `Environment` objects.
   */
  getEnvironments(): Promise<Array<Environment>> {
    return this.environmentApi.getEnvironments();
  }
  /**
   * The function `getEnvironment` takes an `Environment` parameter and returns a promise that resolves
   * to either the requested environment or `null`.
   * @param {Environment} environment - The `environment` parameter is of type `Environment`. It
   * represents the environment for which you want to retrieve information.
   * @returns A Promise that resolves to either an Environment object or null.
   */
  getEnvironment(environment: Environment): Promise<Environment | null> {
    return this.environmentApi.getEnvironment(environment);
  }
  updateEnvironment(environment: Environment, newName: string, newDescription: string): Promise<null | Environment> {
    return this.environmentApi.updateEnvironment(environment, newName, newDescription);
  }
  createEnvironment(name: string, description: string, serviceid: string): Promise<null | Environment> {
    return this.environmentApi.createEnvironment(name, description, serviceid);
  }
  removeEnvironment(environment: Environment): Promise<boolean> {
    return this.environmentApi.removeEnvironment(environment);
  }
  runJobEnvironment(environment: Environment): Promise<boolean> {
    return this.environmentApi.runJobEnvironment(environment);
  }

  updateResourcesToEnvironment(environment: Environment, resources: Array<EnvironmentResource>): Promise<null | Environment> {
    return this.environmentApi.updateResourcesToEnvironment(environment, resources);
  }

  getEnvironmentTypes(): Promise<Array<EnvironmentType>> {
    return this.environmentTypeApi.getEnvironmentTypes();
  }

}
