import { NgModule, ModuleWithProviders } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { SearchService } from './search.service';
import { DataSearchService } from './dataSearch.service';
import { ExecutionService } from './execution.service';
import { PageLoadingService } from './pageLoading.service';
import { Model } from './model/model.service';
import { ModelPrimer } from './model/modelPrimer.service';
import { RouteInfoService } from './routeInfo.service';
import { LoggingService } from './logging.service';
import { LiveDeploymentService } from './liveDeployment.service';
import { PoliciesService } from './policiesService.service';
import { InformationsService } from './informationsService.service';
import { LocalStoragePersister } from './model/persisters/localStoragePersister';
import { PanelsEmitterService } from './panelsEventEmitter.service';
import { EnvironmentService } from './environment.service';
import { TourService } from './tour.service';
import { ShareService } from './share.service';
/**
 * Module for registering new services that may be used anywhere in the app.
 */
@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    HttpClientModule
  ],
})

export class ServicesModule {
  static forRoot(): ModuleWithProviders<ServicesModule> {
    return {
      ngModule: ServicesModule,
      providers: [
        SearchService, DataSearchService,
        ExecutionService,
        PageLoadingService,
        Model, ModelPrimer,
        RouteInfoService, LoggingService,
        LiveDeploymentService,
        PoliciesService,
        InformationsService,
        LocalStoragePersister,
        PanelsEmitterService,
        EnvironmentService,
        TourService,
        ShareService,
      ]
    };
  }
}
