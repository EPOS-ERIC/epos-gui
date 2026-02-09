import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EposLeafletModule } from 'utility/eposLeaflet/eposLeaflet';
import { MapComponent } from './map.component';

@NgModule({
  declarations: [
    MapComponent,
  ],
  imports: [
    CommonModule,
    EposLeafletModule
  ],
  exports: [
    MapComponent,
  ],
  providers: [
  ]
})

export class MapModule { }

