import { FacetModel } from '../data/facetModel.interface';
import { DistributionSummary } from '../data/distributionSummary.interface';
import { Moment } from 'moment';
import { BoundingBox } from '../data/boundingBox.interface';
import { Domain } from '../data/domain.interface';

export interface DiscoverApi {
  discover(request: DiscoverRequest): Promise<null | DiscoverResponse>;

  getFilters(context: string): Promise<null | DiscoverResponse>;

  getDomains(context: string): Promise<null | Array<Domain>>;
}

export interface DiscoverResponse {
  filters(): FacetModel<void>;
  results(): FacetModel<DistributionSummary>;
}

export interface DiscoverRequest {

  getContext(): null | string;

  getQuery(): null | string;
  /**
   * yyyy-MM-ddThh:mm:ssZ
   */
  getStartDate(): null | Moment;
  /**
   * yyyy-MM-ddThh:mm:ssZ
   */
  getEndDate(): null | Moment;
  /**
   * 4 numbers in an array,
   * order: epos:northernmostLatitude , epos:easternmostLongitude, epos:southernmostLatitude, epos:westernmostLongitude
   * (north,east,south,west)
   */
  getBBox(): BoundingBox;
  getKeywordIds(): null | Array<string>;
  getOrganisationIds(): null | Array<string>;
  getFacilityTypeIds(): null | Array<string>;
  getEquipmentTypeIds(): null | Array<string>;
  // used in search calls for 'Metadata Status' feature
  getVersioningStatus(): null | Array<string>;

  hasTemporalRange(): boolean;
}
