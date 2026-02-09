import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DiscoverRequest, DiscoverResponse } from 'api/webApi/classes/discoverApi.interface';
import { DataSearchService } from 'services/dataSearch.service';

@Injectable()
export class SearchService extends DataSearchService {

  public static readonly FILTER_SPATIAL = 'Spatial';
  public static readonly FILTER_ORGANIZATION = 'Organisations';
  public static readonly FILTER_FACILITY_TYPE = 'Facility Type';
  public static readonly FILTER_EQUIPMENT_TYPE = 'Equipment Type';

  private _typeFilters = new BehaviorSubject<Array<string>>([]);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public typeFiltersObs = this._typeFilters.asObservable();


  public search(discoverRequest: DiscoverRequest): Promise<DiscoverResponse> {

    this.setFilter(discoverRequest);

    return this.doSearch(discoverRequest);

  }

  protected discoverRequestToLogString(request: DiscoverRequest): string {

    let s = '';

    // QUERY
    const query: null | string = request.getQuery();
    if (query != null) {
      s = s.concat(s, 'query: [', query, '] ');
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

    // facility type
    const facilityType: null | Array<string> = request.getFacilityTypeIds();
    if (facilityType != null && facilityType.length > 0) {
      s = s.concat(s, 'facilityType: #', String(facilityType.length) + ' ');
    }

    s = s.trim();

    if (s.length === 0) {
      s = 'no parameters provided';
    }

    return s;

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

    // spatial
    if (discoverRequest.getBBox().isBounded()) {
      filterArray.push(SearchService.FILTER_SPATIAL);
    }

    // facility type
    if (this.model.dataSearchFacilityTypeReg.get() !== null && this.model.dataSearchFacilityTypeReg.get()!.length > 0) {
      filterArray.push(SearchService.FILTER_FACILITY_TYPE);
    }

    // equipment type
    if (this.model.dataSearchEquipmentTypeReg.get() !== null && this.model.dataSearchEquipmentTypeReg.get()!.length > 0) {
      filterArray.push(SearchService.FILTER_EQUIPMENT_TYPE);
    }

    this._typeFilters.next(filterArray);
  }
}
