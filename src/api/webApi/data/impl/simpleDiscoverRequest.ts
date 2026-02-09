import { DiscoverRequest } from 'api/webApi/classes/discoverApi.interface';
import { Moment } from 'moment';
import { TemporalRange } from '../temporalRange.interface';
import { BoundingBox } from '../boundingBox.interface';
import { SimpleTemporalRange } from './simpleTemporalRange';
import { SimpleBoundingBox } from './simpleBoundingBox';

export class SimpleDiscoverRequest implements DiscoverRequest {

  private constructor(
    private readonly context: null | string,
    private readonly query: null | string,
    private readonly temporalRange: TemporalRange,
    private readonly bbox: BoundingBox,
    private readonly keywordIds: null | Array<string>,
    private readonly organisationIds: null | Array<string>,
    private readonly facilityIds: null | Array<string>,
    private readonly equipmentIds: null | Array<string>,
    private readonly versioningStatus: null | Array<string>
  ) { }

  public static makeEmptyQuery(): DiscoverRequest {
    return SimpleDiscoverRequest.makeFreeTextQuery();
  }

  public static makeFreeTextQuery(query: null | string = null): DiscoverRequest {
    return SimpleDiscoverRequest.makeFullQuery(query);
  }

  public static makeFullQuery(//
    context: null | string = null,
    query: null | string = null,
    temporalRange: TemporalRange = SimpleTemporalRange.makeUnbounded(),
    bbox: BoundingBox = SimpleBoundingBox.makeUnbounded(),
    keywordIds: null | Array<string> = null,
    organisationIds: null | Array<string> = null,
    facilityIds: null | Array<string> = null,
    equipmentIds: null | Array<string> = null,
    versioningStatus: null | Array<string> = null,
  ): DiscoverRequest {
    return new SimpleDiscoverRequest(context, query, temporalRange, bbox, keywordIds, organisationIds, facilityIds, equipmentIds, versioningStatus);
  }

  getContext(): null | string {
    return this.context;
  }

  getQuery(): null | string {
    return this.query;
  }
  getStartDate(): null | Moment {
    return this.temporalRange.getLowerBound();
  }
  getEndDate(): null | Moment {
    return this.temporalRange.getUpperBound();
  }
  getBBox(): BoundingBox {
    return this.bbox;
  }
  getKeywordIds(): null | Array<string> {
    return this.keywordIds;
  }
  getOrganisationIds(): null | Array<string> {
    return this.organisationIds;
  }
  getFacilityTypeIds(): null | Array<string> {
    return this.facilityIds;
  }
  getEquipmentTypeIds(): null | Array<string> {
    return this.equipmentIds;
  }
  // used for the 'search' call in 'Metadata Status' feature
  getVersioningStatus(): null | Array<string> {
    return this.versioningStatus;
  }

  hasTemporalRange(): boolean {
    return true;
  }


}
