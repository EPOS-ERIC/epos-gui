import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpatialControlsComponent } from './spatialControls/spatialControls.component';
import { SimpleSpatialControlComponent } from './spatialControls/simpleSpatialControl/simpleSpatialControl.component';
import { DrawingSpatialControlComponent } from './spatialControls/drawingSpatialControl/drawingSpatialControl.component';
import { FormsModule } from '@angular/forms';
import { TemporalControlsComponent } from './temporalControls/temporalControls.component';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';



@NgModule({
  declarations: [SpatialControlsComponent, SimpleSpatialControlComponent, TemporalControlsComponent, DrawingSpatialControlComponent],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatTooltipModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule
  ],
  exports: [
    SpatialControlsComponent, SimpleSpatialControlComponent, TemporalControlsComponent, DrawingSpatialControlComponent
  ]
})
export class SpatialTemporalControlsModule { }
