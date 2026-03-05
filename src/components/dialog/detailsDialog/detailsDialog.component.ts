import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogData } from '../baseDialogService.abstract';
import { DistributionDetails } from 'api/webApi/data/distributionDetails.interface';
import { TemporalRange } from 'api/webApi/data/temporalRange.interface';
import { DialogService } from '../dialog.service';
import { MatTableDataSource } from '@angular/material/table';
import { SpatialRange } from 'api/webApi/data/spatialRange.interface';
import { TourService } from 'services/tour.service';
import { DataProvider } from 'api/webApi/data/dataProvider.interface';
import { AuthenticatedClickService } from 'services/authenticatedClick.service';
import { SearchService } from 'services/search.service';
import { DistributionCategories } from 'api/webApi/data/distributionCategories.interface';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { Subscription } from 'rxjs';
import { Domain } from 'api/webApi/data/domain.interface';
import { CONTEXT_FACILITY, CONTEXT_RESOURCE } from 'api/api.service.factory';
import { Popover } from 'driver.js';
import { environment } from 'environments/environment';

export interface DetailsDataIn {
  distId: string;
  context: string;
  domains: Array<Domain>;
}

/**
 * General purpose details dialog
 */
@Component({
  selector: 'app-details-dialog',
  templateUrl: './detailsDialog.component.html',
  styleUrls: ['./detailsDialog.component.scss'],
})
export class DetailsDialogComponent implements OnInit, AfterViewInit, OnDestroy {

  public nullDataString = 'Unspecified';
  public nullDataHtml: string;
  public detailsData: DistributionDetails | undefined;
  public disableDoiButton: boolean;
  public displayColumns = ['key', 'value'];
  public spatialRange: SpatialRange;
  public showMap = true;
  public dataSourceCategories = new MatTreeNestedDataSource<DistributionCategories>();
  public treeControlCategories = new NestedTreeControl<DistributionCategories>(node => node.children);

  public dataSource: MatTableDataSource<KeyValue>;
  public dataService: MatTableDataSource<KeyValue>;
  public dataProvider: MatTableDataSource<DataProvider>;

  public hasContactUsButton = true;
  public readonly showFairAssessment = environment.showFairAssessment;

  public webPageUrl: string | null = null;

  public context = CONTEXT_RESOURCE;

  public readonly CONTEXT_RESOURCE = CONTEXT_RESOURCE;

  /**
   * The citations to show in the citation component for this dialog
   */
  public citationsToShow: number[] = [];

  private domains: null | Array<Domain> = null;
  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData<DetailsDataIn>,
    private readonly dialogService: DialogService,
    private readonly tourService: TourService,
    private readonly authService: AuthenticatedClickService,
    private readonly searchService: SearchService,
    private readonly localStoragePersister: LocalStoragePersister,
  ) {
    this.nullDataHtml = '<i>' + this.nullDataString + '</i>';
  }

  public ngOnInit(): void {

    this.context = this.data.dataIn.context;
    this.domains = this.data.dataIn.domains;


    // Set the citations to show in the citation component based on the context
    this.citationsToShow = this.getCitationsToShow();

    void this.searchService.getDetailsById(this.data.dataIn.distId, this.context)
      .then((distributionDetails: DistributionDetails) => {
        this.detailsData = distributionDetails;
        if (this.detailsData !== undefined) {
          this.updateTable();
          setTimeout(() => {
            // resizes tour highlight mode when data is loaded.
            this.tourService.triggerRefresh();
          }, 100);
        }
      }).catch((e) => {
        this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, '', false, LocalStorageVariables.LS_LAST_DETAIL_DIALOG_ID);

        this.data.close();
      });
  }

  public ngAfterViewInit(): void {
    this.addDetailsTourStep();

    setTimeout(() => {
      this.treeControlCategories.expandAll();
    }, 500);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => {
      s.unsubscribe();
    });
  }

  public addDetailsTourStep(): void {
    const detailsDialog = document.getElementById('detailsTourId') as HTMLElement;
    const tourName = 'EPOS Overview';
    const options: Popover = {
      title: `<span class="tour-title"><strong>Tour:</strong> ${tourName}</span>Details Panel`,
      description: 'This dialog contains details about the service.',
      side: 'left',
    };
    if (null != detailsDialog) {
      this.tourService.addStep(tourName, detailsDialog, options, 15, true);

      this.subscriptions.push(
        this.tourService.tourStepForwardObservable.subscribe((value: ElementRef<HTMLElement>) => {
          if (value.nativeElement.id === 'detailsTourId') {
            this.dialogService.closeDetailsDialog();
          }
        }),
        this.tourService.tourStepBackwardObservable.subscribe((value: ElementRef<HTMLElement>) => {
          if (value.nativeElement.id === 'detailsTourId') {
            this.tourService.triggerHandleCloseNotification();
            this.tourService.triggeradvancedSerachItemSelected();
            this.tourService.triggerAddInfoIconStep();
            this.dialogService.closeDetailsDialog();
          }
        }),
      );
    }
  }


  public close(): void {
    this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, '', false, LocalStorageVariables.LS_LAST_DETAIL_DIALOG_ID);

    this.data.close();
  }

  public openSendEmailForm(): void {
    if (this.detailsData !== undefined) {
      this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, this.detailsData.getIdentifier(), false, LocalStorageVariables.LS_LAST_DETAIL_DIALOG_ID);

      if (this.authService.authenticatedContactForm()) {
        // if logged in
        void this.dialogService.openContactFormDialog(this.detailsData.getIdentifier());
      }
    }
  }

  public hasChildCategories = (_: number, node: DistributionCategories) => !!node.children && node.children.length > 0;

  public openFairnessDetails(): void {
    if (!this.showFairAssessment) {
      return;
    }

    const id = this.detailsData?.getIdentifier();
    const url = `${environment.fairAssessmentUrl}details/${id}`;

    if (this.isStaging()) {
      const devUrl = 'https://ics-c.epos-ip.org/development/k8s-epos-deploy/latest/';

      void this.dialogService.openConfirmationDialog(
        `<p> ⚠ </p>
        <p><strong>This feature is not currently available in <em>staging</em>.</strong></p>
        <p>You can use it in the <strong>develop</strong> environment instead.</p>`,
        true,                 // closable
        'GO TO DEVELOP',      // confirm button text
        'confirm',            // confirm button CSS class
        'Cancel'              // cancel button text
      ).then(go => {
        if (go === true) {
          window.location.href = devUrl;
        } else {
          console.log('User cancelled or closed the dialog');
        }
      });

      return;
    }

    window.open(url, '_blank');
  }

/**
   * Main function to update the details table.
   * It acts as a dispatcher: it checks the item type and delegates
   * the population of the table to specific helper functions.
   */
  private updateTable() {
    const tableData = new Array<KeyValue>();
    const tableService = new Array<KeyValue>();
    const tableProvider = new Array<DataProvider>();

    const itemDetails = this.detailsData;

    if (null != itemDetails) {
      // 1. Common Logic: Handle Contact Us button visibility
      this.configureContactButton(itemDetails);

      // 2. Identify the specific type of the item
      const detailsType = itemDetails.getDetailsType();
      const isSoftwareSourceCode = detailsType === 'software_source_code';
      const isSoftwareApplication = detailsType === 'software_application';
      const isSoftware = isSoftwareSourceCode || isSoftwareApplication;

      // 3. Delegation Logic
      if (isSoftware) {
        // CASE A: It is a Software (Source Code or Application)
        // Uses the NEW logic (Combined IDs, filtered fields)
        this.populateSoftwareData(
          itemDetails,
          tableData,
          tableProvider,
          isSoftwareSourceCode,
          isSoftwareApplication
        );
      } else {
        // CASE B: Standard Logic (Web Service, Facility, etc.)
        // Uses the ORIGINAL logic exactly as requested
        this.populateStandardData(
          itemDetails,
          tableData,
          tableService,
          tableProvider
        );
      }
    }

    // 4. Update the DataSources
    this.dataSource = new MatTableDataSource(tableData);
    this.dataService = new MatTableDataSource(tableService);
    this.dataProvider = new MatTableDataSource<DataProvider>(tableProvider);
  }

  /**
   * Helper function to determine if the "Contact Us" button should be displayed.
   */
  private configureContactButton(itemDetails: DistributionDetails) {
    // Matches the original logic: check if length is 0
    if (itemDetails.getAvailableContactPoints().length === 0) {
      this.hasContactUsButton = false;
    } else {
      this.hasContactUsButton = true;
    }
  }

  /**
   * Handles the table population specifically for Software items.
   * Logic:
   * - Hides: Spatial, Temporal, Update Frequency, Quality Assurance, Facility Type.
   * - Maps: Specific fields for Source Code vs Application.
   */
  private populateSoftwareData(
    itemDetails: DistributionDetails,
    tableData: Array<KeyValue>,
    tableProvider: Array<DataProvider>,
    isSourceCode: boolean,
    isApplication: boolean
  ) {
    const alt = this.nullDataHtml;

    // --- A. Base Fields (Always visible for software) ---
    tableData.push(this.makeKeyValue('Name', this.stringOrElse(itemDetails.getName(), alt)));
    tableData.push(this.makeKeyValue('Domain', this.stringOrElse(itemDetails.getDomain(), alt)));

    this.getCategories();
    tableData.push(this.makeKeyValue('Categories', ''));

    tableData.push(this.makeKeyValue('Description', this.stringOrElse(itemDetails.getDescription(), alt)));

    // --- B. Identifiers and License ---
    tableData.push(this.makeKeyValue('Persistent Identifier(s)', this.stringOrElse(this.getDOIAsLink(itemDetails), alt)));
    tableData.push(this.makeKeyValue('License', this.stringOrElse(itemDetails.getLicense(), alt)));
    tableData.push(this.makeKeyValue('Keywords', this.stringOrElse(this.getJoinedKeywords(itemDetails), alt)));

    // --- C. Software Specific Details ---
    const mainPage = itemDetails.getMainEntityofPage();
    const version = itemDetails.getSoftwareVersion();
    const requirements = itemDetails.getRequirements();
    const creators = itemDetails.getCreator();

    tableData.push(this.makeKeyValue('Version', this.stringOrElse(version, alt)));
    tableData.push(this.makeKeyValue('Web Page', this.stringOrElse(mainPage, alt)));
    tableData.push(this.makeKeyValue('Requirements', this.stringOrElse(requirements.join('; '), alt)));
    tableData.push(this.makeKeyValue('Creator(s)', this.stringOrElse(creators.join('; '), alt)));

    // --- D. Differentiated Logic: Source Code vs Application ---
    if (isSourceCode) {
      // Logic for 'software_source_code'
      const codeRepo = itemDetails.getCodeRepository();
      const progLang = itemDetails.getProgrammingLanguage();
      const platforms = itemDetails.getRuntimePlatform();

      // Mapping: Code Repository -> Download URL
      tableData.push(this.makeKeyValue('Download URL', this.stringOrElse(codeRepo, alt)));
      tableData.push(this.makeKeyValue('Programming Language', this.stringOrElse(progLang.join('; '), alt)));
      tableData.push(this.makeKeyValue('Runtime Platform', this.stringOrElse(platforms.join('; '), alt)));

    } else if (isApplication) {
      // Logic for 'software_application'
      const downloadUrl = itemDetails.getDownloadURL();
      // Assumption: The Factory mapped 'operatingSystem' into 'runtimePlatform'
      const os = itemDetails.getRuntimePlatform();

      tableData.push(this.makeKeyValue('Download URL', this.stringOrElse(downloadUrl, alt)));
      tableData.push(this.makeKeyValue('Operating System', this.stringOrElse(os.join('; '), alt)));
    }

  }

  /**
   * Handles the table population for Standard items (Facilities, Web Services, Files).
   * This preserves the original logic provided.
   */
  private populateStandardData(
    itemDetails: DistributionDetails,
    tableData: Array<KeyValue>,
    tableService: Array<KeyValue>,
    tableProvider: Array<DataProvider>
  ) {
    const alt = this.nullDataHtml;
    let isWebService: boolean;

    if (typeof itemDetails.getType() === 'string') {
      // this distribution is a facility/equipment
      isWebService = false;
    } else {
      // this distribution is a web service/downloadable file
      isWebService = true;
    }

    // 1. Name
    tableData.push(this.makeKeyValue('Name', this.stringOrElse(itemDetails.getName(), alt)));

    // 2. Domain (Separate row, as per original)
    tableData.push(this.makeKeyValue('Domain', this.stringOrElse(itemDetails.getDomain(), alt)));

    // 3. Categories (Populates tree, table row is empty, as per original)
    this.getCategories();
    tableData.push(this.makeKeyValue('Categories', ''));

    // 4. Facility Type
    if (!isWebService) {
      tableData.push(this.makeKeyValue('Facility Type', this.stringOrElse(itemDetails.getType() as string, alt)));
    }

    // 5. Description
    tableData.push(this.makeKeyValue('Description', this.stringOrElse(itemDetails.getDescription(), alt)));

    // 6. Spatial
    tableData.push(this.makeKeyValue(!isWebService ? 'Location' : 'Spatial Coverage', this.getSpatialValue(itemDetails)));

    // 7. Temporal
    if (isWebService) {
      tableData.push(this.makeKeyValue('Temporal Coverage', this.getTemporalValue(itemDetails)));
    }

    // 8. Persistent Identifiers (Uses standard DOI link only, as per original)
    tableData.push(this.makeKeyValue('Persistent Identifier(s)', this.stringOrElse(this.getDOIAsLink(itemDetails), alt)));

    // 9. License
    if (isWebService) {
      tableData.push(this.makeKeyValue('License', this.stringOrElse(itemDetails.getLicense(), alt)));
    }

    // 10. Keywords
    tableData.push(this.makeKeyValue('Keywords', this.stringOrElse(this.getJoinedKeywords(itemDetails), alt)));

    // 11. Update Frequency
    if (isWebService) {
      tableData.push(this.makeKeyValue('Update Frequency', this.stringOrElse(itemDetails.getFrequencyUpdate(), alt)));
    }

    // 12. Quality Assurance
    if (itemDetails.getQualityAssurance() !== '') {
      tableData.push(this.makeKeyValue('Quality Assurance', this.stringOrElse(itemDetails.getQualityAssurance(), '')));
    } else {
      tableData.push(this.makeKeyValue('Quality Assurance', this.stringOrElse(itemDetails.getQualityAssurance(), alt)));
    }

    // 13. Providers
    tableData.push(this.makeKeyValue(!isWebService ? 'Organization(s)' : 'Data Provider(s)', ''));
    itemDetails.getDataProvider().forEach((provider) => {
      tableProvider.push(provider);
    });

    // 14. Further Information
    let furtherInformation = '';
    if (isWebService) {
      furtherInformation = this.stringOrElse(this.getDomainLink(), alt);
    } else if (!isWebService) {
      if (itemDetails.getPage() !== undefined) {
        furtherInformation = this.stringOrElse(itemDetails.getPage().join('<br />'), alt);
      }
    }
    tableData.push(this.makeKeyValue('Further information', furtherInformation));

    // 15. Web Service Details / Download URL
    if (isWebService) {
      if (itemDetails.isOnlyDownloadable) { // it is a downloadable file
        tableData.push(this.makeKeyValue('Download URL', this.stringOrElse(itemDetails.getDownloadURL(), alt)));
      } else {
        tableService.push(this.makeKeyValue('Service Name', this.stringOrElse(itemDetails.getWebServiceName(), alt)));
        tableService.push(this.makeKeyValue('Service Description', this.stringOrElse(itemDetails.getWebServiceDescription(), alt)));

        const serviceProvider = itemDetails.getWebServiceProvider();
        tableService.push(this.makeKeyValue('Service Provider', serviceProvider));

        tableService.push(this.makeKeyValue('Service Endpoint', this.stringOrElse(itemDetails.getWebServiceEndpoint(), alt)));
        tableService.push(this.makeKeyValue('Service Documentation', this.stringOrElse(itemDetails.getDocumentation(), alt)));
      }
    }
  }

  /**
   * Returns the citation to show based on the panel that was used to open the details popup:
   * - Registry: show only the second citation
   * - Data: show the first, second and third citation
   * @returns {number[]} - An array of numbers that represent the citation to be shown in the citation component
   */
  private getCitationsToShow(): number[] {
    if (this.context === CONTEXT_FACILITY) {
      return [1];
    }
    return [0, 1, 2];
  }

  private getDomainLink(): string | null {
    if (this.detailsData !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const domainName = this.detailsData.getDomain();
      if (domainName !== undefined && this.domains !== null) {
        const domain: Domain | undefined = this.domains.find((d) => d.title !== undefined && d.title.toLowerCase() === domainName.toLowerCase());
        if (domain !== undefined) {
          return domain.linkUrl ?? '';
        }
      }
    }
    return null;
  }

  private getCategories(): void {
    if (this.detailsData !== undefined) {
      const categories = this.detailsData.getCategories();
      if (categories?.children !== undefined) {
        this.dataSourceCategories.data = categories?.children[0].children;
        // work arround to avoid an undefined dataNodes even after ViewInit
        this.treeControlCategories.dataNodes = categories?.children[0].children;
      }
    }
  }

  private makeKeyValue(key: string, value: unknown): KeyValue {
    return {
      key: key,
      value: value,
    };
  }

  private getTemporalValue(itemDetails: DistributionDetails): string {
    const temporalRange: TemporalRange = itemDetails.getTemporalRange();
    const unspecified = this.nullDataHtml;

    if (temporalRange == null || temporalRange.isUnbounded()) {
      return unspecified;
    } else {
      const upper = itemDetails.getTemporalRange().getUpperBound();
      const lower = itemDetails.getTemporalRange().getLowerBound();
      const momentFormat = 'YYYY-MM-DD HH:mm:ss';
      const upperString = (null != upper) ? upper.format(momentFormat) : '<i> till present </i>';
      const lowerString = (null != lower) ? lower.format(momentFormat) : unspecified;
      return lowerString + ' - ' + upperString;
    }
  }

  /**
   * Returns the Spatial value
   */
  private getSpatialValue(itemDetails: DistributionDetails): string {

    // Get the spatial range
    const spatialRange = itemDetails.getSpatialRange();
    this.spatialRange = spatialRange;
    // Spatial rows
    if (spatialRange != null && spatialRange.isBounded()) {
      return '<i>Bounded</i>';
    } else if (spatialRange != null && spatialRange.isUnbounded()) {
      return '<i>Global</i>';
    } else {
      this.showMap = false;
      return this.nullDataHtml;
    }
  }

  private stringOrElse(value: undefined | null | string, alternative: string): string {
    return (value === null || value === undefined) ? alternative : value.trim().length === 0 ? alternative : value.trim();
  }

  private getDOIAsLink(itemDetails: DistributionDetails): string {
    this.disableDoiButton = true;
    const DOIArray = itemDetails.getDOI();
    let DOILink = '';
    if (DOIArray.length > 0) {
      DOIArray.forEach((doi, index) => {
        DOILink += '<a href="https://doi.org/' + doi + '" target="_blank">' + doi + '</a><br />';
      });
    }
    return DOILink;
  }

  private getJoinedKeywords(itemDetails: DistributionDetails): null | string {
    let joined: null | string = null;
    const providers: Array<string> = itemDetails.getKeywords();
    if (providers != null && providers.length > 0) {
      joined = providers.join('; ');
    }
    return joined;
  }


  private isStaging(): boolean {
    const host = window.location.host.toLowerCase();

    // Check explicitly for your staging host
    if (host === 'epos-ics-c-staging.brgm-rec.fr') {
      return true;
    }

    // Or fallback: consider any host containing "staging" as staging
    return host.includes('staging');
  }

}

interface KeyValue {
  key: string;
  value: unknown;
}
