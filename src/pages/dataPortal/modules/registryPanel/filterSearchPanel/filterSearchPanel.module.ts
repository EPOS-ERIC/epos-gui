import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterSearchPanelComponent } from './filterSearchPanel.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { DirectivesModule } from 'directives/directives.module';
import { SpatialTemporalControlsModule } from '../../temporalSpatialControls/spatialTemporalControls.module';
import { DialogModule } from 'components/dialog/dialog.module';
import { ComponentsModule } from 'components/components.module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SearchFacilityComponent } from './searchFacility/searchFacility.component';

@NgModule({
  declarations: [
    FilterSearchPanelComponent,
    SearchFacilityComponent,
  ],
  imports: [
    CommonModule,
    MatExpansionModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    ScrollingModule,
    MatButtonModule,
    MatSelectModule,
    MatRadioModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    SpatialTemporalControlsModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatCheckboxModule,
    DirectivesModule,
    DialogModule,
    ComponentsModule,
  ],
  exports: [
    FilterSearchPanelComponent
  ],
  providers: [
  ]
})
export class FilterSearchModule { }
