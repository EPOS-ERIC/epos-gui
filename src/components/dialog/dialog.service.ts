import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoginMessageObject, PleaseLoginContentComponent } from './pleaseLoginDialog/pleaseLoginContent.component';
import { FeedbackDialogComponent } from './feedbackDialog/feedbackDialog.component';
import { BaseDialogService, DialogData } from './baseDialogService.abstract';
import { ConfirmationDataIn, ConfirmationDialogComponent } from './confirmationDialog/confirmationDialog.component';
import { DisclaimerDialogComponent } from './disclaimerDialog/disclaimerDialog.component';
import { DetailsDataIn, DetailsDialogComponent } from './detailsDialog/detailsDialog.component';
import { ParametersDialogComponent } from './parametersDialog/parametersDialog.component';
import { InformationsDialogComponent } from './informationsDialog/informationsDialog.component';
import { DownloadsDialogComponent } from './downloadsDialog/downloadsDialog.component';
import { DataConfigurableI } from 'utility/configurables/dataConfigurableI.interface';
import { VideoGuidesDialogComponent } from './videoGuidesDialog/videoGuidesDialog.component';
import { MobileDisclaimerDialogComponent } from './mobileDisclaimerDialog/mobileDisclaimerDialog.component';
import { ContactFormDialogComponent } from './contactFormDialog/contactFormDialog.component';
import { AddEditEnvironmentDialogDataIn, CreateEnvironmentFormDialogComponent } from './analysisDialogs/createEnvironmentFormDialog/createEnvironmentFormDialog.component';
import { Environment } from 'api/webApi/data/environments/environment.interface';
import { PoliciesComponent } from './policiesDialog/policies.component';
import { DataConfigurationType } from 'utility/configurables/dataConfigurationType.enum';
import { DataProviderFilterDialogComponent } from './dataProviderFilterDialog/dataProviderFilterDialog.component';
import { Organization } from 'api/webApi/data/organization.interface';
import { Domain } from 'api/webApi/data/domain.interface';
import { GraphPanelDialogComponent } from './graphPanelDialog/graphPanelDialog.component';
import { TablePanelDialogComponent } from './tablePanelDialog/tablePanelDialog.component';
import { CitationDialogComponent, CitationsDataIn } from './citationDialog/citationDialog.component';
import { DistributionDetails } from '../../api/webApi/data/distributionDetails.interface';
import { ShareInformationsDialogComponent } from './shareInformationsDialog/shareInformationsDialog.component';
import { SwitchItemConfirmationDialogComponent } from './switchItemConfirmationDialog/switchItemConfirmationDialog.component';
import { Subject } from 'rxjs';
import { MatomoStatsDialogComponent } from 'components/dialog/matomoStatsDialog/matomoStatsDialog.component';
import { ScientificExamplesDialogComponent } from './scientificExamplesDialog/scientificExamplesDialog.component';
import { scientificExamplesDataType } from './scientificExamplesDialog/scientificExamplesDialog.component';
import { NewFeaturesService } from './newFeatureDialog/newFeatures.service';
import { MetaDataStatusDialogComponent } from './metaDataStatusDialog/metaDataStatusDialog.component';
import { CrsIncompatDataIn, CrsIncompatDialogComponent, WmsCrsIncompat } from './crsIncompatDialog/crsIncompatDialog.component';


/**
 * A service used for showing dialogs.
 *
 * This should be developed to be the single method by which we display dialogs.
 * [issue]{@link https://epos-ci.brgm.fr/epos/epos-gui/issues/248}
 *
 * TODO:
 * - try to make it so that we don't need to create a new function in here for every new component.
 * - Have a standard confirmation component (takes message string, onConfirm function, onCancel function ?).
 */
@Injectable()
export class DialogService extends BaseDialogService {

  // to hold/emit value of the openSwtichItemConfirmationDialog
  private switchItemDialogConfirmed = new Subject<boolean>();

  constructor(public dialog: MatDialog, private readonly newFeaturesService: NewFeaturesService
  ) {
    super(dialog);
  }

  public openPleaseLoginDialog(parentElement?: HTMLElement, message?: LoginMessageObject): Promise<null | DialogData> {
    return this.openDialog(
      'pleaseLogin',
      PleaseLoginContentComponent,
      'epos-dialog',
      true,
      {
        title: message?.title ?? '',
        message: message?.message ?? ''
      },
      null,
      parentElement,
    );
  }

  public closePleaseLoginDialog(): void {
    const loginDialog = this.dialog.getDialogById('pleaseLogin');
    if (null != loginDialog) {
      loginDialog.close();
    }
  }

  public openFeedbackDialog(): Promise<null | DialogData> {
    return this.openDialog(
      'feedback',
      FeedbackDialogComponent,
      'epos-dialog',
    );
  }

  public openContactFormDialog(distId: string): Promise<null | DialogData> {

    return this.openDialog(
      'contactForm',
      ContactFormDialogComponent,
      'epos-dialog',
      false,
      {
        distId: distId
      },
      {
        width: '30vw',
      }
    );
  }

  public openConfirmationDialog(
    messageHtml = 'Confirm action',
    closable = false,
    confirmButtonHtml = 'OK',
    confirmButtonCssClass = 'confirm',
    cancelButtonHtml = 'Cancel',
  ): Promise<boolean> {
    return this.openDialog<ConfirmationDataIn>(
      'confirm',
      ConfirmationDialogComponent,
      'epos-dialog',
      closable,
      {
        messageHtml: messageHtml,
        confirmButtonHtml: confirmButtonHtml,
        cancelButtonHtml: cancelButtonHtml,
        confirmButtonCssClass: confirmButtonCssClass,
      },
    ).then((data: DialogData<ConfirmationDataIn, boolean>) => (null != data) && (data.dataOut));
  }

  public openSwitchItemConfirmationDialog(
    options: {
      dialogTitle?: string;
      closable?: boolean;
      expandedElementName?: string;
      addTofavouriteAndContinueButtonCssClass?: string;
      continueButtonHtml?: string;
    } = {}
  ): Promise<boolean> {
    const {
      dialogTitle = 'Keep your data',
      closable = false,
      expandedElementName = '',
      addTofavouriteAndContinueButtonCssClass = 'confirm',
      continueButtonHtml = 'Continue'
    } = options;

    return this.openDialog<ConfirmationDataIn>(
      'switchingItem',
      SwitchItemConfirmationDialogComponent,
      'no-resize',
      closable,
      {
        dialogTitle: dialogTitle,
        expandedElementName: expandedElementName,
        addTofavouriteAndContinueButtonCssClass: addTofavouriteAndContinueButtonCssClass,
        continueButtonHtml: continueButtonHtml,
      },
      {
        width: '50vw'
      }
    ).then((data: DialogData<ConfirmationDataIn, boolean>) => (null != data) && (data.dataOut));
  }

  // to emit choice of the user
  public setSwitchItemDialogConfirmation(confirmed: boolean) {
    this.switchItemDialogConfirmed.next(confirmed);
  }

  public getSwitchItemDialogConfirmation() {
    return this.switchItemDialogConfirmed.asObservable();
  }

  public openMetaDataStatusDialog(
    options: {
      dialogTitle?: string;
      closable?: boolean;
      userRole?: string;
      activateMetadataStatusModeCssClass?: string;
      cancelButtonHtml?: string;
    } = {}
  ): Promise<boolean> {
    const {
      dialogTitle = 'Activate Metadata Preview Mode?',
      closable = false,
      userRole = '',
      activateMetadataStatusModeCssClass = 'confirm',
      cancelButtonHtml = 'Cancel'
    } = options;

    return this.openDialog<ConfirmationDataIn>(
      'metaDataStatus',
      MetaDataStatusDialogComponent,
      'no-resize',
      closable,
      {
        dialogTitle: dialogTitle,
        userRole: userRole,
        activateMetadataStatusModeCssClass: activateMetadataStatusModeCssClass,
        cancelButtonHtml: cancelButtonHtml,
      },
      {
        width: '30vw'
      }
    ).then((data: DialogData<ConfirmationDataIn, boolean>) => (null != data) && (data.dataOut));
  }

  /**
   * The function `openDetailsDialog` opens a dialog box with details data, positioned relative to a
   * specific element on the page.
   * @param {string} distId - The `distId` parameter is a string that represents the ID of a
   * distribution.
   * @param [width=50vw] - The `width` parameter is used to specify the width of the dialog. It is
   * optional and has a default value of `'50vw'`, which means the width of the dialog will be 50% of the
   * viewport width.
   * @returns a Promise that resolves to either null or an object of type DialogData.
   */
  public openDetailsDialog(
    distId: string,
    context: string,
    domains: Array<Domain>,
    width = '50vw',
  ): Promise<null | DialogData> {

    let elemPosition = document.getElementById('sidenavleft')!.getBoundingClientRect();

    if (elemPosition.right <= 0) {
      elemPosition = document.getElementById('sidenavleftregistry')!.getBoundingClientRect();
    }

    if (elemPosition.right <= 0) {
      elemPosition = document.getElementById('sidenavleftsoftware')!.getBoundingClientRect();
    }

    return this.openDialog<DetailsDataIn>(
      'detailsDialog',
      DetailsDialogComponent,
      'epos-dialog',
      true,
      {
        distId: distId,
        context: context,
        domains: domains,
      },
      {
        width: width,
        position: {
          top: String(elemPosition.top) + 'px',
          left: String(elemPosition.right + 45) + 'px',
        }
      }
    );
  }

  public openDownloadsDialog(
    dataConfigurable: DataConfigurableI | null,
    width: string,
  ): Promise<null | DialogData> {

    let elemPosition = document.getElementById('sidenavleft')!.getBoundingClientRect();

    if (elemPosition.right <= 0) {
      elemPosition = document.getElementById('sidenavleftregistry')!.getBoundingClientRect();
    }

    if (elemPosition.right <= 0) {
      elemPosition = document.getElementById('sidenavleftsoftware')!.getBoundingClientRect();
    }

    return this.openDialog<DetailsDataIn>(
      'downloadsDialog',
      DownloadsDialogComponent,
      'epos-dialog',
      true,
      {
        dataConfigurable,
        environmentOps: false,
      },
      {
        width: width,
        position: {
          top: String(elemPosition.top) + 'px',
          left: String(elemPosition.right + 45) + 'px',
        }
      }
    );
  }

  public openDownloadCitationDialog(
    distributionDetails: DistributionDetails | null,
    citationsToShow: number[],
    width: string,
    left: string
  ): Promise<null | DialogData> {
    return this.openDialog<CitationsDataIn>(
      'citationsDialog',
      CitationDialogComponent,
      'epos-dialog',
      true,
      {
        distributionDetails,
        citationsToShow,
      },
      {
        width: width,
        minWidth: '100px',
        minHeight: '100px',
        position: {
          left: left
        }
      }
    );
  }

  public openAddToEnvDialog(
    dataConfigurable: DataConfigurableI | null,
    width: string,
  ): Promise<null | DialogData> {

    let elemPosition = document.getElementById('sidenavleft')!.getBoundingClientRect();

    if (elemPosition.right <= 0) {
      elemPosition = document.getElementById('sidenavleftregistry')!.getBoundingClientRect();
    }

    if (elemPosition.right <= 0) {
      elemPosition = document.getElementById('sidenavleftsoftware')!.getBoundingClientRect();
    }

    return this.openDialog<DetailsDataIn>(
      'downloadsDialog',
      DownloadsDialogComponent,
      'epos-dialog',
      true,
      {
        dataConfigurable,
        environmentOps: true,
      },
      {
        width: width,
        position: {
          top: String(elemPosition.top) + 'px',
          left: String(elemPosition.right + 45) + 'px',
        }
      }
    );
  }

  public closeDetailsDialog(): void {
    const detailsDialog = this.dialog.getDialogById('detailsDialog');
    if (null != detailsDialog) {
      detailsDialog.close();
    }
  }

  public openParametersDialog(
    distId: string | undefined,
    width: string,
    top: string,
    left: string,
    component: DataConfigurationType = DataConfigurationType.DATA,
    title = 'Title',
  ): Promise<null | DialogData> {

    return this.openDialog<DetailsDataIn>(
      title,
      ParametersDialogComponent,
      'epos-dialog',
      true,
      {
        title: title,
        distId: distId,
        component: component,
      },
      {
        width: width,
        position: {
          top: top,
          left: left
        }
      }
    );
  }

  public environmentManagerDialog(
    environmentSummary?: Environment,
  ): Promise<null | DialogData> {
    return this.openDialog<AddEditEnvironmentDialogDataIn>(
      'AddEditAnalysis',
      CreateEnvironmentFormDialogComponent,
      'epos-dialog',
      false,
      {
        environmentSummary: environmentSummary,
      },
      {
        width: '500px'
      }
    );
  }

  public openDisclaimerDialog(): Promise<null | DialogData> {
    return this.openDialog(
      'Disclaimer',
      DisclaimerDialogComponent,
      'epos-dialog',
    );
  }

  public openCookiesBanner(): Promise<null | DialogData> {
    return this.openDialog(
      'Cookie Policies',
      PoliciesComponent,
      'epos-dialog',
      false
    );
  }

  public openNoMobileDisclaimer(): Promise<null | DialogData> {
    return this.openDialog(
      'noMobileDisclaimer',
      MobileDisclaimerDialogComponent,
      'no-resize',
      false
    );
  }

  public closeNoMobileDisclaimer(): void {
    this.closeDialogById('noMobileDisclaimer');
  }

  public openInformationBanner(
    messageHtml = 'Confirm action',
    closable = true,
    confirmButtonHtml = 'CONTINUE TO THE PLATFORM',
    confirmButtonCssClass = 'confirm',
    cancelButtonHtml = 'Cancel',
  ): Promise<boolean> {
    return this.openDialog<ConfirmationDataIn>(
      'informations',
      InformationsDialogComponent,
      'no-resize',
      closable,
      {
        messageHtml: messageHtml,
        confirmButtonHtml: confirmButtonHtml,
        cancelButtonHtml: cancelButtonHtml,
        confirmButtonCssClass: confirmButtonCssClass,
      },
      {
        width: '600px',
        position: {
          top: '200px'
        }
      }
    ).then((data: DialogData<ConfirmationDataIn, boolean>) => (null != data) && (data.dataOut));
  }

  public closeInformationBanner(): void {
    this.closeDialogById('informations');
  }

  public openVideoGuideDialog(): Promise<null | DialogData> {
    return this.openDialog(
      'videoGuide',
      VideoGuidesDialogComponent,
      'no-resize',
    );
  }

  public openDataProvidersFilter(dataProviders: Array<Organization>,
    dataProvidersSelected: Array<string>,
    title = 'Filter by Data and Service Providers'): Promise<null | DialogData> {

    const widthWindows = window.innerWidth;
    let percWidth = 50;
    if (widthWindows < 2000) {
      percWidth = 80;
    }

    return this.openDialog(
      'dataProviderFilter',
      DataProviderFilterDialogComponent,
      'epos-dialog',
      false,
      {
        dataProviders: dataProviders,
        dataProvidersSelected: dataProvidersSelected,
        title: title,
      },
      {
        width: String(percWidth) + '%',
        height: '650px',
      }
    );
  }

  public openGraphPanel(): void {

    const widthWindows = window.innerWidth;
    let percWidth = 50;
    if (widthWindows < 2000) {
      percWidth = 80;
    }

    void this.openDialog(
      'graphPanel',
      GraphPanelDialogComponent,
      'epos-dialog-resizable',
      true,
      {
        title: 'Graph panel'
      },
      {
        width: String(percWidth) + '%',
        minWidth: '930px',
        minHeight: '470px',
        hasBackdrop: false,
      }
    );
  }

  public openTablePanel(): void {

    const elemPosition = document.getElementById('table-vis-toggle')!.getBoundingClientRect();

    const widthWindows = window.innerWidth;
    let percWidth = 50;
    if (widthWindows < 2000) {
      percWidth = 80;
    }

    void this.openDialog(
      'tablePanel',
      TablePanelDialogComponent,
      'epos-dialog-resizable',
      true,
      {
        title: 'Table panel'
      },
      {
        width: String(percWidth) + '%',
        minHeight: '300px',
        minWidth: '930px',
        hasBackdrop: false,
        position: {
          top: String(elemPosition.top) + 'px',
        }
      }
    );
  }


  /**
   * This function opens a dialog for sharing information with configurable options such as confirm
   * button text and CSS class.
   * @param [step=createUrl] - The `step` parameter in the `openShareInformationBanner` function is
   * used to specify the current step of the process. In this case, the default value is set to
   * `'createUrl'`.
   * @param [confirmButtonHtml=YES] - The `confirmButtonHtml` parameter in the
   * `openShareInformationBanner` function is used to specify the HTML content for the confirm button
   * in the dialog box. In this case, the default value for `confirmButtonHtml` is set to 'LOAD NEW
   * CONFIGURABLES'.
   * @param [confirmButtonCssClass=confirm] - The `confirmButtonCssClass` parameter in the
   * `openShareInformationBanner` function is used to specify the CSS class that will be applied to the
   * "YES" button in the dialog box. In this case, the default CSS class is set to
   * `'confirm'`. This
   * @param [cancelButtonHtml=Cancel] - The `cancelButtonHtml` parameter in the
   * `openShareInformationBanner` function is used to specify the HTML content for the cancel button in
   * the dialog box. In this case, the default value for `cancelButtonHtml` is set to 'Cancel'. This
   * text will be displayed on the cancel button
   * @returns The `openShareInformationBanner` function returns a Promise<boolean>.
   */
  public openShareInformationBanner(
    step = 'createUrl',
    confirmButtonHtml = 'YES',
    confirmButtonCssClass = 'confirm',
    cancelButtonHtml = 'Cancel',
  ): Promise<boolean> {
    return this.openDialog<ConfirmationDataIn>(
      'shareInformations',
      ShareInformationsDialogComponent,
      'no-resize',
      true,
      {
        step: step,
        confirmButtonHtml: confirmButtonHtml,
        cancelButtonHtml: cancelButtonHtml,
        confirmButtonCssClass: confirmButtonCssClass,
      },
      {
        width: '600px',
        position: {
          top: '200px'
        }
      }
    ).then((data: DialogData<ConfirmationDataIn, boolean>) => (null != data) && (data.dataOut));
  }
  public openScientificExamplesDialog(
    confirmButtonHtml = 'Activate Scientific example',
  ): Promise<null | DialogData> {
    return this.openDialog<scientificExamplesDataType>(
      'scientificExamples',
      ScientificExamplesDialogComponent,
      'no-resize',
      true,
      {
        confirmButtonHtml: confirmButtonHtml,
      },
      {
        width: '1090px',
        position: {
          top: '200px',
          right: '50px',
        },
      }
    );
  }

  /** This function opens up the statistics dialog */
  public openStatsDialog() {
    return this.openDialog(
      'statsDialog',
      MatomoStatsDialogComponent,
      'no-resize',
      true,
      {},
      {
        width: '90vw',
        height: '90vh'
      }
    );
  }

  public openCrsIncompatDialog(
    items: WmsCrsIncompat[],
    opts?: { width?: string; closable?: boolean; title?: string; noResize?: boolean }
  ): Promise<boolean> {
    const { width = '600px', closable = true, title, noResize = false } = opts ?? {};
    return this.openDialog<CrsIncompatDataIn>(
      'crsIncompat',
      CrsIncompatDialogComponent,
      noResize ? 'no-resize' : 'epos-dialog',
      closable,
      { items, title, closable },
      { width }
    ).then(data => data != null);
  }

  /**
   * Opens the CRS incompatibility dialog and returns its MatDialogRef so that
   * callers can interact with the component instance (e.g., append layers live).
   * The dialog is opened via BaseDialogService.openDialog to preserve the
   * DialogData contract used by BaseDialogComponent.
   */
  public openCrsIncompatDialogRef(
    items: WmsCrsIncompat[],
    opts?: { width?: string; closable?: boolean; title?: string; noResize?: boolean }
  ): MatDialogRef<CrsIncompatDialogComponent, boolean> | null {
    // Reuse the existing open method to ensure consistent DialogData structure
    void this.openCrsIncompatDialog(items, opts);

    // The dialog opens synchronously; retrieve its ref by id
    return this.dialog.getDialogById('crsIncompat') as MatDialogRef<CrsIncompatDialogComponent, boolean> | null;
  }

  private closeDialogById(dialogId: string): void {
    const dialog = this.dialog.getDialogById(dialogId);
    if (null != dialog) {
      dialog.close();
    }
  }


}
