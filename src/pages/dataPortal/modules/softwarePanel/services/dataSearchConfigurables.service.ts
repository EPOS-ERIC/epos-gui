import { Injectable, Injector } from '@angular/core';
import { Model } from 'services/model/model.service';
import { SearchService } from 'services/search.service';
import { DistributionDetails } from 'api/webApi/data/distributionDetails.interface';
import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { DiscoverResponse } from 'api/webApi/classes/discoverApi.interface';
import { DataConfigurableDataSearchI } from 'utility/configurablesDataSearch/dataConfigurableDataSearchI.interface';
import { DataConfigurableDataSearch } from 'utility/configurablesDataSearch/dataConfigurableDataSearch';
import { DataSearchConfigurablesService } from 'pages/dataPortal/services/dataSearchConfigurables.service';
import { CONTEXT_SOFTWARE } from 'api/api.service.factory';
import { TemporalRange } from 'api/webApi/data/temporalRange.interface';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { BoundingBox as LeafletBbox } from 'utility/eposLeaflet/eposLeaflet';
import { SimpleTemporalRange } from 'api/webApi/data/impl/simpleTemporalRange';
import moment from 'moment';

@Injectable()
export class DataSearchConfigurablesServiceSoftware extends DataSearchConfigurablesService {

  constructor(
    protected readonly model: Model,
    protected readonly searchService: SearchService,
    protected readonly injector: Injector,
    protected readonly localStoragePersister: LocalStoragePersister,
  ) {

    super(model, searchService, injector, model.dataSearchConfigurablesSoft);

    this.configurables = this.model.dataSearchConfigurablesSoft;

    this.configurables.valueObs.subscribe((configurables: Array<DataConfigurableDataSearchI>) => {
      // if something else set the configurables, refresh them to make sure consistent
      if (configurables !== this.previouslySetConfigurables && configurables.length > 0) {
        this.refresh();
      }
    });
    this.model.dataSearchBoundsSoft.valueObs.subscribe((bbox: BoundingBox) => {
      this.updateSpatialBounds(bbox);
    });
    this.model.dataSearchTemporalRangeSoft.valueObs.subscribe((tempRange: TemporalRange) => {
      this.updateTemporalRange(tempRange);
    });
    this.model.dataDiscoverResponseSoft.valueObs.subscribe((discoverResponse: DiscoverResponse) => {
      const selectedItem = this.getSelected();
      if ((selectedItem != null) && (discoverResponse != null)) {
        if (!selectedItem.isPinned()) {
          const results = discoverResponse.results();
          const selectedItemId = selectedItem.id;

          const foundItem = results.getFlatData().find((item) => {
            return (item.getIdentifier() === selectedItemId);
          });

          if (foundItem == null) {
            this.setSelected(null, true);
          }
        }
      }
    });
  }

  /**
   * The function creates a configurable data search object based on the distribution details and default
   * parameter values.
   * @param {string} distId - The `distId` parameter is a string that represents the ID of a
   * distribution.
   * @returns A Promise that resolves to a DataConfigurableDataSearch object.
   */
  public createConfigurable(
    distId: string,
  ): Promise<DataConfigurableDataSearch> {
    return this.searchService.getDetailsById(distId, CONTEXT_SOFTWARE)
      .then((distributionDetails: DistributionDetails) => {
        const paramDefs = distributionDetails.getParameters();

        return new DataConfigurableDataSearch(
          this.injector,
          distributionDetails,
          paramDefs.getDefaultParameterValues(),
          this.bBoxOrDefaults(paramDefs, this.model.dataSearchBoundsSoft.get()),
          this.tempRangeOrDefaults(paramDefs, this.model.dataSearchTemporalRangeSoft.get()),
        );
      });
  }

  /**
   * The function `setModelVariablesFromConfigurables` retrieves configurable values from local storage
   * and sets them in the model variables.
   */
  public setModelVariablesFromConfigurables(): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const bbox = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_DATA_SEARCH_BOUNDS_SOFT);
    if (bbox !== null && Array.isArray(bbox)) {
      try {
        const maxLat = bbox[0] as unknown;
        const maxLon = bbox[1] as unknown;
        const minLat = bbox[2] as unknown;
        const minLon = bbox[3] as unknown;
        const bboxObj = new LeafletBbox(maxLat as number, maxLon as number, minLat as number, minLon as number);
        bboxObj.setId(CONTEXT_SOFTWARE);
        this.model.dataSearchBoundsSoft.set(bboxObj, true);
      } catch (error) {
        console.warn(LocalStorageVariables.LS_DATA_SEARCH_BOUNDS_SOFT, 'incorrect variable on local storage');
      }
    }

    const temporalRange = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_DATA_SEARCH_TEMPORAL_RANGE_SOFT);
    if (temporalRange !== null && Array.isArray(temporalRange)) {
      const lower = temporalRange[0] ? moment(temporalRange[0] as moment.MomentInput) : null;
      const upper = temporalRange[1] ? moment(temporalRange[1] as moment.MomentInput) : null;
      if (lower && upper) {
        this.model.dataSearchTemporalRangeSoft.set(SimpleTemporalRange.makeBounded(lower, upper), true);
      } else if (lower == null && upper) {
        this.model.dataSearchTemporalRangeSoft.set(SimpleTemporalRange.makeWithoutLowerBound(upper), true);
      } else if (lower && upper == null) {
        this.model.dataSearchTemporalRangeSoft.set(SimpleTemporalRange.makeWithoutUpperBound(lower), true);
      }
    }

    const keywords = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_DATA_SEARCH_KEYWORDS_SOFT);
    if (keywords && (keywords as Array<string>).length > 0) {
      this.model.dataSearchKeywordsSoft.set(keywords as Array<string>, true);
    }

    const facets = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_DATA_SEARCH_FACET_LEAF_ITEMS_SOFT);
    if (facets && (facets as Array<string>).length > 0) {
      this.model.dataSearchFacetLeafItemsSoft.set(facets as Array<string>, true);
    }

    const typeData = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_DATA_SEARCH_TYPE_DATA_SOFT);
    if (typeData && (typeData as Array<string>).length > 0) {
      this.model.dataSearchTypeDataSoft.set(typeData as Array<string>, true);
    }
  }

}

