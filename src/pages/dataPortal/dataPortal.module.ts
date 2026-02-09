import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MapInteractionService } from '../../utility/eposLeaflet/services/mapInteraction.service';
import { DataPortalComponent } from './dataPortal.component';
import { DataPanelModule } from './modules/dataPanel/dataPanel.module';
import { SoftwarePanelModule } from './modules/softwarePanel/softwarePanel.module';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FilterSearchModule } from './modules/dataPanel/filterSearchPanel/filterSearchPanel.module';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TablePanelModule } from './modules/tablePanel/tablePanel.module';
import { GraphPanelModule } from './modules/graphPanel/graphPanel.module';
import { MatBadgeModule } from '@angular/material/badge';
import { DataSearchConfigurablesServiceResource } from './modules/dataPanel/services/dataSearchConfigurables.service';
import { ResultsPanelService } from './services/resultsPanel.service';
import { BaseLandingService } from './services/baseLanding.service';
import { AnalysisModule } from './modules/analysisPanel/analysisPanel.module';
import { AnalysisConfigurablesService } from './services/analysisConfigurables.service';
import { MapModule } from './modules/map/map.modules';
import { DirectivesModule } from 'directives/directives.module';
import { RegistryPanelModule } from './modules/registryPanel/registryPanel.module';
import { DataSearchConfigurablesServiceRegistry } from './modules/registryPanel/services/dataSearchConfigurables.service';


@NgModule({
  declarations: [
    DataPortalComponent,
  ],
  imports: [
    CommonModule,
    MapModule,
    DataPanelModule,
    SoftwarePanelModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    FilterSearchModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatBadgeModule,
    TablePanelModule,
    GraphPanelModule,
    AnalysisModule,
    DirectivesModule,
    RegistryPanelModule,
  ],
  exports: [
  ],
  providers: [
    MapInteractionService,
    ResultsPanelService,
    BaseLandingService,
    AnalysisConfigurablesService,
    DataSearchConfigurablesServiceResource,
    DataSearchConfigurablesServiceRegistry,
  ]
})

export class DataPortalModule { }
