import { Injectable } from '@angular/core';
import { DiscoverRequest, DiscoverResponse } from 'api/webApi/classes/discoverApi.interface';
import { BehaviorSubject } from 'rxjs';
import { DataSearchService } from 'services/dataSearch.service';

@Injectable()
export class SearchService extends DataSearchService {

  public static readonly FILTER_SPATIAL = 'Spatial';
  public static readonly FILTER_TEMPORAL = 'Temporal';
  public static readonly FILTER_ORGANIZATION = 'Providers';
  public static readonly FILTER_TYPE = 'Data Visualization';

  private _typeFilters = new BehaviorSubject<Array<string>>(['']);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public typeFiltersObs = this._typeFilters.asObservable();

  public search(discoverRequest: DiscoverRequest): Promise<DiscoverResponse> {

    this.setFilter(discoverRequest);

    return this.doSearch(discoverRequest);

  }

  /**
  * It counts the number of filters that are applied to the discover request
  * @param {DiscoverRequest} discoverRequest - The DiscoverRequest object that is used to filter the
  * data.
  */
  private setFilter(discoverRequest: DiscoverRequest) {

    const filterArray = new Array<string>();
    // organisation
    const organisationsIds = discoverRequest.getOrganisationIds();
    if (organisationsIds !== null && organisationsIds!.length > 0) {
      filterArray.push(SearchService.FILTER_ORGANIZATION);
    }

    // temporal
    const temporalStart = discoverRequest.getStartDate();
    const temporalEnd = discoverRequest.getEndDate();
    if (temporalStart !== null || temporalEnd !== null) {
      filterArray.push(SearchService.FILTER_TEMPORAL);
    }

    // spatial
    if (discoverRequest.getBBox().isBounded()) {
      filterArray.push(SearchService.FILTER_SPATIAL);
    }

    // Data type
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (this.model.dataSearchTypeData.get() !== null && this.model.dataSearchTypeData.get()!.length > 0) {
      filterArray.push(SearchService.FILTER_TYPE);
    }

    this._typeFilters.next(filterArray);
  }

}
