import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ComponentsModule } from 'components/components.module';
import { AnalysisPanelComponent } from './analysisPanel.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResourcesComponent } from './components/resourcesComponent/resources.component';
import { MatTableModule } from '@angular/material/table';
import { ConfigurationModule } from './components/configurationComponent/configuration.module';
import { DataSearchConfigurablesServiceAnalysis } from './services/dataSearchConfigurables.service';

@NgModule({
  declarations: [
    AnalysisPanelComponent,
    ResourcesComponent,
  ],
  imports: [
    CommonModule,
    ComponentsModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    ConfigurationModule,
  ],
  exports: [
    AnalysisPanelComponent,
    ResourcesComponent,
  ],
  providers: [
    DataSearchConfigurablesServiceAnalysis
  ]
})

export class AnalysisModule { }
