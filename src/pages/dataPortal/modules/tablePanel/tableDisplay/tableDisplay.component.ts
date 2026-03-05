import { Component, OnInit, Input, ViewChild, AfterViewInit, HostListener, ElementRef, Renderer2, Output, OnDestroy } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ExecutionService } from 'services/execution.service';
import { ResizeEvent } from 'angular-resizable-element';
import { GeoJSONHelper } from 'utility/maplayers/geoJSONHelper';
import { PopupPropertyType, PopupProperty } from 'utility/maplayers/popupProperty';
import { DistributionFormatType } from 'api/webApi/data/distributionFormatType';
import moment from 'moment-es6';
import { FeatureCollection } from 'geojson';
import { DataConfigurableI } from 'utility/configurables/dataConfigurableI.interface';
import { AuthenticatedClickService } from 'services/authenticatedClick.service';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { MapInteractionService } from 'utility/eposLeaflet/services/mapInteraction.service';
import { MatSelectChange } from '@angular/material/select';
import { DataSearchConfigurablesServiceResource } from '../../dataPanel/services/dataSearchConfigurables.service';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { NotificationService } from 'components/notification/notification.service';
import { Style } from 'utility/styler/style';
import { CONTEXT_RESOURCE } from 'api/api.service.factory';
import { CONTEXT_FACILITY } from 'api/api.service.factory';
import { CONTEXT_SOFTWARE } from 'api/api.service.factory';
import { WMTSLayerTableData } from 'utility/eposLeaflet/eposLeaflet';

/** The above code is defining an interface called `TableExportObject` in TypeScript. This interface is
used to define the structure and properties of an object that can be exported from a table. */
export interface TableExportObject {

  /** The above code is declaring a variable called "headers" which is an array of strings in
  TypeScript. */
  headers: Array<string>;

  /** The above code is declaring a TypeScript variable called "data" which is an array of arrays of
  strings. */
  data: Array<Array<string>>;

  /** The above code is written in TypeScript and it declares a variable `fileName` of type string. */
  fileName: string;
}

export enum TableDataType {
  FEATURE_COLLECTION,
  WMTS
}

@Unsubscriber('subscriptions')
@Component({
  selector: 'app-table-display',
  templateUrl: './tableDisplay.component.html',
  styleUrls: ['./tableDisplay.component.scss']
})
export class TableDisplayComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() dataConfigurable: DataConfigurableI;
  @Input() onDialogComponent: boolean = false;

  @Output() exportData = new Subject<TableExportObject>();

  @ViewChild(MatPaginator, { static: true }) matPaginator: MatPaginator;
  @ViewChild(MatSort) matSort: MatSort;
  @ViewChild('containerTable') containerTable: ElementRef;

  public readonly DISPLAY_ITEM_TYPES = PopupPropertyType;

  public CONTEXT_RESOURCE = CONTEXT_RESOURCE;
  public CONTEXT_FACILITY = CONTEXT_FACILITY;
  public CONTEXT_SOFTWARE = CONTEXT_SOFTWARE;

  public tableHeaders: Array<string>;
  public customHeaders: Array<string>;
  public dataSource = new MatTableDataSource<Array<null | PopupProperty>>([]);

  // flag to establish if data are of type FeatureCollection or WMTS
  public dataType: TableDataType;

  public showSpinner = true;
  public showTable = true;
  public selectedRow: null | number;

  public rowInPage = 5;
  public pointsOnMapHeader = PopupProperty.POINTS_ON_MAP;
  public showOnMapHeader = PopupProperty.SHOW_ON_MAP;
  public propertyIdHeader = PopupProperty.PROPERTY_ID;
  public toggleOnMapHeader = PopupProperty.TOGGLE_ON_MAP;
  public imagesHeader = PopupProperty.IMAGES;
  public isMappable = true;
  public pageNumber = 1;
  public activeColumnCount: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public totalColumnCount = 0;
  public maxPageNumber = 0;

  public showFilterRowCounter = false;

  public toggleOnMapDisabled = false;
  public toggleOnMapDisabledMessage = '';
  public toggleOnMapSelected: { [key: string]: boolean } = {};
  public someOnMapHide = false;

  // Wmts
  public infoFromWMTS: null | Map<string, WMTSLayerTableData> = null;

  /** Variable for keeping track of subscriptions, which are cleaned up by Unsubscriber */
  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  private data: FeatureCollection;

  private filterTimeout: NodeJS.Timeout;

  private featureIndexToSelect: string | null;

  private headersToRemove = [this.pointsOnMapHeader, this.propertyIdHeader, this.imagesHeader];

  private imageOverlay = false;

  constructor(
    private readonly executionService: ExecutionService,
    private readonly authentificationClickService: AuthenticatedClickService,
    private readonly panelsEvent: PanelsEmitterService,
    private readonly mapInteractionService: MapInteractionService,
    private renderer: Renderer2,
    private readonly notificationService: NotificationService,
    private readonly configurables: DataSearchConfigurablesServiceResource,
    private readonly localStoragePersister: LocalStoragePersister,
  ) {
  }

  public static sortPredicate(data: Array<Array<null | PopupProperty>>, sort: Sort): Array<Array<null | PopupProperty>> {

    let sortedData = data.slice();

    if (sort.active && sort.direction !== '') {
      sortedData = data.sort((a: Array<PopupProperty>, b: Array<PopupProperty>) => {
        const isAsc = (sort.direction === 'asc');
        const propA = a.filter((value: PopupProperty) => null != value).find((value: PopupProperty) => value.name === sort.active);
        const propB = b.filter((value: PopupProperty) => null != value).find((value: PopupProperty) => value.name === sort.active);

        const momentA = (null != propA) ? moment.utc(String(propA.values[0]).valueOf(), 'YYYY-MM-DDTHH:mm:SS', true) : null;
        const momentB = (null != propB) ? moment.utc(String(propB.values[0]).valueOf(), 'YYYY-MM-DDTHH:mm:SS', true) : null;
        let isALessThanB: boolean;
        switch (true) {
          case (null == propA): // Test for null values
            isALessThanB = true;
            break;
          case (null == propB): // Test for null values
            isALessThanB = false;
            break;
          case (propA!.name === PopupProperty.LONG_LAT): // Test for long/lat values
            isALessThanB = (Number(propA!.values[0]).valueOf() === Number(propB!.values[0]).valueOf())
              ? Number(propA!.values[1]).valueOf() < Number(propB!.values[1]).valueOf()
              : Number(propA!.values[0]).valueOf() < Number(propB!.values[0]).valueOf();
            break;
          case ((null != momentA) && momentA.isValid() && (null != momentB) && momentB.isValid()): // Test for date values
            isALessThanB = momentA!.isBefore(momentB!);
            break;
          case ((typeof propA!.values[0] === 'number') && (typeof propB!.values[0] === 'number')): // tests for numerical values
            isALessThanB = propA!.values[0] < propB!.values[0];
            break;
          default: // default tests primative string value
            isALessThanB = propA!.valuesConcatString < propB!.valuesConcatString;
            break;
        }
        return (isALessThanB ? -1 : 1) * (isAsc ? 1 : -1);
      });
    }
    return sortedData;
  }

  @HostListener('window:resize')
  resizeWindow(checkCurrentHeight = true): void {

    // if not in dialog component
    if (this.onDialogComponent === false) {
      const containerTableRect = (this.containerTable.nativeElement as HTMLElement).getBoundingClientRect();
      const height = (window.innerHeight / 2) - containerTableRect.top - 10;

      if (height < containerTableRect.height || checkCurrentHeight) {
        this.renderer.setStyle(this.containerTable.nativeElement, 'height', `${height}px`);
      }
    }
  }

  public ngOnInit(): void {

    // check height windows
    this.checkRowInPage();

    this.showSpinner = true;

    // check if mappable
    this.isMappable = this.dataConfigurable.isMappable;

    if (this.isMappable) {
      // add header actions on map to headerToRemove variable
      this.headersToRemove.push(...[this.showOnMapHeader, this.toggleOnMapHeader]);
    }

    const distributionFormat = this.dataConfigurable.getDistributionDetails().getTabularableFormats()[0];

    // check if it's a WMTS Distribution (this is needed also because a table format is returned from dist. execution but only needs to be shown when clicking on the "Donwnload" button of the card, NOT executed here on Table)
    const isWmts = this.dataConfigurable.getDistributionDetails().getFormats().find((frmt) => frmt.getFormat() === 'application/vnd.ogc.wmts_xml');
    if (isWmts != null) {
      this.mapInteractionService.getWmtsLayersMapStorageObs().subscribe((infoFromWMTS: null | Map<string, WMTSLayerTableData>) => {
        if (infoFromWMTS != null && infoFromWMTS.size > 0 && (infoFromWMTS.values().next().value as WMTSLayerTableData).originatorConfig === this.dataConfigurable.id) {
          this.dataType = TableDataType.WMTS;
          // clone the map to avoid reference issues (e.g. when cleaning 'this.infoFromWMTS' i MUST not clean the original map)
          const infoFilteredClone = new Map(
            [...infoFromWMTS].filter(([k, v]) => v.originatorConfig === this.dataConfigurable.id)
          );
          this.infoFromWMTS = infoFilteredClone;

          this.setTableHeaders(this.infoFromWMTS as Map<string, WMTSLayerTableData>); // <<< -------
          this.updateTable(this.customHeaders);
          this.showSpinner = false;
        }
        else {
          this.showSpinner = false;
        }
      });
    }
    // FeatureCollection
    else {
      this.dataType = TableDataType.FEATURE_COLLECTION;

      void this.executionService.executeDistributionFormat(
        this.dataConfigurable.getDistributionDetails(),
        distributionFormat,
        this.dataConfigurable.getParameterDefinitions(),
        this.dataConfigurable.currentParamValues.slice()
      ).then((data: unknown) => {

        if (null == data || JSON.stringify(data) === '{}') {
          this.createEmptyTable();
        } else {
          switch (true) {
            // eslint-disable-next-line max-len
            case (DistributionFormatType.in(distributionFormat.getFormat(), [DistributionFormatType.APP_EPOS_GEOJSON, DistributionFormatType.APP_EPOS_TABLE_GEOJSON])):
              this.data = data as FeatureCollection;
              this.setTableHeaders(this.data);
              this.updateTable(this.customHeaders);

              // no data
              if (this.data.features.length === 0 && this.configurables.getSelected()?.id === this.dataConfigurable.id) {
                this.notificationService.sendDistributionNotification({
                  id: this.dataConfigurable.id,
                  title: 'Warning',
                  message: NotificationService.MESSAGE_NO_DATA,
                  type: NotificationService.TYPE_WARNING as string,
                  showAgain: false,
                });
              }

              // check if imageOverlay
              this.imageOverlay = this.hasImageOverlay();

              break;
          }
        }
      })
        .catch((e) => {
        }).finally(() => {
          this.showSpinner = false;
          this.refreshHiddenRowOnTable(1000);
        });
    }

    this.subscriptions.push(
      this.panelsEvent.invokeGraphPanel.subscribe((graphOpened: boolean) => {
        if (graphOpened) {
          this.resizeWindow(false);
        }
      }),

      this.panelsEvent.invokeRowOnTable.subscribe((featureIndex: string) => {
        this.featureIndexToSelect = featureIndex;
      }),
      this.panelsEvent.invokeTablePanelToggle.subscribe((layerId: string) => {

        if (layerId === this.dataConfigurable.id) {
          void this.getDataSorted().then(res => {

            res.forEach((f: [PopupProperty], index) => {

              if (f.find(p => p.name === PopupProperty.PROPERTY_ID && p.valuesConcatString === this.featureIndexToSelect)) {
                this.matPaginator.pageIndex = Math.floor(index / this.matPaginator.pageSize);
                this.selectedRow = index % this.matPaginator.pageSize;
                this.dataSource.paginator = this.matPaginator;
                this.pageNumber = this.matPaginator.pageIndex + 1;
              }
            });
          });

          setTimeout(() => {
            if (this.selectedRow !== null) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              (this.containerTable.nativeElement as Element).scrollTop = (
                (this.containerTable.nativeElement as Element).scrollHeight * this.selectedRow) / this.matPaginator.pageSize;
            }
          }, 500);
        }
      }),
      this.panelsEvent.invokeClearRowOnTable.subscribe(() => {
        this.selectedRow = null;
      }),
      this.dataConfigurable.styleObs.subscribe((style: Style) => {
        this.toggleOnMapDisabled = style.getClustering() ?? false;
        this.toggleOnMapDisabledMessage = this.toggleOnMapDisabled ? ' - Remove cluster option on this layer' : '';
      }),
      this.mapInteractionService.updateStatusHiddenMarker.subscribe(check => {
        if (check === true) {
          this.refreshIconOnTableFromLocalStorage();
          this.checkSomeOnMapHide();
        }
      }),
      this.mapInteractionService.toggleOnMapDisabled.subscribe(value => {
        this.toggleOnMapDisabled = value;
      }),

      // useful for aligning the behaviors between the table in the popup and the table in the sidenav
      this.mapInteractionService.featureOnlayerToggle.subscribe((featureOnLayer: Map<string, Array<number> | string | boolean>) => {
        this.refreshIconOnTableFromLocalStorage();
      }),

    );
  }

  public ngOnDestroy(): void {
    this.removeLayerIdFromHiddenMarkerOnLocalStorage(this.dataConfigurable.id);
  }

  /**
   * The function checks if a GeoJSON object has an image overlay.
   * @returns The method `hasImageOverlay()` is returning a boolean value.
   */
  public hasImageOverlay(): boolean {
    return GeoJSONHelper.hasImageOverlay(this.data.features);
  }

  /**
   * The ngAfterViewInit function initializes sorting and paging functionalities for a data source.
   */
  public ngAfterViewInit(): void {
    /** initiallises sorting and paging functionallities */
    this.dataSource.filterPredicate = (propsArray: Array<PopupProperty>, filter: string): boolean => {
      filter = filter.toLowerCase();
      return (null != propsArray.find((prop: PopupProperty) => {
        return ((null != prop) && (prop.contains(filter)));
      }));
    };
    this.dataSource.sort = this.matSort;
    this.dataSource.sortData = (data: Array<Array<null | PopupProperty>>, sort: Sort) => TableDisplayComponent.sortPredicate(data, sort);

    this.dataSource.paginator = this.matPaginator;

    if (this.onDialogComponent) {
      this.renderer.setStyle(this.containerTable.nativeElement, 'resize', 'none');
      this.renderer.setStyle(this.containerTable.nativeElement, 'height', '100%');
    }
  }

  /**
   * The function toggles a map feature based on the provided element and checked parameters, and
   * updates the corresponding data and map display accordingly.
   * @param element - An array of PopupProperty objects.
   * @param {boolean} checked - The "checked" parameter is a boolean value that determines whether a
   * map feature should be shown or hidden. If "checked" is true, the feature will be shown on the map.
   * If "checked" is false, the feature will be hidden.
   * @param [checkSomeOnMapHideFunc=true] - The parameter `checkSomeOnMapHideFunc` is a boolean value
   * that determines whether to call the `checkSomeOnMapHide()` function after updating the
   * `toggleOnMapSelected` array and refreshing the hidden marker on local storage. If
   * `checkSomeOnMapHideFunc` is `true`,
   */
  public toggleMapFeature(element: Array<PopupProperty>, checked: boolean, checkSomeOnMapHideFunc = true): void {
    const featureIndex = this.getPropertyIdFromArrayPopupProperty(element);
    this.toggleOnMapSelected[featureIndex] = checked;

    this.refreshHiddenMarkerOnLocalStorage(featureIndex, checked);

    if (checkSomeOnMapHideFunc) {
      this.checkSomeOnMapHide();
    }
    this.mapInteractionService.toggleFeature(this.dataConfigurable.id, featureIndex, checked, this.imageOverlay);
  }

  /**
   * The function toggles all map features by iterating through the filtered data and calling the
   * toggleMapFeature function for each item, and then checks if some features are hidden on the map.
   */
  public toggleAllMapFeature(): void {
    this.dataSource.filteredData.map((_ap: Array<PopupProperty>) => {
      this.toggleMapFeature(_ap, this.someOnMapHide, false);
    });
    this.checkSomeOnMapHide();
  }

  /**
   * The function "showOnMap" checks if the data is mappable, filters the element array to get the
   * latitude and longitude property, gets the coordinates using the getCoordinateByProperty function,
   * sets the featureIndexToSelect and calls the clickOnMaps function to interact with the map.
   * @param element - An array of objects of type PopupProperty.
   * @param {string} propertyId - The `propertyId` parameter is a string that represents the ID of a
   * property.
   */
  public showOnMap(element: Array<PopupProperty>, propertyId: string): void {
    if (this.isMappable) {
      const latlongProp = element.filter((val: PopupProperty) => val.name === this.pointsOnMapHeader);

      const coordinates = this.getCoordinateByProperty(latlongProp[0]);

      this.featureIndexToSelect = propertyId;

      if (coordinates[0] !== GeoJSONHelper.NO_DATA[0]) {
        this.mapInteractionService.clickOnMaps(this.dataConfigurable.id, this.featureIndexToSelect, coordinates as Array<number>, this.imageOverlay);
      }

    }
  }

  /**
   * The `expandRow` function is used to expand or collapse a row in a table, based on the provided index
   * and element data.
   * @param {number} i - The parameter "i" is of type number and represents the index of the row being
   * expanded.
   * @param element - The `element` parameter is an array of `PopupProperty` objects.
   * @param {number | boolean} [columnIndex=false] - The `columnIndex` parameter is a number or a boolean
   * value that represents the index of the column in the `element` array. It is optional and has a
   * default value of `false`.
   * @returns In this code, nothing is being explicitly returned. The return statements are used to exit
   * the function early in certain conditions, but they do not return any specific value.
   */
  public expandRow(i: number, element: Array<PopupProperty>, columnIndex: number | boolean = false): void {

    if (this.isMappable && columnIndex as number < 2) {
      return;
    }
    if (this.selectedRow === i) {
      this.selectedRow = null;
      this.featureIndexToSelect = null;
    } else {

      this.featureIndexToSelect = this.getPropertyIdFromArrayPopupProperty(element);

      setTimeout(() => {
        this.checkingPageData();
      }, 100);

    }
  }

  /**
   * It checks if the page number is the same as the page number of the feature that was selected in the
   * map. If it is, it sets the selectedRow variable to the index of the feature in the page
   */
  public checkingPageData(): void {
    this.selectedRow = null;
    if (this.featureIndexToSelect !== undefined) {
      void this.getDataSorted().then(res => {

        res.forEach((f: [PopupProperty], index) => {

          if (f.find(p => p.name === PopupProperty.PROPERTY_ID && p.valuesConcatString === this.featureIndexToSelect)) {
            const foundInPage = Math.floor(index / this.matPaginator.pageSize);
            if (foundInPage === this.matPaginator.pageIndex) {
              this.selectedRow = index % this.matPaginator.pageSize;
            }
          }
        });
      });
    }

    this.pageNumber = this.matPaginator.pageIndex + 1;
  }

  /**
   * The function "goToPage" sets the page number of a material paginator and emits a page event.
   */
  public goToPage(): void {
    if (this.pageNumber > this.maxPageNumber) {
      this.pageNumber = this.maxPageNumber;
    }
    this.matPaginator.pageIndex = this.pageNumber - 1;
    this.matPaginator.page.next({
      pageIndex: this.matPaginator.pageIndex,
      pageSize: this.matPaginator.pageSize,
      length: this.matPaginator.length
    });
  }

  /** Syncs upper paginator with lower paginator. */
  public syncPrimaryPaginator(event: PageEvent): void {
    this.matPaginator.pageIndex = event.pageIndex;
    this.matPaginator.pageSize = event.pageSize;
    this.matPaginator.page.emit(event);
  }

  /**  used for filtering of table results */
  public applyFilter(event: KeyboardEvent): void {
    // only filter after the filter hasn't changed for delay
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {

      const textFilter = String((event.target as HTMLInputElement).value).trim().toLowerCase();
      this.showFilterRowCounter = textFilter !== '' ? true : false;

      this.dataSource.filter = textFilter;
      this.maxPageNumber = Math.ceil(this.dataSource.filteredData.length / this.matPaginator.pageSize);
      if (this.pageNumber > this.maxPageNumber) {
        this.pageNumber = this.maxPageNumber;
      }

      this.checkSomeOnMapHide();
    }, 100);
  }

  /** reset the width of table columns */
  public onResizeEnd(event: ResizeEvent, columnName: string): void {
    if (event.edges.right) {
      const cssValue = String(event.rectangle.width) + 'px';
      const columnElts = document.getElementsByClassName('mat-column-' + columnName);
      Array.from(columnElts).forEach((el: HTMLDivElement) => el.style.width = cssValue);
    }
  }

  /** reloads the table and removes any formating */
  public reload(): void {
    this.showSpinner = true;
    this.showTable = false;
    setTimeout(() => {
      this.selectedRow = null;
      this.showTable = true;
      this.showSpinner = false;
      this.maxPageNumber = Math.ceil(this.dataSource.data.length / this.matPaginator.pageSize);
    }, 100);
  }

  /**
   * The function "openAuthLink" prevents the default behavior of a mouse click event and calls the
   * "popupClick" function from the GeoJSONHelper class with the provided parameters.
   * @param {MouseEvent} event - The event parameter is a MouseEvent object that represents the event
   * that triggered the function. It contains information about the event, such as the type of event,
   * the target element, and the coordinates of the mouse pointer.
   * @param {PopupProperty} item - The "item" parameter is of type "PopupProperty" and represents the
   * data associated with the popup that was clicked.
   */
  public openAuthLink(event: MouseEvent, item: PopupProperty): void {
    event.preventDefault();

    GeoJSONHelper.popupClick(event, this.executionService, this.authentificationClickService, item);
  }

  /**
   * The `updateTable` function updates the data in a table based on the provided headers and applies
   * formatting and filtering based on certain conditions.
   * @param headers - The `headers` parameter is an array of strings that represents the headers of a
   * table.
   */
  public updateTable(headers: Array<string>): void {

    if (this.dataType === TableDataType.FEATURE_COLLECTION) {
      const tableMap = GeoJSONHelper.getTableObjectsFromProperties(this.dataConfigurable.id, this.data.features);

      // check if mappable table
      this.isMappable = tableMap.has(this.pointsOnMapHeader);
      if (this.isMappable === false) {
        headers = headers.filter(obj => { return obj !== this.pointsOnMapHeader; });
      }

      let tableData = Array.from(tableMap.values());

      /** sets value of removed header to null in each array */
      tableData = (null != tableData[0])
        ? tableData.map((value) => value.map((values) => (null != values) ? (headers.includes(values.name) ? values : null) : null))
        : [];

      /** pivot table to get from colArray[rowArray] to rowArray[colArrray] */
      tableData = (null != tableData[0])
        ? tableData[0].map((_, colIndex) => tableData.map(row => row[colIndex]))
        : [];

      /** filter out null values */
      const tableFormatted: PopupProperty[][] = tableData.map((array: Array<PopupProperty>) =>
        array.filter((val: PopupProperty) => val != null));

      if (this.isMappable) {
        // add toggleOnMap on table header list (index 1)
        this.customHeaders.unshift(this.toggleOnMapHeader);

        // add showOnMap on table header list (index 0)
        this.customHeaders.unshift(this.showOnMapHeader);

        tableFormatted.map((_ap: Array<PopupProperty>) => {

          const featureIndex = this.getPropertyIdFromArrayPopupProperty(_ap);

          // add toggleOnMap on table data (index 1)
          _ap.unshift(new PopupProperty(this.toggleOnMapHeader, [featureIndex]));

          // add toggleOnMap on table data (index 0)
          _ap.unshift(new PopupProperty(this.showOnMapHeader, [featureIndex]));

          this.toggleOnMapSelected[featureIndex] = true;
        });
      }

      /** applies new data to table */
      this.dataSource.data = tableFormatted;
      this.maxPageNumber = Math.ceil(this.dataSource.data.length / this.matPaginator.pageSize);
      this.getActiveColumnCount(this.dataSource.data[0], false);

    }
    // WMTS
    else if (this.dataType === TableDataType.WMTS) {

      if (this.infoFromWMTS && this.infoFromWMTS.size > 0) {
        const tableData = this.infoFromWMTS as Map<string, WMTSLayerTableData>;

        const popupPropertiesArray: PopupProperty[][] = [];

        if (this.isMappable) {
          // add toggleOnMap on table header list (index 1)
          this.customHeaders.unshift(this.toggleOnMapHeader);

          // add showOnMap on table header list (index 0)
          this.customHeaders.unshift(this.showOnMapHeader);

          tableData.forEach((layer, rowIndex) => {
            const layerArr: Array<PopupProperty> = [];

            // add showOnMap on table data (index 0)
            layerArr.push(new PopupProperty(this.showOnMapHeader, [layer.layerID + '#' + rowIndex.toString() + '#']));
            // add toggleOnMap on table data (index 1)
            layerArr.push(new PopupProperty(this.toggleOnMapHeader, [layer.tableRowPropertyId])); // Hello, hello my friend ... MUST BE EQUAL to the PROPERTY_ID !!!!!
            // checking if each property is in customHeaders before pushing it in the row (on select/deselect columns -> customHeaders change)
            if (this.customHeaders.includes('Layer')) {
              layerArr.push(new PopupProperty('layer', [layer.title]));
            }
            if (this.customHeaders.includes('Coordinates')) {
              layerArr.push(new PopupProperty('coordinates', [layer.coordinates.toString()]));
            }
            if (this.customHeaders.includes('Abstract')) {
              if (layer.abstract !== '') {
                layerArr.push(new PopupProperty('abstract', [layer.abstract]));
              }
              else {
                layerArr.push(new PopupProperty('abstract', ['--']));
              }
            }
            if (this.customHeaders.includes('Metadata URL')) {
              if (layer.metadataUrl !== '') {
                layerArr.push(new PopupProperty('metadataUrl', [`<a href="${layer.metadataUrl}">${layer.metadataUrl}</a>`])); // the link to metadata (e.g.: the xml where the Data Product can be found)
              }
              else {
                layerArr.push(new PopupProperty('metadataUrl', ['--']));
              }
            }
            // Declaring PROPERTY_ID for the row: this is a value which is NOT shown in the table (not in 'customHeaders', 'tableHeaders' nor 'columnsCount') !
            layerArr.push(new PopupProperty(PopupProperty.PROPERTY_ID, [layer.tableRowPropertyId])); // Hello, hello my friend ... MUST BE EQUAL TO THE toggleOnMapHeader !!!!!

            if (layer.isDefaultLayer) {
              this.toggleOnMapSelected[layer.tableRowPropertyId] = true;
            }
            else {
              this.toggleOnMapSelected[layer.tableRowPropertyId] = false;
              this.refreshHiddenMarkerOnLocalStorage(layer.tableRowPropertyId, false);
            }

            popupPropertiesArray.push(layerArr);
          });
        }
        // TODO: trigger expansion of the 2 layers to be loaded besides the default already loaded on Map

        this.dataSource.data = popupPropertiesArray;
        this.maxPageNumber = Math.ceil(this.dataSource.data.length / this.matPaginator.pageSize);
        this.getActiveColumnCount(this.dataSource.data[0], false);
        this.showSpinner = false;
        /* this.infoFromWMTS.clear(); */
      }
    }
  }

  /**
   * The function "handleSelectionChange" takes an event parameter and calls the "getActiveColumnCount"
   * function with the value of the event and a boolean value of true.
   * @param {MatSelectChange} event - The event parameter is of type MatSelectChange, which is an event
   * emitted when the selection in a mat-select component changes.
   */
  public handleSelectionChange(event: MatSelectChange): void {
    this.getActiveColumnCount(event.value, true);
    this.refreshHiddenRowOnTable(200);
  }

  /**
   * The function `exportTableData` exports table data by filtering out unwanted headers and values and
   * sending the data to be exported.
   */
  public exportTableData() {
    const data: TableExportObject = {
      headers: this.customHeaders.filter((_h: string) => {
        return !this.headersToRemove.includes(_h);
      }),
      data: this.dataSource.filteredData.map((popupPropAr: Array<PopupProperty>) => popupPropAr.filter((popupProp: PopupProperty) => {
        return !this.headersToRemove.includes(popupProp.name);
      }).map((popupProp: PopupProperty) => popupProp.valuesConcatString)
      ) as Array<Array<string>>,
      fileName: this.dataConfigurable.name,
    };

    this.exportData.next(data);
  }

  /**
   * The function `refreshHiddenRowOnTable` refreshes hidden rows on a table after a specified time
   * interval.
   * @param [time=2000] - The `time` parameter in the `refreshHiddenRowOnTable` function represents the
   * duration in milliseconds after which the function will execute the code inside the `setTimeout`
   * function. In this case, the default value for `time` is set to 2000 milliseconds (2 seconds).
   */
  private refreshHiddenRowOnTable(time = 2000): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const dataSearchToggleOnMap: Array<string> = JSON.parse(this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_TOGGLE_ON_MAP) as string || '[]');

    setTimeout(() => {
      dataSearchToggleOnMap.filter(_v => {
        // if marker of layer
        if (_v.indexOf(this.dataConfigurable.id) !== -1) {

          this.mapInteractionService.toggleFeature(this.dataConfigurable.id, _v, false, this.imageOverlay);
          // eslint-disable-next-line no-underscore-dangle
          this.toggleOnMapSelected[_v] = false;
        }
      });

      this.checkSomeOnMapHide();
    }, 100);
  }

  /**
   * The function `refreshIconOnTableFromLocalStorage` retrieves data from local storage and updates a
   * property based on the retrieved data.
   */
  private refreshIconOnTableFromLocalStorage(): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const dataSearchToggleOnMap: Array<string> = JSON.parse(this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_TOGGLE_ON_MAP) as string || '[]');

    setTimeout(() => {
      Object.keys(this.toggleOnMapSelected).forEach(k => {
        this.toggleOnMapSelected[k] = !dataSearchToggleOnMap.includes(k);
      });

    }, 500);
  }

  /**
   * The function retrieves the property ID from an array of PopupProperty objects based on a specific
   * name.
   * @param ap - An array of objects of type PopupProperty.
   * @returns a string value.
   */
  private getPropertyIdFromArrayPopupProperty(ap: Array<PopupProperty>): string {
    const propertyId = ap.filter((val: PopupProperty) => val.name === this.propertyIdHeader);
    if (propertyId.length > 0) {
      return propertyId[0].valuesConcatString;
    }
    return '';
  }

  private getActiveColumnCount(data, onChange): void {
    if (data !== undefined) {
      let copy = [...data]; // eslint-disable-line @typescript-eslint/no-unsafe-assignment

      if (!onChange) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        copy = copy.filter((el) => !this.headersToRemove.includes(el.name as string));
      } else {
        copy = copy.filter((el: string) => !this.headersToRemove.includes(el));
      }
      this.activeColumnCount.next(copy.length);
    }
  }

  private createEmptyTable() {
    this.tableHeaders = [];
    this.dataSource.data = [];

    this.notificationService.sendDistributionNotification({
      id: this.dataConfigurable.id,
      title: 'Warning',
      message: NotificationService.MESSAGE_NO_DATA,
      type: NotificationService.TYPE_WARNING as string,
      showAgain: false,
    });
  }

  private setTableHeaders(data: GeoJSON.FeatureCollection | Map<string, WMTSLayerTableData>) {

    if (this.dataType === TableDataType.FEATURE_COLLECTION) {
      // data as FeatureCollection
      const dataAsFC = data as FeatureCollection;
      const tableMap = GeoJSONHelper.getTableObjectsFromProperties(this.dataConfigurable.id, dataAsFC.features);
      this.tableHeaders = Array.from(tableMap.keys());

      this.tableHeaders = this.tableHeaders.filter((el) => !el.includes(this.imagesHeader));

      this.customHeaders = this.tableHeaders.slice(0, 8);

      if (!this.customHeaders.includes(this.pointsOnMapHeader)) {
        this.customHeaders.push(this.pointsOnMapHeader);
      }

      if (!this.customHeaders.includes(this.propertyIdHeader)) {
        this.customHeaders.push(this.propertyIdHeader);
      }

      this.totalColumnCount = [...this.tableHeaders].filter((el) => !this.headersToRemove.includes(el)).length;

    }
    else if (this.dataType === TableDataType.WMTS) {
      if (data != null) {
        const dataAsWMTS = data as Map<string, WMTSLayerTableData>;

        if (dataAsWMTS.size > 0) {

          const selectedTableHeaders: string[] = [];

          // read first entry of the MAP structure to retrieve headers to be shown
          const firstEntry = dataAsWMTS.values().next().value as WMTSLayerTableData;
          const dataKeys = Object.keys(firstEntry);
          // filter out unwanted header to keep only the relevant ones (chosen by TCS)
          const filteredDataKeys = dataKeys.filter((key) => {
            return key.toLowerCase() === 'layeridentifier' ||
              key.toLowerCase() === 'coordinates' ||
              key.toLowerCase() === 'abstract' ||
              key.toLowerCase() === 'metadataurl';
          });

          // reorder headers in order of appearance
          selectedTableHeaders.push(filteredDataKeys.find((k) => k.toLowerCase() === 'layeridentifier') as string);
          selectedTableHeaders.push(filteredDataKeys.find((k) => k.toLowerCase() === 'coordinates') as string);
          selectedTableHeaders.push(filteredDataKeys.find((k) => k.toLowerCase() === 'abstract') as string);
          selectedTableHeaders.push(filteredDataKeys.find((k) => k.toLowerCase() === 'metadataurl') as string);

          // mapping of headers to standard naming
          const correctNamingHeaders: Array<string> = [];
          for (const header of selectedTableHeaders) {
            switch (header.toLowerCase()) {
              case 'layeridentifier':
                correctNamingHeaders.push('Layer'); // actual naming
                break;
              case 'coordinates':
                correctNamingHeaders.push('Coordinates');
                break;
              case 'abstract':
                correctNamingHeaders.push('Abstract');
                break;
              case 'metadataurl':
                correctNamingHeaders.push('Metadata URL');
                break;
            }
          }

          // set TableHeaders (all slectable columns)
          this.tableHeaders = correctNamingHeaders;
          // set CustomHeaders (the columns immediately selected/visible)
          this.customHeaders = this.tableHeaders.slice(0, 5);

          if (!this.customHeaders.includes(this.pointsOnMapHeader)) {
            this.customHeaders.push(this.pointsOnMapHeader);
          }

          if (!this.customHeaders.includes(this.propertyIdHeader)) {
            this.customHeaders.push(this.propertyIdHeader);
          }

          this.totalColumnCount = [...this.tableHeaders].filter((el) => !this.headersToRemove.includes(el)).length;

        }
      }
    }

  }

  private checkRowInPage(): void {
    // check height windows
    if (window.innerHeight > 1300) {
      this.rowInPage = 10;
    }
  }

  private getDataSorted(): Promise<Array<Array<PopupProperty | null>>> {
    return new Promise((resolve) => {
      const dataSorted = this.dataSource.sortData(this.dataSource.data, this.matSort);
      resolve(dataSorted);
    });
  }

  private getCoordinateByProperty(property: PopupProperty) {

    let coordinates: (string | number | boolean)[] = [];

    if (property.isSingleValue) {
      coordinates = property.values[0][0] as (string | number | boolean)[];
    } else {
      coordinates = property.values;
    }

    return coordinates;

  }

  private refreshHiddenMarkerOnLocalStorage(featureIndex: string, checked: boolean): void {

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let dataSearchToggleOnMap: Array<string> = JSON.parse(this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_TOGGLE_ON_MAP) as string || '[]');

    if (checked === false) {
      // save hide marker on local storage
      if (!dataSearchToggleOnMap.includes(featureIndex)) {
        dataSearchToggleOnMap.push(featureIndex);
      }

    } else {
      // remove from LS
      dataSearchToggleOnMap = dataSearchToggleOnMap.filter(_v => _v !== featureIndex);
    }

    this.localStoragePersister.set(
      LocalStorageVariables.LS_CONFIGURABLES,
      JSON.stringify(dataSearchToggleOnMap),
      false,
      LocalStorageVariables.LS_TOGGLE_ON_MAP
    );
  }

  private removeLayerIdFromHiddenMarkerOnLocalStorage(layerId: string): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let dataSearchToggleOnMap: Array<string> = JSON.parse(this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_TOGGLE_ON_MAP) as string || '[]');

    // remove from LS
    dataSearchToggleOnMap = dataSearchToggleOnMap.filter(_v => _v.indexOf(layerId) === -1);

    if (this.configurables.getAll().length === 0) {
      dataSearchToggleOnMap = [];
    }

    this.localStoragePersister.set(
      LocalStorageVariables.LS_CONFIGURABLES,
      JSON.stringify(dataSearchToggleOnMap),
      false,
      LocalStorageVariables.LS_TOGGLE_ON_MAP
    );
  }

  /**
   * The function checks if all the items in the filtered data are hidden on the map.
   */
  private checkSomeOnMapHide(): void {
    const numFilteredData = this.dataSource.filteredData.length;
    let numHiddenOnMap = 0;
    this.dataSource.filteredData.forEach((_ap: Array<PopupProperty>) => {

      const featureIndex = this.getPropertyIdFromArrayPopupProperty(_ap);
      if (this.toggleOnMapSelected[featureIndex] === false) {
        numHiddenOnMap++;
      }
    });
    this.someOnMapHide = numHiddenOnMap === numFilteredData;
  }
}
