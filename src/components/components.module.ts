import { NgModule, ModuleWithProviders } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent } from './header/header.component';
import { PageLoadingComponent } from './pageLoading/pageLoading.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { userNotificationProvider } from './userNotifications/userNotifications.adapter';
import { DirectivesModule } from 'directives/directives.module';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { InfoToolTipComponent } from './infoToolTip/infoToolTip.component';
import { LoginComponent } from './login/login.component';
import { LoadingComponent } from './loading/loading.component';
import { ObjectDisplayerComponent } from './objectDisplayer/objectDisplayer.component';
import { NotificationSnackComponent } from './notificationSnack/notificationSnack.component';
import { PipesModule } from 'pipes/pipes.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { VocabularyTooltipComponent } from './vocabularyTooltip/vocabularyTooltip.component';
import { CountrySelectComponent } from './contrySelect/countrySelect.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { DataProviderFilterComponent } from './dataProviderFilter/dataProviderFilter.component';
import { FacetDropdownComponent } from './facetDropdown/facetDropdown.component';
import { MatTreeModule } from '@angular/material/tree';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NotificationComponent } from './notification/notification.component';
import { NotificationService } from './notification/notification.service';
import { MultiSelectComponent } from './multiSelect/multiSelect.component';
import { VisibleOnComponent } from './visibleOn/visibleOn.component';
import { BaseResultsPanelComponent } from './baseResultsPanel/baseResultsPanel.component';
import { BaseLandingService } from 'pages/dataPortal/services/baseLanding.service';
import { MenuComponent } from './menu/menu.component';
import { MenuService } from './menu/menu.service';
import { PoweredByComponent } from './powered-by/poweredBy.component';

/**
 * Module for registering new components that may be used anywhere in the app.
 */
@NgModule({
  declarations: [
    HeaderComponent,
    PageLoadingComponent,
    InfoToolTipComponent,
    LoginComponent,
    LoadingComponent,
    ObjectDisplayerComponent,
    NotificationSnackComponent,
    VocabularyTooltipComponent,
    CountrySelectComponent,
    BreadcrumbComponent,
    DataProviderFilterComponent,
    FacetDropdownComponent,
    NotificationComponent,
    MultiSelectComponent,
    VisibleOnComponent,
    BaseResultsPanelComponent,
    MenuComponent,
    PoweredByComponent,
  ],
  imports: [
    RouterModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    DirectivesModule,
    // angular materials library
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTreeModule,
    MatExpansionModule,
    MatCheckboxModule,
    PipesModule,
    ReactiveFormsModule,
  ],
  exports: [
    HeaderComponent,
    PageLoadingComponent,
    LoadingComponent,
    InfoToolTipComponent,
    ObjectDisplayerComponent,
    NotificationSnackComponent,
    VocabularyTooltipComponent,
    CountrySelectComponent,
    BreadcrumbComponent,
    DataProviderFilterComponent,
    FacetDropdownComponent,
    NotificationComponent,
    MultiSelectComponent,
    VisibleOnComponent,
    BaseResultsPanelComponent,
    PoweredByComponent
  ],
})

export class ComponentsModule {
  static forRoot(): ModuleWithProviders<ComponentsModule> {
    return {
      ngModule: ComponentsModule,
      providers: [
        userNotificationProvider,
        NotificationService,
        BaseLandingService,
        MenuService
      ]
    };
  }
}
