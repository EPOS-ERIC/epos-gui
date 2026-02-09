import { ModuleWithProviders, NgModule } from '@angular/core';
import { NgxMatomoTrackerModule } from '@ngx-matomo/tracker';
import { environment } from 'environments/environment';
import { Tracker } from './tracker.service';
import { ServicesModule } from 'services/services.module';

@NgModule({
  declarations: [
  ],
  imports: [
    NgxMatomoTrackerModule.forRoot({
      siteId: environment.matomoSiteId, // your Matomo's site ID (find it in your Matomo's settings)
      trackerUrl: environment.matomoEndpoint, // your matomo server root url
    }),
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
