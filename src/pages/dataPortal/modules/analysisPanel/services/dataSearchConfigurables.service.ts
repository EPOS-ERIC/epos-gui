import { Injectable, Injector } from '@angular/core';
import { Model } from 'services/model/model.service';
import { SearchService } from 'services/search.service';
import { DistributionDetails } from 'api/webApi/data/distributionDetails.interface';
import { DataConfigurableDataSearch } from 'utility/configurablesDataSearch/dataConfigurableDataSearch';
import { DataSearchConfigurablesService } from 'pages/dataPortal/services/dataSearchConfigurables.service';
import { CONTEXT_RESOURCE } from 'api/api.service.factory';

@Injectable()
export class DataSearchConfigurablesServiceAnalysis extends DataSearchConfigurablesService {

  constructor(
    protected readonly model: Model,
    protected readonly searchService: SearchService,
    protected readonly injector: Injector,
  ) {

    super(model, searchService, injector, model.dataSearchConfigurables);

    this.configurables = this.model.dataSearchConfigurables;

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
    return this.searchService.getDetailsById(distId, CONTEXT_RESOURCE)
      .then((distributionDetails: DistributionDetails) => {
        const paramDefs = distributionDetails.getParameters();

        return new DataConfigurableDataSearch(
          this.injector,
          distributionDetails,
          paramDefs.getDefaultParameterValues(),
          this.bBoxOrDefaults(paramDefs, this.model.dataSearchBounds.get()),
          this.tempRangeOrDefaults(paramDefs, this.model.dataSearchTemporalRange.get()),
        );
      });
  }

}
