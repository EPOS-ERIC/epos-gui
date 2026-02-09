import { NgModule, ModuleWithProviders } from '@angular/core';
import { PleaseLoginContentComponent } from './pleaseLoginDialog/pleaseLoginContent.component';
import { DialogService } from './dialog.service';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatTableModule } from '@angular/material/table';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { CommonModule } from '@angular/common';
import { DirectivesModule } from 'directives/directives.module';
import { FeedbackDialogComponent } from './feedbackDialog/feedbackDialog.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ComponentsModule } from 'components/components.module';
import { BaseDialogComponent } from './baseDialog/baseDialog.component';
import { ConfirmationDialogComponent } from './confirmationDialog/confirmationDialog.component';
import { DetailsDialogComponent } from './detailsDialog/detailsDialog.component';
import { DisclaimerDialogComponent } from './disclaimerDialog/disclaimerDialog.component';
import { RouterModule } from '@angular/router';
import { PoliciesComponent } from './policiesDialog/policies.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatDatetimePickerModule } from '@angular-material-components/datetime-picker';
import { ParameterValidatorDirective } from './parametersDialog/parameterValidator.directive';
import { FirstErrorMessagePipe } from './parametersDialog/firstErrorMessage.pipe';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatGridListModule } from '@angular/material/grid-list';
import { ParametersDialogComponent } from './parametersDialog/parametersDialog.component';
import { PipesModule } from 'pipes/pipes.module';
import { SpatialCoverageMapComponent } from './detailsDialog/spatialCoverageMap/spatialCoverageMap.component';
import { InformationsDialogComponent } from './informationsDialog/informationsDialog.component';
import { TourDialogComponent } from './tourDialog/tourDialog.component';
import { DownloadsDialogComponent } from './downloadsDialog/downloadsDialog.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTabsModule } from '@angular/material/tabs';
import { VideoGuidesDialogComponent } from './videoGuidesDialog/videoGuidesDialog.component';
import { VideoComponent } from './videoGuidesDialog/videoComponent/video.component';
import { MobileDisclaimerDialogComponent } from './mobileDisclaimerDialog/mobileDisclaimerDialog.component';
import { ContactFormDialogComponent } from './contactFormDialog/contactFormDialog.component';
import { MatTreeModule } from '@angular/material/tree';
import { CreateEnvironmentFormDialogComponent } from './analysisDialogs/createEnvironmentFormDialog/createEnvironmentFormDialog.component';
import { DataConfigurationModule } from 'pages/dataPortal/modules/dataConfiguration/dataConfiguration.module';
import { ConfigurationModule } from 'pages/dataPortal/modules/analysisPanel/components/configurationComponent/configuration.module';
import { DataProviderFilterDialogComponent } from './dataProviderFilterDialog/dataProviderFilterDialog.component';
import { GraphPanelDialogComponent } from './graphPanelDialog/graphPanelDialog.component';
import { GraphPanelModule } from 'pages/dataPortal/modules/graphPanel/graphPanel.module';
import { TablePanelModule } from 'pages/dataPortal/modules/tablePanel/tablePanel.module';
import { TablePanelDialogComponent } from './tablePanelDialog/tablePanelDialog.component';
import { CitationComponent } from './detailsDialog/citation/citation.component';
import { CitationDialogComponent } from './citationDialog/citationDialog.component';
import { ShareInformationsDialogComponent } from './shareInformationsDialog/shareInformationsDialog.component';
import { SwitchItemConfirmationDialogComponent } from './switchItemConfirmationDialog/switchItemConfirmationDialog.component';
import { MatomoStatsDialogComponent } from 'components/dialog/matomoStatsDialog/matomoStatsDialog.component';
import { ScientificExamplesDialogComponent } from './scientificExamplesDialog/scientificExamplesDialog.component';
import { CrsIncompatDialogComponent } from './crsIncompatDialog/crsIncompatDialog.component';
import { MetaDataStatusDialogComponent } from './metaDataStatusDialog/metaDataStatusDialog.component';


/**
 * A module for conveniently registering new components used for dialogs.
 */
@NgModule({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  declarations: [
    PleaseLoginContentComponent,
    FeedbackDialogComponent,
    BaseDialogComponent,
    ConfirmationDialogComponent,
    DetailsDialogComponent,
    DisclaimerDialogComponent,
    PoliciesComponent,
    ParameterValidatorDirective,
    FirstErrorMessagePipe,
    ParametersDialogComponent,
    SpatialCoverageMapComponent,
    InformationsDialogComponent,
    ScientificExamplesDialogComponent,
    TourDialogComponent,
    DownloadsDialogComponent,
    VideoGuidesDialogComponent,
    VideoComponent,
    MobileDisclaimerDialogComponent,
    ContactFormDialogComponent,
    CreateEnvironmentFormDialogComponent,
    DataProviderFilterDialogComponent,
    GraphPanelDialogComponent,
    TablePanelDialogComponent,
    CitationComponent,
    CitationDialogComponent,
    ShareInformationsDialogComponent,
    SwitchItemConfirmationDialogComponent,
    MatomoStatsDialogComponent,
    CrsIncompatDialogComponent,
    MetaDataStatusDialogComponent
  ],
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    HttpClientModule,
    DirectivesModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSliderModule,
    MatInputModule,
    MatRadioModule,
    MatExpansionModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatListModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatTabsModule,
    ComponentsModule,
    RouterModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatIconModule,
    DragDropModule,
    MatTooltipModule,
    NgxMatDatetimePickerModule,
    MatDatepickerModule,
    MatGridListModule,
    PipesModule,
    MatSlideToggleModule,
    MatTreeModule,
    DataConfigurationModule,
    ConfigurationModule,
    GraphPanelModule,
    TablePanelModule,
  ],
  exports: [
    BaseDialogComponent,
  ],
  providers: [
  ]
})

export class DialogModule {
  static forRoot(): ModuleWithProviders<DialogModule> {
    return {
      ngModule: DialogModule,
      providers: [
        DialogService,
        { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'fill' } },
      ]
    };
  }
}
