import { Injectable } from '@angular/core';
import { ApiService } from 'api/api.service';
import { DictionaryType } from 'api/webApi/classes/dictionaryType.enum';
import { SearchCriteria } from 'api/webApi/classes/searchCriteria.enum';
import { Dictionary } from 'api/webApi/data/dictionary.interface';
import { ItemSummary } from 'api/webApi/data/itemSummary.interface';
import { DistributionDetails } from 'api/webApi/data/distributionDetails.interface';
import { LoggingService } from './logging.service';
import { Organization } from 'api/webApi/data/organization.interface';

/**
 * A service that exposes methods for accessing the webAPI search functionality
 * to the rest of the GUI.
 */
@Injectable()
export class SearchService {

  /**
   * Cache of {@link DistributionDetails} so that we don't call out multiple times
   * for the same objects.
   */
  private readonly cachedDistDetails = new Map<string, DistributionDetails>();

  constructor(
    private readonly apiService: ApiService,
    private readonly loggingService: LoggingService,
  ) {
  }

  /**
   * Performs a search using the searchCriteriaMap and the {@link ApiService}.
   * Also logs the call using the {@link LoggingService}.
   * @param searchCriteriaMap Map containing search criteria values.
   */
  public doSearch(searchCriteriaMap: Map<SearchCriteria, unknown>): Promise<Array<ItemSummary>> {
    // If want a common actionable in the data, here is where we will need to "upgrade" the
    // results with actions. Could use a decorator of the ItemResultList to "add" actions.

    return this.loggingService.logForPromise(this.apiService.doSearch(searchCriteriaMap), 'Item Search API Call');
  }

  /**
   * Retrives the details of a search result item either from cache or by calling {@link goGetDetails}.
   * Also logs the call using the {@link LoggingService}.
   * @param id The id of a search result item.
   */
  public getDetailsById(id: string, context: string): Promise<DistributionDetails> {
    const cachedValue = this.cachedDistDetails.get(id);
    return this.loggingService.logForPromise((cachedValue != null) //
      ? Promise.resolve(cachedValue) : this.goGetDetails(id, context), //
      this.getDetailsLogMessage(id));
  }

  /**
   * Uses the {@link ApiService} to retrieve a dictionary of terms.
   * Also logs the call using the {@link LoggingService}.
   * @param type The type of dictionary to retrieve.
   */
  public getDictionary(type: DictionaryType): Promise<Dictionary> {
    return this.loggingService.logForPromise(this.apiService.getDictionary(type), //
      this.getDictionaryLogMessage(type));
  }
  /**
    * Remove the details of a search result item by the cache.
    * @param id The id of a search result item.
    */
  public removeCachedDistyId(id: string): void {
    this.cachedDistDetails.delete(id);
  }

  /**
   * The function `getOrganizations` returns a promise that resolves to an array of `Organization`
   * objects or `null`, and logs the API call with a specific message.
   * @returns a Promise that resolves to an array of Organization objects or null.
   */
  public getOrganizations(type: string): Promise<Array<Organization> | null> {
    return this.loggingService.logForPromise(this.apiService.getOrganizations(type), 'Get organization list');
  }

  public getOrganizationById(organizationId: string): Promise<Organization | null> {
    return this.loggingService.logForPromise(this.apiService.getOrganizationById(organizationId), 'Get organization by id');
  }
  /**
   * Uses the {@link ApiService} to retrieve details of a search result item.
   * Successful results are internally cached.
   * @param id The id of a search result item.
   */
  private goGetDetails(id: string, context: string): Promise<DistributionDetails> {
    return this.apiService.getDetailsById(id, context)
      .then((distDetails: DistributionDetails) => {
        this.cachedDistDetails.set(id, distDetails);
        return distDetails;
      });
  }

  private getDetailsLogMessage(id: string,): string {
    return `Details API Call - id: ${id}`;
  }

  private getDictionaryLogMessage(type: DictionaryType,): string {
    return `Dictionary API Call - type: ${type}`;
  }
}
