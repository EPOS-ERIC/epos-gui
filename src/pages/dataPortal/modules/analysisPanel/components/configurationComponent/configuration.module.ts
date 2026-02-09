import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NgxMatDatetimePickerModule } from '@angular-material-components/datetime-picker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { ConfigurationComponent } from './configuration.component';
import { SpatialTemporalControlsModule } from 'pages/dataPortal/modules/temporalSpatialControls/spatialTemporalControls.module';
import { DataConfigurationModule } from 'pages/dataPortal/modules/dataConfiguration/dataConfiguration.module';

@NgModule({
  declarations: [
    ConfigurationComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatOptionModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    NgxMatDatetimePickerModule,
    MatSlideToggleModule,
    MatInputModule,
    SpatialTemporalControlsModule,
    DataConfigurationModule,
  ],
  exports: [
    ConfigurationComponent
  ],
  providers: [
  ]
})

export class ConfigurationModule { }
