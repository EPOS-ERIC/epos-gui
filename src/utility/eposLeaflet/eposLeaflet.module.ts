import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { EposLeafletComponent } from './components/eposLeaflet.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LayerControlComponent } from './components/layerControlComponent/layerControl.component';
import { OverlayArcticComponent } from './components/layerControlComponent/overlayArticLayer/overlayArticLayer.component';
import { LayerLegendComponent } from './components/layerControlComponent/layerLegendComponent/layerLegend.component';
import { LayerCustomizeComponent } from './components/layerControlComponent/layerCustomizeComponent/layerCustomize.component';
import { LayersService } from './services/layers.service';
import { MccColorPickerModule } from 'material-community-components/color-picker';
import { MatSelectModule } from '@angular/material/select';
import { LayerToggleComponent } from './components/layerToggleComponent/layerToggle.component';
import { LayerTabsControlComponent } from './components/layerControlComponent/layerTabControlComponent/layerTabsControl.component';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { BaseLayerSelectionComponent }
  from './components/layerControlComponent/baseLayerSelectionComponent/baseLayerSelection.component';
import { LightboxModule } from 'ngx-lightbox';

@NgModule({
  declarations: [
    EposLeafletComponent,
    LayerControlComponent,
    OverlayArcticComponent,
    LayerLegendComponent,
    LayerToggleComponent,
    LayerCustomizeComponent,
    LayerTabsControlComponent,
    BaseLayerSelectionComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    DragDropModule,
    MatTabsModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    FormsModule,
    MccColorPickerModule,
    MatButtonModule,
    MatRadioModule,
    LightboxModule,
  ],
  exports: [
    EposLeafletComponent,
  ],
  providers: [
    HttpClient,
    LayersService,
  ]
})
export class EposLeafletModule { }
