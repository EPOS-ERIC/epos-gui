import { NgModule, ModuleWithProviders } from '@angular/core';
import { aaaiServiceProvider } from './aaai.service';

import { selectableApiServiceProvider } from './api.service.factory';
import { HttpClientModule } from '@angular/common/http';
import { OAuthModule } from 'angular-oauth2-oidc';

@NgModule({
  declarations: [
  ],
  imports: [
    HttpClientModule,
    OAuthModule,
  ],
})
export class ApiModule {
  static forRoot(): ModuleWithProviders<ApiModule> {
    return {
      ngModule: ApiModule,
      providers: [selectableApiServiceProvider, aaaiServiceProvider]
    };
  }
}
