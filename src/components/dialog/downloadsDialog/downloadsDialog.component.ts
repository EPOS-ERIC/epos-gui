import { AfterContentInit, AfterViewInit, Component, Inject, Injector, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogData } from '../baseDialogService.abstract';
import { DataConfigurableDataSearch } from 'utility/configurablesDataSearch/dataConfigurableDataSearch';
import { PopupProperty } from 'utility/maplayers/popupProperty';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { ExecutionService } from 'services/execution.service';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { DistributionFormat } from 'api/webApi/data/distributionFormat.interface';
import { DistributionDetails } from 'api/webApi/data/distributionDetails.interface';
import { ParameterValue } from 'api/webApi/data/parameterValue.interface';
import { ParameterProperty } from 'api/webApi/data/parameterProperty.enum';
import { DataConfigurableActionType } from 'utility/configurables/dataConfigurableAction';
import { DistributionFormatType } from 'api/webApi/data/distributionFormatType';
import { FeatureCollection } from '@turf/turf';
import { ObjectHelper } from 'utility/maplayers/objectHelper';
import { GeoJSONHelper } from 'utility/maplayers/geoJSONHelper';
import { AuthenticatedClickService } from 'services/authenticatedClick.service';
import { NotificationService } from 'services/notification.service';
import { JsonHelper } from 'utility/maplayers/jsonHelper';
import { Environment } from 'api/webApi/data/environments/environment.interface';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { Subscription } from 'rxjs';
import { AnalysisConfigurablesService } from 'pages/dataPortal/services/analysisConfigurables.service';
import { EnvironmentService } from 'services/environment.service';
import { SimpleEnvironment } from 'api/webApi/data/environments/impl/simpleEnvironment';
import { SimpleEnvironmentResource } from 'api/webApi/data/environments/impl/simpleEnvironmentResource';
import { DialogService } from '../dialog.service';
import { CitationsService } from '../../../services/citations.service';
import { Tracker } from 'utility/tracker/tracker.service';
import { TrackerAction, TrackerCategory } from 'utility/tracker/tracker.enum';

export interface ConfigurableDataIn {
  dataConfigurable: DataConfigurableDataSearch;
  environmentOps: boolean;
}

interface FormatElement {
  name: string;
  position: number;
  format: string;
  originalFormat: string;
  url: string;
  type: string;
  origin: PopupProperty | null;
}

/**
 * General purpose downloads dialog
 */
@Unsubscriber('subscriptions')
@Component({
  selector: 'app-downloads-dialog',
  templateUrl: './downloadsDialog.component.html',
  styleUrls: ['./downloadsDialog.component.scss']
})
export class DownloadsDialogComponent implements OnInit, AfterViewInit, AfterContentInit {

  @ViewChild(MatPaginator, { static: true }) matPaginator: MatPaginator;
  @ViewChild(MatSort) matSort: MatSort;

  public dataSource = new MatTableDataSource<FormatElement>([]);
  public displayedColumns: string[] = ['select', 'name', 'format', 'download', 'copy'];
  public selection = new SelectionModel<FormatElement>(true, []);

  public serviceName = '';
  public spinner = true;
  public hasFeatureTable = true;
  public dataConfigurable: DataConfigurableDataSearch;
  public properties: Array<PopupProperty> = [];

  public onlyDownload = false;
  public isLoading = true;
  public subTitle = 'Files available for download';

  public environmentOps = false;
  public environmentSelected: SimpleEnvironment | null = null;

  public citation: string;

  // Property to identify if we are dealing with Software (Source Code or Application)
  private isSoftware = false;

  // eslint-disable-next-line @typescript-eslint/member-ordering
  protected distributionDetails: DistributionDetails;
  private distributionFormat: Array<DistributionFormat>;
  private parameterValues: Array<ParameterValue>;

  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData<ConfigurableDataIn>,
    private readonly executionService: ExecutionService,
    private readonly http: HttpClient,
    private readonly authentificationClickService: AuthenticatedClickService,
    private readonly notifier: NotificationService,
    private readonly analysisConfigurables: AnalysisConfigurablesService,
    private readonly environmentService: EnvironmentService,
    private readonly injector: Injector,
    private readonly citationService: CitationsService,
    private readonly tracker: Tracker,
  ) {
  }

  public async ngOnInit(): Promise<void> {

    this.dataConfigurable = this.data.dataIn.dataConfigurable;
    this.environmentOps = this.data.dataIn.environmentOps;

    if (this.environmentOps) {
      this.displayedColumns.push('environment');
    }

    this.distributionDetails = this.dataConfigurable.getDistributionDetails();
    this.distributionFormat = this.distributionDetails.getDownloadableFormats();
    this.parameterValues = this.dataConfigurable.currentParamValues;
    this.onlyDownload = this.dataConfigurable.isOnlyDownloadable();

    // 1. Check if the item is a Software type
    const detailsType = this.distributionDetails.getDetailsType();
    this.isSoftware = detailsType === 'software_source_code' || detailsType === 'software_application';

    this.serviceName = this.dataConfigurable.name;

    this.hasFeatureTable = this.distributionDetails.isTabularable;

    this.subscriptions.push(
      this.analysisConfigurables.triggerEnvironmentSelectionObs.subscribe((environment: SimpleEnvironment | null) => {
        this.environmentSelected = environment;
      })
    );

    // 2. Populate the table (Logic differs for Software vs Standard)
    this.getServiceTableData();

    if (this.hasFeatureTable) {

      const distributionFormat = this.getDistributionFormat();

      void this.executionService.executeDistributionFormat(
        this.dataConfigurable.getDistributionDetails(),
        distributionFormat,
        this.dataConfigurable.getParameterDefinitions(),
        this.dataConfigurable.currentParamValues.slice()
      ).then((data: unknown) => {
        if (DistributionFormatType.in(
          distributionFormat.getFormat(), [DistributionFormatType.APP_EPOS_GEOJSON, DistributionFormatType.APP_EPOS_TABLE_GEOJSON]
        )) {

          let index = 0;

          // check there are external_link on featureCollection
          (data as FeatureCollection).features.forEach(feature => {
            const externalLinks = ObjectHelper.getObjectArray<Record<string, unknown>>((feature.properties ?? {}) as Record<string, unknown>, GeoJSONHelper.EXTERNAL_LINK_ATTR);
            const links = JsonHelper.createExternalLinksAsHTMLProperties(externalLinks as Array<Record<string, unknown>>, true, true);
            if (links.length > 0) {

              links.forEach((link: PopupProperty) => {
                this.dataSource.data.push({
                  name: link.authenticatedDownloadFileName !== '' ? link.authenticatedDownloadFileName : link.name,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  format: link.formatType,
                  originalFormat: '',
                  position: index++,
                  url: link.values[0] as string,
                  type: 'feature',
                  origin: link,
                });
              });

            }
          });
        }
      })
        .finally(() => {
          this.dataSource.sort = this.matSort;
          this.dataSource.sortData = (data: Array<FormatElement>, sort: Sort) => this.sortPredicate(data, sort);
          this.dataSource.paginator = this.matPaginator;
          this.spinner = false;
        });
    } else {
      this.spinner = false;
    }

    // Get the citation for this dataset
    this.citation = (await this.citationService.getDatasetCitation(this.distributionDetails)).citation;

    this.isLoading = false;
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.matSort;
    this.dataSource.sortData = (data: Array<FormatElement>, sort: Sort) => this.sortPredicate(data, sort);
    this.dataSource.paginator = this.matPaginator;
  }

  public ngAfterContentInit(): void {
    if (this.environmentOps && this.environmentSelected !== null) {
      this.subTitle = 'Files available to add to Environment ' + this.environmentSelected.name;
    }
  }

  public close(): void {
    this.data.close();
  }

  public isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  public toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.filteredData);
  }


  public checkboxLabel(row?: FormatElement): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  /**
   * The function `download` checks if the given element is a feature and has an origin, and if so, it
   * downloads the feature; otherwise, it downloads the element's format using the download service.
   * @param {MouseEvent} event - The event parameter is of type MouseEvent, which represents a mouse
   * event that occurred. It can be used to access information about the event, such as the target
   * element or the mouse coordinates.
   * @param {FormatElement} elem - The `elem` parameter is of type `FormatElement`.
   */
  public download(event: MouseEvent, elem: FormatElement): void {
    if (this.isElemFeature(elem) && elem.origin !== null) {
      this.downloadFeature(event, elem.origin);
    } else {
      this.downloadService(elem.format);
      this.tracker.trackEvent(TrackerCategory.DISTRIBUTION, TrackerAction.DOWNLOAD, this.formatTrackerDistributionName(this.distributionDetails) + Tracker.TARCKER_DATA_SEPARATION + elem.name + Tracker.TARCKER_DATA_SEPARATION + elem.format);
    }
  }

  /**
   * The function `copyUrl` copies the URL of a given `FormatElement` object, either from its `url`
   * property if it is a feature, or from its `originalFormat` property if it is a service.
   * @param {FormatElement} elem - The `elem` parameter is of type `FormatElement`.
   */
  public copyUrl(elem: FormatElement): void {
    if (this.isElemFeature(elem)) {
      this.copyUrlFeature(elem.url);
    } else {
      this.copyUrlService(elem.format);
      this.tracker.trackEvent(TrackerCategory.DISTRIBUTION, TrackerAction.COPY_URL, this.formatTrackerDistributionName(this.distributionDetails) + Tracker.TARCKER_DATA_SEPARATION + elem.name + Tracker.TARCKER_DATA_SEPARATION + elem.originalFormat);

    }
  }

  /**
   * The function `addToEnv` adds a new resource to the selected environment.
   * Updates logic to handle Software types by using direct URLs.
   * @param {FormatElement} elem - The `elem` parameter is of type `FormatElement`.
   */
  public addToEnv(elem: FormatElement): void {

    this.spinner = true;

    void new Promise<string>((resolve) => {
      // CASE 1: It's a Feature (e.g. GeoJSON feature link)
      if (this.isElemFeature(elem)) {
        resolve(elem.url);
      } else {

        // CASE 2: SOFTWARE LOGIC
        // For software, we already extracted the direct download URL in 'getServiceTableData'.
        // We resolve it immediately without calling external services.
        if (this.isSoftware) {
          resolve(elem.url);
        } else {

          // CASE 3: STANDARD LOGIC (Web Service)
          // We need to set the output format parameter and fetch the URL from the originator.
          const paramOutput = this.getOutputFormatParam();

          // set new format
          if (paramOutput !== undefined) {
            paramOutput.value = elem.originalFormat;
          }

          // Retrieve via Originator URL (asynchronous)
          void this.dataConfigurable.getOriginatorUrl().then((url) => {
            resolve(url || ''); // Resolve with url or empty string safety
          });
        }
      }
    }).then((urlToAdd: string) => {

      if (this.environmentSelected !== null) {
        const resources = this.environmentSelected?.getResources();

        if (resources !== undefined) {
          // Create the new resource object
          resources.push(
            SimpleEnvironmentResource.make(
              this.dataConfigurable.id,
              `${this.dataConfigurable.name} - ${elem.name}`, // Description format
              `Dataset in format ${elem.format} for ${this.dataConfigurable.name}`,
              elem.format,
              urlToAdd, // The resolved URL (Direct or Originator)
            )
          );

          // Save changes to the backend service
          void this.environmentService.updateResourcesToEnvironment(this.environmentSelected, resources)
            .then((updatedSummary: Environment) => {
              this.environmentService.refreshEnvs.emit(); // Notify app to refresh env list
              this.spinner = false;
              this.data.close(); // Close dialog on success
            }).catch(() => {
              this.notifier.sendErrorNotification('An error occured updating the environment, please try again.');
              this.spinner = false;
            });
        }
      }
    }).catch(() => {
      this.notifier.sendErrorNotification('An error occured updating the environment, please try again.');
      this.spinner = false;
      this.data.close();
    });
  }

  public downloadUrls(): void {

    const paramOutput = this.getOutputFormatParam();
    const promiseArray: Array<Promise<FormatElement>> = [];

    this.spinner = true;

    this.selection.selected.forEach(elem => {

      if (elem.type !== 'CONVERTED') {

        // Update parameter only for standard web services
        if (paramOutput !== undefined && !this.isSoftware) {
          paramOutput.value = elem.originalFormat;

        }

        promiseArray.push(
          this.getCsvElement(elem)
        );
      }

    });

    void Promise.all(promiseArray).then(results => {
      this.downloadFile(results, this.serviceName.replace(/\s/g, ''));
      this.spinner = false;
    });

  }

  /**
   * It loops through the selected rows and calls the download function for each one.
   */
  public downloadSelected(event: MouseEvent): void {
    this.spinner = true;
    // fake deplay
    setTimeout(() => {
      this.selection.selected.forEach(elem => {
        this.download(event, elem);
      });

      this.spinner = false;
    }, 1000);
  }


  /**
   * The function clears the selection, waits 100 milliseconds, and then sets the dataSource's filter to
   * the value of the input element
   * @param {KeyboardEvent} event - KeyboardEvent - This is the event that is triggered when the user
   * types in the search box.
   */
  public applyFilter(event: KeyboardEvent): void {
    this.selection.clear();
    setTimeout(() => {
      this.dataSource.filter = String((event.target as HTMLInputElement).value).trim().toUpperCase();
    }, 100);
  }

  public openCitationDialog(): void {
    // We have to inject here instead of the constructor to avoid circular dependencies
    const dialogService = this.injector.get(DialogService);

    // Get element position with fallbacks
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let elemPosition = document.getElementById('sidenavleft')!.getBoundingClientRect();

    if (elemPosition.right <= 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      elemPosition = document.getElementById('sidenavleftregistry')!.getBoundingClientRect();
    }

    if (elemPosition.right <= 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      elemPosition = document.getElementById('sidenavleftsoftware')!.getBoundingClientRect();
    }

    // Open the dialog
    void dialogService.openDownloadCitationDialog(
      this.distributionDetails,
      [0],
      '50vw',
      String(elemPosition.right + 45) + 'px',
    );
  }

  /**
   * Copies the plain text content of a citation to the clipboard.
   * This method parses the provided HTML string, extracts its visible text content,
   * and copies it using the Clipboard API, excluding any HTML tags or formatting.
   *
   * @param {string} htmlString - The citation content as an HTML string.
   *                              The method will strip tags and copy only the visible text.
   */
  public copyCitationToClipboard(htmlString: string): void {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString.replace(/<br\s*\/?>/gi, '\n');

    const plainText = (tempDiv.textContent || tempDiv.innerText || '').trim();

    navigator.clipboard.writeText(plainText).then(() => {
      console.log('Citation copied to clipboard.');
    }).catch(err => {
      console.error('Failed to copy citation:', err);
    });
  }




  /**
   * This function retrieves a distribution format based on certain conditions and returns the format.
   * @returns The `getDistributionFormat` method returns a `DistributionFormat` object based on certain
   * conditions. If the `distributionFormat` is undefined and the `distributionDetails` is mappable, it
   * returns the first format from the mappable formats. If the `distributionFormat` is undefined and
   * the `distributionDetails` is graphable, it returns the first format from the graphable formats.
   * Otherwise, it
   */
  private getDistributionFormat(): DistributionFormat {
    const distributionFormat = this.dataConfigurable.getDistributionDetails().getTabularableFormats()[0];
    if (this.distributionDetails.isMappable && distributionFormat === undefined) {
      return this.dataConfigurable.getDistributionDetails().getMappableFormats()[0];
    } else if (this.distributionDetails.isGraphable && distributionFormat === undefined) {
      return this.dataConfigurable.getDistributionDetails().getGraphableFormats()[0];
    }
    return distributionFormat;
  }

  /**
   * It copies the URL of the current page to the clipboard
   * @param {string} format - The format of the output.
   */
  private copyUrlService(format: string): void | string {

    // SOFTWARE LOGIC: Copy direct URL
    if (this.isSoftware) {
      const distributionFormat = this.distributionFormat.find(e => { return e.getFormat() === format; });
      if (distributionFormat && distributionFormat.getUrl()) {
        this.copyUrlFeature(distributionFormat.getUrl());
        return;
      }
    }

    // STANDARD LOGIC: Use parameter and ActionType.LINK
    const paramOutput = this.getOutputFormatParam();

    if (paramOutput !== undefined) {
      paramOutput.value = format;
    }

    const copyAction = this.dataConfigurable.actions.find(a => a.type === DataConfigurableActionType.LINK);
    copyAction?.doAction();

  }

  private copyUrlFeature(url: string | null): void | string {
    if (null != url) {
      setTimeout(() => {
        let success = false;
        try {
          success = this.copyToClipboard(url);
        } finally {
          if (success) {
            this.notifier.sendNotification('Successfully copied URL', 'x', 'success', 5000);
          } else {
            this.notifier.sendNotification('Failed to copy URL', 'x', 'error', 5000);
          }
        }
      }, 100);
    }
  }

  private copyToClipboard(val: string): boolean {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    const success = document.execCommand('copy');
    document.body.removeChild(selBox);
    return success;
  }

  /**
   * The function downloads the data from the distribution if the format is available, otherwise it
   * downloads the data from the originator URL
   */
  private downloadService(format: string): void {

    const distributionFormat = this.distributionFormat.find(e => { return e.getFormat() === format; });

    // SOFTWARE LOGIC: Forced Download via Blob
    // This avoids opening files like .py or .ipynb in a new tab/browser view.
    if (this.isSoftware && distributionFormat !== undefined) {
      const directUrl = distributionFormat.getUrl();
      if (directUrl) {

        this.spinner = true;

        // 1. Fetch file content as blob
        this.http.get(directUrl, { responseType: 'blob' }).subscribe(
          (blob) => {
            // 2. Extract filename from URL
            const filename = this.getFilenameFromUrl(directUrl);

            // 3. Trigger download via ExecutionService
            this.executionService.openDownload(blob, filename);

            this.spinner = false;
          },
          (error) => {
            // Fallback: If CORS blocks the blob download, open in new tab
            console.warn('Direct blob download failed (CORS likely), falling back to window.open', error);
            window.open(directUrl, '_blank');
            this.spinner = false;
          }
        );
        return;
      }
    }

    // STANDARD LOGIC
    if (distributionFormat !== undefined && !this.isSoftware) {
      // download from distribution via execution service
      const paramValues = (null === this.parameterValues) ? [] : this.parameterValues;
      this.executionService.downloadDistributionFormat(this.distributionDetails, distributionFormat, paramValues, true);
    } else {
      // download from URL (default output format)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      void this.dataConfigurable.getOriginatorUrl().then(url => {
        if (url !== null) {
          this.http.get(url, { responseType: 'blob' }).subscribe((blob) => {
            this.executionService.openDownload(blob, 'raw_service_response_' + this.serviceName);
          });
        }
      });
    }
  }


  private downloadFeature(event: MouseEvent, item: PopupProperty): void {
    event.preventDefault();
    GeoJSONHelper.popupClick(event, this.executionService, this.authentificationClickService, item);
  }


  /**
   * It returns a promise that resolves to a `FormatElement` object
   */
  private getCsvElement(elem: FormatElement): Promise<FormatElement> {
    const promise: Promise<FormatElement> = new Promise((resolve) => {

      if (this.isElemFeature(elem)) {
        resolve(elem);
      } else {

        // SOFTWARE LOGIC: Resolve immediately with the direct URL
        if (this.isSoftware) {
          const result = {
            name: elem.name,
            position: elem.position,
            format: elem.format,
            originalFormat: elem.originalFormat,
            url: elem.url, // Directly available
            type: elem.type,
            origin: null,
          };
          resolve(result);
        } else {
          // STANDARD LOGIC: Resolve via getOriginatorUrl promise
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          void (this.dataConfigurable.getOriginatorUrl() as Promise<null | string>).then((url) => {
            const result = {
              name: '',
              position: 0,
              format: elem.format,
              originalFormat: elem.originalFormat,
              url: url ?? '',
              type: '',
              origin: null,
            };
            resolve(result);
          });
        }
      }
    });

    return promise;
  }

  private isElemFeature(elem: FormatElement): boolean {
    return elem.type === 'feature' && elem.origin !== null;
  }

  /**
   * Populates the table data.
   * - Software: Parses URL for filename and format.
   * - Standard: Uses generic naming and empty URL (fetched later).
   */
  private getServiceTableData(): void {

    if (this.distributionFormat.length > 0) {
      this.distributionFormat.map((e, index) => {

        // For software, extract the direct download URL
        const url = this.isSoftware ? (e.getUrl() || '') : '';

        if (e.getType().toLowerCase() === 'converted') {
          this.dataSource.data.push({
            name: 'converted response',
            format: e.getFormat(),
            originalFormat: e.getOriginalFormat(),
            position: index,
            url: url,
            type: e.getType(),
            origin: null
          });
          this.dataSource.data.push({
            name: 'raw service response',
            format: e.getOriginalFormat(),
            originalFormat: e.getOriginalFormat(),
            position: index,
            url: url,
            type: 'original',
            origin: null
          });
        }
        else {
          this.dataSource.data.push({
            name: 'raw service response',
            format: e.getOriginalFormat(),
            originalFormat: e.getOriginalFormat(),
            position: index,
            url: url,
            type: 'original',
            origin: null
          });
        }
      });
    }
  }

  /**
   * Extracts the filename from a URL, handling "raw" URLs
   * (e.g., GitHub, GitLab API).
   */
  private getFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      let pathname = urlObj.pathname;

      // Handles GitLab API URLs that end in /raw
      if (pathname.endsWith('/raw')) {
        pathname = pathname.substring(0, pathname.lastIndexOf('/raw'));
      }

      // Takes the last segment of the path
      const lastSegment = pathname.substring(pathname.lastIndexOf('/') + 1);

      // Decodes URL characters (e.g., %2F -> /, %2B -> +)
      const decodedSegment = decodeURIComponent(lastSegment);

      // If the decoded segment is still a path, take the last part
      const finalFilename = decodedSegment.substring(decodedSegment.lastIndexOf('/') + 1);

      return finalFilename || 'download';

    } catch (e) {
      console.error('Error while parsing filename from URL:', e);
      return 'download';
    }
  }

  private getOutputFormatParam(): ParameterValue | undefined {
    const parameterDefinitions = this.dataConfigurable.getParameterDefinitions();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const outputFormatParameter = parameterDefinitions.getParameterByProperty(ParameterProperty.OUTPUT_FORMAT as ParameterProperty);

    if (outputFormatParameter !== undefined) {

      // retrieve parameter name
      // eslint-disable-next-line max-len
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const outputFormatFromFieldName = parameterDefinitions.getParameterByProperty(ParameterProperty.OUTPUT_FORMAT).name;

      return this.parameterValues.find(param =>
        param.name === outputFormatFromFieldName
      );
    }
  }

  private sortPredicate(data: Array<FormatElement>, sort: Sort): Array<FormatElement> {

    let sortedData = data.slice();

    if (sort.active && sort.direction !== '') {
      sortedData = data.sort((a: FormatElement, b: FormatElement) => {
        const isAsc = (sort.direction === 'asc');
        const sortName = sort.active;
        const propA = (a[sortName] as string).toUpperCase();
        const propB = (b[sortName] as string).toUpperCase();

        let isALessThanB: boolean;
        switch (true) {
          case (null == propA): // Test for null values
            isALessThanB = true;
            break;
          case (null == propB): // Test for null values
            isALessThanB = false;
            break;
          default: // default tests primative string value
            isALessThanB = propA < propB;
            break;
        }
        return (isALessThanB ? -1 : 1) * (isAsc ? 1 : -1);
      });
    }
    return sortedData;
  }

  /**
   * It takes an array of objects, converts it to a CSV string, and then downloads it
   * @param data - Array<FormatElement> - this is the data that will be converted to CSV
   * @param [filename=data] - The name of the file to be downloaded.
   */
  private downloadFile(data: Array<FormatElement>, filename = 'data'): void {
    const csvData = this.convertToCSV(data, ['format', 'url']);
    const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });

    this.executionService.openDownload(blob, filename);
  }

  /**
   * It takes an array of objects and an array of strings as parameters and returns a string
   * @param objArray - The array of objects that you want to convert to CSV.
   * @param headerList - Array of strings that are the headers of the CSV file.
   * @returns A string
   */
  private convertToCSV(objArray: Array<FormatElement>, headerList: Array<string>) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const array: Array<FormatElement> = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    const separator = ';';
    let str = '';
    let row = '';

    headerList.forEach((e, i) => {
      row += e + separator;
    });
    row = row.slice(0, -1);
    str += row + '\r\n';

    array.forEach((e, i) => {
      let line = '';
      headerList.forEach((h, hi) => {
        if (hi > 0) {
          line += separator;
        }
        line += (array[i][h] as string);
      });
      str += line + '\r\n';
    });
    return str;
  }

  private formatTrackerDistributionName(distDetail: DistributionDetails): string {
    return distDetail.getDomainCode() + Tracker.TARCKER_DATA_SEPARATION + distDetail.getName();
  }

}
