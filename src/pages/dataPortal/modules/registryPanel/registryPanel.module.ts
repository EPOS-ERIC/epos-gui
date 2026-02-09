import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RegistryPanelComponent } from './registryPanel.component';
import { FilterSearchModule } from './filterSearchPanel/filterSearchPanel.module';
import { LandingService } from './services/landing.service';
import { LandingPanelComponent } from './landingPanel/landingPanel.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { ResultsPanelComponent } from './resultsPanel/resultsPanel.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { ComponentsModule } from 'components/components.module';
import { DirectivesModule } from 'directives/directives.module';
import { MyPaginatorIntl } from 'utility/paginator/myPaginatorIntl';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { DataConfigurationModule } from '../dataConfiguration/dataConfiguration.module';
import { DataSearchConfigurablesServiceRegistry } from './services/dataSearchConfigurables.service';
import { VisibleOnComponent } from './visibleOn/visibleOn.component';


@NgModule({
  declarations: [
    RegistryPanelComponent,
    LandingPanelComponent,
    ResultsPanelComponent,
    VisibleOnComponent
  ],
  imports: [
    CommonModule,
    ComponentsModule,
    DataConfigurationModule,
    DirectivesModule,
    FilterSearchModule,
    MatTooltipModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  exports: [
    RegistryPanelComponent
  ],
  providers: [
    LandingService,
    DataSearchConfigurablesServiceRegistry,
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'fill' } },
    { provide: MatPaginatorIntl, useClass: MyPaginatorIntl },
    { provide: ResultsPanelComponent },
  ]
})

export class RegistryPanelModule { }
