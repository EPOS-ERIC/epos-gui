import { ModuleWithProviders, NgModule } from '@angular/core';
import { Tracker } from './tracker.service';
import { ServicesModule } from 'services/services.module';

@NgModule({
  declarations: [
  ],
  imports: [
    ServicesModule.forRoot()
  ],
  providers: [
    Tracker
  ]
})

export class TrackerModule {
  static forRoot(): ModuleWithProviders<TrackerModule> {
    return {
      ngModule: TrackerModule,
    };
  }
}
