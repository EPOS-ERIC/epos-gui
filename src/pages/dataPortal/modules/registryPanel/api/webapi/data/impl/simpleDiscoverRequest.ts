import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { SimpleBoundingBox } from 'api/webApi/data/impl/simpleBoundingBox';
import { DiscoverRequest } from 'api/webApi/classes/discoverApi.interface';
import { Moment } from 'moment';

export class SimpleDiscoverRequest implements DiscoverRequest {

  private constructor(
    private readonly context: null | string,
    private readonly query: null | string,
    private readonly bbox: BoundingBox,
    private readonly keywordIds: null | Array<string>,
    private readonly organisationIds: null | Array<string>,
    private readonly facilityTypeIds: null | Array<string>,
    private readonly equipmentTypeIds: null | Array<string>,
    private readonly versioningStatus: null | Array<string>
  ) { }

  public static makeEmptyQuery(): DiscoverRequest {
    return SimpleDiscoverRequest.makeFreeTextQuery();
  }

  public static makeFreeTextQuery(query: null | string = null): DiscoverRequest {
    return SimpleDiscoverRequest.makeFullQuery(query);
  }

  public static makeFullQuery(//
    context: null | string,
    query: null | string = null,
    bbox: BoundingBox = SimpleBoundingBox.makeUnbounded(),
    keywordIds: null | Array<string> = null,
    organisationIds: null | Array<string> = null,
    facilityTypeIds: null | Array<string> = null,
    equipmentTypeIds: null | Array<string> = null,
    versioningStatus: null | Array<string> = null
  ): DiscoverRequest {
    return new SimpleDiscoverRequest(context, query, bbox, keywordIds, organisationIds, facilityTypeIds, equipmentTypeIds, versioningStatus);
  }

  getContext(): null | string {
    return this.context;
  }

  getQuery(): null | string {
    return this.query;
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
    return this.facilityTypeIds;
  }
  getEquipmentTypeIds(): null | Array<string> {
    return this.equipmentTypeIds;
  }
  getVersioningStatus(): null | Array<string> {
    return this.versioningStatus;
  }

  hasTemporalRange(): boolean {
    return false;
  }

  getStartDate(): Moment {
    throw new Error('Method not implemented.');
  }
  getEndDate(): Moment {
    throw new Error('Method not implemented.');
  }

}
