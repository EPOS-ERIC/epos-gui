import { Injectable, Injector } from '@angular/core';
import { Model } from './model.service';
import { PageLoadingService } from '../pageLoading.service';
import { DataSearchService } from 'services/dataSearch.service';
import { SearchService } from 'services/search.service';
import { AaaiService } from 'api/aaai.service';
import { EnvironmentService } from 'services/environment.service';
import { MetaDataStatusService } from 'services/metaDataStatus.service';

/**
 * All this class does is stop circular dependencies on the model service.
 *
 * Watches the {@link Model} and sets services that it needs when it has initialised.
 *
 * TODO: Look into whether this can be deprecated by passing the Model the "injector",
 * and maybe using interfaces to stop any circular dependencies.
 */
@Injectable()
export class ModelPrimer {

  constructor(
    private readonly model: Model,
    private readonly pageLoadingService: PageLoadingService,
    private readonly dataSearchService: DataSearchService,
    private readonly searchService: SearchService,
    private readonly injector: Injector,
    private readonly aaaiService: AaaiService,
    private readonly environmentService: EnvironmentService,
    private readonly metadataStatusService: MetaDataStatusService
  ) {
  }

  public setServicesAndTriggerInitialValues(): void {
    this.model.setServicesAndTriggerInitialValues({
      PageLoadingService: this.pageLoadingService,
      DataSearchService: this.dataSearchService,
      SearchService: this.searchService,
      Injector: this.injector,
      AaaiService: this.aaaiService,
      EnvironmentService: this.environmentService,
      MetaDataStatusService: this.metadataStatusService,
    });
  }
}
