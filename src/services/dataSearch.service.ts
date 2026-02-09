import { Injectable } from '@angular/core';
import { ApiService } from 'api/api.service';
import { DiscoverRequest, DiscoverResponse } from 'api/webApi/classes/discoverApi.interface';
import { Model } from './model/model.service';

import { LoggingService } from './logging.service';
import { Organization } from 'api/webApi/data/organization.interface';
import { CONTEXT_FACILITY, CONTEXT_RESOURCE, CONTEXT_SOFTWARE } from 'api/api.service.factory';

/**
 * A service that exposes the "discover" webAPI functionality to the rest of the GUI.
 */
@Injectable()
export class DataSearchService {

  constructor(
    protected readonly apiService: ApiService,
    protected readonly loggingService: LoggingService,
    protected readonly model: Model,
  ) {
  }

  /**
   * Triggers the search callout from the {@link ApiService} and sets the response to the {@link Model}.
   * @param discoverRequest {DiscoverRequest} Defines the parameters of the search.
   */
  public doSearch(discoverRequest: DiscoverRequest): Promise<DiscoverResponse> {

    return this.loggingService.logForPromise(
      this.apiService.discover(discoverRequest),
      this.getLogMessage(discoverRequest),
    ).then((r: DiscoverResponse) => {

      switch (discoverRequest.getContext()) {
        case CONTEXT_RESOURCE: {
          this.model.dataDiscoverResponse.set(r);
          break;
        }
        case CONTEXT_FACILITY: {
          this.model.dataDiscoverResponseReg.set(r);
          break;
        }
        case CONTEXT_SOFTWARE: {
          this.model.dataDiscoverResponseSoft.set(r);
          break;
        }
      }

      return r;
    });

  }

  /**
   * The function "getOrganizations" returns a promise that resolves to an array of Organization
   * objects.
   * @returns a Promise that resolves to an array of Organization objects.
   */
  public getOrganizations(type: string): Promise<Array<Organization>> {
    return this.apiService.getOrganizations(type)
      .then((r: Array<Organization>) => {
        return r;
      });
  }

  protected discoverRequestToLogString(request: DiscoverRequest): string {

    let s = '';

    // QUERY
    const query: null | string = request.getQuery();
    if (query != null) {
      s = s.concat(s, 'query: [', query, '] ');
    }

    const momentFormat = 'YYYY-MM-DDThh:mm:ssZ';

    // START
    const start = request.getStartDate();
    if (start != null) {
      s = s.concat(s, 'startDate: ', start.format(momentFormat), ' ');
    }

    // END
    const end = request.getEndDate();
    if (end != null) {
      s = s.concat(s, 'endDate: ', end.format(momentFormat), ' ');
    }

    // BBOX
    const bbox = request.getBBox();
    if (bbox != null) {
      // order: epos:northernmostLatitude , epos:easternmostLongitude, epos:southernmostLatitude, epos:westernmostLongitude
      // (north,east,south,west)
      // const value: string = '' + bbox[0] + ',' + bbox[1] + ',' + bbox[2] + ',' + bbox[3] + '';
      const value: string = bbox.asArray().join(',');
      s = s.concat(s, 'bbox: ', value, ' ');
    }

    // keywords
    const keywords: null | Array<string> = request.getKeywordIds();
    if (keywords != null && keywords.length > 0) {
      s = s.concat(s, 'keywords: #', String(keywords.length) + ' ');
    }

    // organisations
    const organisations: null | Array<string> = request.getOrganisationIds();
    if (organisations != null && organisations.length > 0) {
      s = s.concat(s, 'organisations: #', String(organisations.length) + ' ');
    }

    s = s.trim();

    if (s.length === 0) {
      s = 'no parameters provided';
    }

    return s;

  }

  protected getLogMessage(discoverRequest: DiscoverRequest): string {
    return `Search API Call - ${this.discoverRequestToLogString(discoverRequest)}`;
  }

}
