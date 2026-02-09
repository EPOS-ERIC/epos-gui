import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';

import { TraceSelectorComponent } from './traceSelector/traceSelector.component';

import { PlotlyViaWindowModule } from 'angular-plotly.js';
import { ComponentsModule } from 'components/components.module';
import { ReusableYAxesPipe } from './traceSelector/reusableYAxes.pipe';
import { GraphPanelComponent } from './graphPanel.component';
import { GraphDisplayComponent } from './graphDisplay/graphDisplay.component';
import { MatIconModule } from '@angular/material/icon';
import { TraceSelectorService } from './traceSelector/traceSelector.service';
// Check if this import is needed (probably NOT)!
import { DataSearchConfigurablesServiceResource } from '../dataPanel/services/dataSearchConfigurables.service';

@NgModule({
  declarations: [
    GraphPanelComponent,
    GraphDisplayComponent,
    TraceSelectorComponent,
    ReusableYAxesPipe,
  ],
  imports: [
    CommonModule,
    RouterModule,
    PlotlyViaWindowModule,
    ComponentsModule,
    // angular materials library
    MatMenuModule,
    MatTooltipModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatExpansionModule,
  ],
  exports: [
    GraphPanelComponent,
  ],
  providers: [
    TraceSelectorService,
    // Check if this import is needed (probably NOT)!
    DataSearchConfigurablesServiceResource
  ]
})

export class GraphPanelModule { }
