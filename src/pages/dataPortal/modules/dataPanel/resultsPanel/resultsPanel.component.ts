import { AfterContentInit, Component, ElementRef, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DiscoverResponse } from 'api/webApi/classes/discoverApi.interface';
import { Domain } from 'api/webApi/data/domain.interface';
import { DataSearchConfigurablesServiceResource } from '../services/dataSearchConfigurables.service';
import { Model } from 'services/model/model.service';
import { DialogService } from 'components/dialog/dialog.service';
import { LoadingService } from 'services/loading.service';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';
import { ResultsPanelService } from 'pages/dataPortal/services/resultsPanel.service';
import { LandingService } from '../services/landing.service';
import { TourService } from 'services/tour.service';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { NotificationService } from 'services/notification.service';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { Environment } from 'api/webApi/data/environments/environment.interface';
import { AnalysisConfigurablesService } from 'pages/dataPortal/services/analysisConfigurables.service';
import { DistributionItem } from 'api/webApi/data/distributionItem.interface';
import { CONTEXT_RESOURCE } from 'api/api.service.factory';
import { BaseResultsPanelComponent } from 'components/baseResultsPanel/baseResultsPanel.component';
import { Tracker } from 'utility/tracker/tracker.service';
import { TrackerAction, TrackerCategory } from 'utility/tracker/tracker.enum';
import { SearchService } from '../../../../../services/search.service';
import { LeafletLoadingService } from '../../../../../utility/eposLeaflet/services/leafletLoading.service';
import { Popover } from 'driver.js';
import { ShareService } from 'services/share.service';
import { MetaDataStatusService } from 'services/metaDataStatus.service';
import { AaaiService } from 'api/aaai.service';
import { MonitoringPopupComponent } from 'components/dialog/monitoring-PopupDialog/monitoring-popup.component';

@Unsubscriber(['domainSubscription', 'subscriptions'])
@Component({
  selector: 'app-results-panel',
  templateUrl: 'resultsPanel.component.html',
  styleUrls: ['../../../../../components/baseResultsPanel/baseResultsPanel.component.scss'],
})
export class ResultsPanelComponent extends BaseResultsPanelComponent implements OnInit, AfterContentInit {

  public environmentSelected: Environment | null = null;

  private serviceParent: HTMLTableElement;

  constructor(readonly model: Model,
    public readonly configurables: DataSearchConfigurablesServiceResource,
    protected readonly dialogService: DialogService,
    protected readonly loadingService: LoadingService,
    protected readonly landingService: LandingService,
    protected readonly panelsEvent: PanelsEmitterService,
    protected readonly resultPanelService: ResultsPanelService,
    protected readonly tourService: TourService,
    protected readonly localStoragePersister: LocalStoragePersister,
    protected readonly notification: NotificationService,
    private readonly analysisConfigurables: AnalysisConfigurablesService,
    protected readonly searchService: SearchService,
    private readonly shareService: ShareService,
    private readonly tracker: Tracker,
    protected readonly leafletLoadingService: LeafletLoadingService,
    protected readonly metadataStatusService: MetaDataStatusService,
    protected readonly aaaiService: AaaiService,
    private dialog: MatDialog,
  ) {
    super(configurables, dialogService, loadingService, landingService, panelsEvent, resultPanelService, localStoragePersister, notification, searchService, leafletLoadingService, metadataStatusService, model, aaaiService);

    this.context = CONTEXT_RESOURCE;
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.domainSubscription.push(
      this.landingService.domainObs.subscribe((domains) => {

        if (domains !== null) {
          this.domains = domains;

          this.subscriptions.push(

            this.model.domainMI.valueObs.subscribe((selectedDomain: Domain) => {
              this.onChangeDomain(selectedDomain);
            }),

            this.model.dataDiscoverResponse.valueObs.subscribe((discoverResponse: DiscoverResponse) => {
              this.onChangeResponse(discoverResponse, this.model.domainMI, this.model.dataSearchTypeData);
              this.resultPanelService.setCounterData(this.data.length);
            }),

            this.analysisConfigurables.triggerEnvironmentSelectionObs.subscribe((environment: Environment | null) => {
              this.environmentSelected = environment;
            }),

            this.tourService.triggerInformationDialogForTourObservable.subscribe(() => {
              this.openDetailsDialogForTour();
            }),

            this.tourService.triggerInfoIconStepObservable.subscribe(() => {
              this.addServiceInfoIconStep(this.serviceParent);
            }),
            this.tourService.advancedSerachItemSelectedObservable.subscribe(() => {
              this.triggerAdvancedSearchFilterButton();
            }),
            this.shareService.triggerRemoveAllFavoritesObservable.subscribe(() => {
              this.removeAllFavourites(true);
            }),
          );
        }
      })
    );

    const activeDomainCode = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_DOMAIN_OPEN) as string | boolean ?? false;
    if (activeDomainCode !== false && activeDomainCode !== '') {
      this.loadingService.showLoading(true);
      this.toggleDomain(activeDomainCode, false);

      this.activeDomainData = this.configurables.getDomainInfoBy(this.domains, activeDomainCode as string, 'code');
    }
  }

  public addServiceItemTourStep(): void {
    const serviceItem = document.getElementById('distributionListTable')?.children[1].children[3] as HTMLTableElement;
    const tourName = 'EPOS Overview';
    const options: Popover = {
      title: `<span class="tour-title"><strong>Tour:</strong> ${tourName}</span>Service Item`,
      // eslint-disable-next-line max-len
      description: 'This is a service item, found within the applied filters above. You can select the service by clicking on the service title.',
      side: 'right',
    };
    this.serviceParent = serviceItem;
    this.tourService.addStep(tourName, serviceItem, options, 9, true);
    this.subscriptions.push(
      this.tourService.tourStepForwardObservable.subscribe((value: ElementRef<HTMLElement>) => {
        if (value.nativeElement.id === serviceItem.id) {
          this.addServiceInfoStep();
        }
      })
    );
  }

  public addServiceInfoStep(): void {
    const serviceInformationsElement =
      this.serviceParent.children.item(0)?.children.item(0)?.children.item(1) as HTMLElement;
    serviceInformationsElement.id = 'serviceInformationsElementID';
    const tourName = 'EPOS Overview';
    const options: Popover = {
      title: `<span class="tour-title"><strong>Tour:</strong> ${tourName}</span>Service Information`,
      // eslint-disable-next-line max-len
      description: '<strong>Categories:</strong> These are the associated categories of an item. Click the category link to filter by that specific category. <p>&nbsp;</p>' +
        // eslint-disable-next-line max-len
        '<strong>Visible on:</strong> The service can be visualized in Map, Table or Graph depending on the associated data formats. If no visualisation of the service is available then the data can only be downloaded. <p>&nbsp;</p>',
      side: 'right',
    };
    this.tourService.addStep(tourName, serviceInformationsElement, options, 10);
    this.subscriptions.push(
      this.tourService.tourStepEnterObservable.subscribe((value: ElementRef<HTMLElement>) => {
        if (value.nativeElement.id === 'serviceInformationsElementID') {
          const itemSelected = this.data.find((item: DistributionItem) => item.distId === this.serviceParent.id);
          // Selects and expands item
          this.select(itemSelected as DistributionItem);
        }
        this.tourService.triggerHandleCloseNotification();
      }),
      this.tourService.tourStepForwardObservable.subscribe((value: ElementRef<HTMLElement>) => {
        if (value.nativeElement.id === 'serviceInformationsElementID') {
          this.addAdvancedFiltersStep();
        }
      })
    );
  }

  public addAdvancedFiltersStep(): void {
    this.serviceParent.scrollIntoView();
    const serviceStatusElement =
      this.serviceParent.children.item(0)?.children.item(0)?.children.item(2)?.children.item(0)?.children.item(1) as HTMLElement;
    serviceStatusElement.id = 'serviceAdvacnedFiltersId';
    const tourName = 'EPOS Overview';
    const options: Popover = {
      title: `<span class="tour-title"><strong>Tour:</strong> ${tourName}</span>Advanced Search Filters`,
      description: 'The service can be configured here. Click here to open a larger service configuration window.',
      side: 'right',
    };
    this.tourService.addStep(tourName, serviceStatusElement, options, 11);

    this.subscriptions.push(
      this.tourService.tourStepForwardObservable.subscribe((value: ElementRef<HTMLElement>) => {
        if (value.nativeElement.id === 'serviceAdvacnedFiltersId') {
          this.addAdvancedFiltersDownloadStep();
        }
      }));

  }

  public addAdvancedFiltersDownloadStep(): void {
    const serviceStatusElement = document.getElementById('configDownloadID') as HTMLElement;
    const tourName = 'EPOS Overview';
    const options: Popover = {
      title: `<span class="tour-title"><strong>Tour:</strong> ${tourName}</span>Download`,
      description: 'Click here to see all avaliable formats that can be downloaded.',
      side: 'right',
    };
    this.tourService.addStep(tourName, serviceStatusElement, options, 12);
    this.subscriptions.push(
      this.tourService.tourStepForwardObservable.subscribe((value: ElementRef<HTMLElement>) => {
        if (value.nativeElement.id === 'configDownloadID') {
          this.addServiceStatusStep(this.serviceParent);
        }
      }),
      this.tourService.tourStepBackwardObservable.subscribe((value: ElementRef<HTMLElement>) => {
        if (value.nativeElement.id === 'configDownloadID') {
          this.addAdvancedFiltersStep();
        }
      })
    );
  }

  public addServiceStatusStep(serviceChild: HTMLElement): void {
    this.serviceParent.scrollIntoView();
    const serviceStatusIcon =
      serviceChild.children.item(0)?.children.item(0)?.children.item(0)?.children.item(1)?.children.item(0) as HTMLElement;
    serviceStatusIcon.id = 'serviceStatusIconId';
    const tourName = 'EPOS Overview';
    const options: Popover = {
      title: `<span class="tour-title"><strong>Tour:</strong> ${tourName}</span> Status`,
      description: 'Availability of the services is checked regularly by a monitoring system. The status of a service, if available is displayed.',
      side: 'right',
    };
    this.tourService.addStep(tourName, serviceStatusIcon, options, 13);
    this.subscriptions.push(
      this.tourService.tourStepForwardObservable.subscribe((value: ElementRef<HTMLElement>) => {
        if (value.nativeElement.id === 'serviceStatusIconId') {
          this.addServiceInfoIconStep(this.serviceParent);
          this.tourService.triggerInformationDialogForTourCall();
        }
      })
    );
  }

  public addServiceInfoIconStep(serviceChild: HTMLElement): void {
    this.serviceParent.scrollIntoView();
    const serviceInfoIcon =
      serviceChild.children.item(0)?.children.item(0)?.children.item(0)?.children.item(1)?.children.item(1) as HTMLElement;
    serviceInfoIcon.id = 'serviceInfoIconId';
    const tourName = 'EPOS Overview';
    const options: Popover = {
      title: `<span class="tour-title"><strong>Tour:</strong> ${tourName}</span>Service Information`,
      description: 'Click the \'i\' for details about a dataset',
      side: 'right',
    };
    this.tourService.addStep(tourName, serviceInfoIcon, options, 14);
    this.subscriptions.push(
      this.tourService.tourStepForwardObservable.subscribe((value: ElementRef<HTMLElement>) => {
        if (value.nativeElement.id === 'serviceInfoIconId') {
          this.addServiceFavoriteIconStep(this.serviceParent);
        }
      }),
      this.tourService.tourStepEnterObservable.subscribe((value: ElementRef<HTMLElement>) => {
        if (value.nativeElement.id === 'serviceInfoIconId') {
          // const itemSelected = this.data.find((item: DistributionItem) => item.distId === this.serviceParent.id);
          // // Selects and expands item
          // this.select(itemSelected as DistributionItem);
          this.addServiceStatusStep(this.serviceParent);
        }
      }),
      this.tourService.tourStepBackwardObservable.subscribe((value: ElementRef<HTMLElement>) => {
        if (value.nativeElement.id === 'serviceInfoIconId') {
          this.addAdvancedFiltersDownloadStep();
        }
      })
    );
  }

  public addServiceFavoriteIconStep(serviceChild: HTMLElement): void {
    const serviceFavoriteIcon =
      serviceChild.children.item(0)?.children.item(0)?.children.item(0)?.children.item(1)?.children.item(2) as HTMLElement;
    serviceFavoriteIcon.id = 'serviceFavoriteIconId';
    const tourName = 'EPOS Overview';
    const options: Popover = {
      title: `<span class="tour-title"><strong>Tour:</strong> ${tourName}</span>Favourites`,
      description: 'Click the star icon to add a dataset to your favourites.',
      side: 'right',
    };
    this.tourService.addStep(tourName, serviceFavoriteIcon, options, 16);
    this.subscriptions.push(
      this.tourService.tourStepForwardObservable.subscribe((value: ElementRef<HTMLElement>) => {
        if (value.nativeElement.id === 'serviceFavoriteIconId') {
          this.addMultipleFavouritesStep();
          const itemSelected = this.data.find((item: DistributionItem) => item.distId === this.serviceParent.id);
          // Selects and expands item
          this.select(itemSelected as DistributionItem);
        }
      }),
      this.tourService.tourStepBackwardObservable.subscribe((element: ElementRef<HTMLElement>) => {
        if (element.nativeElement.id === 'serviceFavoriteIconId') {
          this.tourService.triggerInformationDialogForTourCall();
        }
      })
    );
  }

  public addMultipleFavouritesStep(): void {
    const elem = document.getElementsByClassName('domain-results').item(0) as HTMLElement;
    elem.id = 'domainResultsId';
    const tourName = 'EPOS Overview';
    const options: Popover = {
      title: `<span class="tour-title"><strong>Tour:</strong> ${tourName}</span>Favourites`,
      description: 'When added to favourites, multiple datasets are visible at once.',
      side: 'right',
    };
    this.tourService.addStep(tourName, elem, options, 17);

    clearTimeout(this.favTimeout);

    this.favTimeout = setTimeout(() => {
      if (this.configurables.getAllPinned().length !== 1) {
        const itemSelected = this.data.find((item: DistributionItem) => item.distId === this.serviceParent.id) as DistributionItem;
        this.favourite(itemSelected);
        const clearFavButton = document.getElementsByClassName('results-container').item(0) as HTMLElement;

        if (clearFavButton) {
          clearFavButton.scrollTop = 0;
        }
      }
      this.landingService.setDomainDuringTour('FAV');
    }, 100);
    this.subscriptions.push(
      this.tourService.tourStepForwardObservable.subscribe((element: ElementRef<HTMLElement>) => {
        if (element.nativeElement.id === 'domainResultsId') {
          this.addCustomiseLayerStep();
        }
      }),
      this.tourService.tourStepBackwardObservable.subscribe((element: ElementRef<HTMLElement>) => {
        if (element.nativeElement.id === 'domainResultsId') {
          this.landingService.setDomainDuringTour('SEI');
          this.addServiceFavoriteIconStep(this.serviceParent);
        }
      })
    );
  }

  public addCustomiseLayerStep(): void {
    const tourName = 'EPOS Overview';
    const elem = document.getElementById('custom-layer-control') as HTMLElement;

    const options: Popover = {
      title: `<span class="tour-title"><strong>Tour:</strong> ${tourName}</span>Customise layers`,
      description: 'Customise layers in map view, change the basemap, toggle layers on/off and view legend.',
      side: 'left',
    };
    this.tourService.addStep(tourName, elem, options, 18);

    this.subscriptions.push(
      this.tourService.tourStepForwardObservable.subscribe((element: ElementRef<HTMLElement>) => {
        if (element.nativeElement.id === 'custom-layer-control') {
          this.addTableVisStep();
        }
      })
    );
  }

  public addTableVisStep(): void {
    const tableToggle = document.getElementById('table-vis-toggle') as HTMLElement;
    const tourName = 'EPOS Overview';
    const options: Popover = {
      title: `<span class="tour-title"><strong>Tour:</strong> ${tourName}</span>Table View`,
      description: 'Tabular data can be viewed by clicking on this tab.',
      side: 'left',
    };
    this.tourService.addStep(tourName, tableToggle, options, 19);
    this.subscriptions.push(
      this.tourService.tourStepForwardObservable.subscribe((value: ElementRef<HTMLElement>) => {
        if (value.nativeElement.id === 'table-vis-toggle') {
          this.addGraphVisStep();
        }
      })
    );
  }

  public addGraphVisStep(): void {
    const tableToggle = document.getElementById('graph-vis-toggle') as HTMLElement;
    const tourName = 'EPOS Overview';
    const options: Popover = {
      title: `<span class="tour-title"><strong>Tour:</strong> ${tourName}</span>Graph View`,
      description: 'Graph or time series data can be viewed by clicking on this tab.',
      side: 'left',
    };
    this.tourService.addStep(tourName, tableToggle, options, 20);
  }

  public openDetailsDialogForTour(): void {
    const favouriteSelected = this.data.find((item: DistributionItem) => item.distId === this.serviceParent.id);
    this.openDialog(favouriteSelected as DistributionItem);
  }

  /**
   * The `select` function in TypeScript tracks a distribution item selection event and resets the
   * version if triggered by a click event.
   * @param {DistributionItem | null} itemSelected - The `itemSelected` parameter in the `select`
   * method represents the item that has been selected for distribution. It can be of type
   * `DistributionItem` or `null`, indicating that no item has been selected.
   * @param {Event | null} [event=null] - The `event` parameter in the `select` method is used to pass
   * an Event object that represents the event triggering the selection. In the provided code snippet,
   * the method checks if the `event` parameter is not null to perform certain actions, such as
   * tracking an event and resetting a version. If
   */
  public select(itemSelected: DistributionItem, event: Event | null = null): void {

    // if (nothing expanded OR (event not null AND item not null AND selected item is not the currently expanded one))
    if (this.expandedElement === null || (event !== null && itemSelected !== null && itemSelected !== this.expandedElement)) {
      // click
      this.tracker.trackEvent(TrackerCategory.DISTRIBUTION, TrackerAction.SELECT_DISTRIBUTION, this.formatTrackerDistributionName(itemSelected!));

    }

    super.select(itemSelected);
  }

  /**
   * The `favourite` function checks if an element is in the favourites list, tracks the action, and
   * resets the version if needed before calling the superclass method.
   * @param {DistributionItem} element - The `element` parameter in the `favourite` function represents
   * an item that is being added to or removed from the favourites list. It is of type
   * `DistributionItem`.
   * @param {Event | null} [event=null] - The `event` parameter in the `favourite` function is of type
   * `Event | null`, which means it can either be an `Event` object or `null`. This parameter is used
   * to track events when a certain condition is met in the function. If the `event` parameter is not
   */
  public favourite(element: DistributionItem, event: Event | null = null): void {

    const inFavouritesList = this.configurables.getAllPinned().filter(_elem => {
      return _elem.id === element.id;
    });

    if (this.tourService.isActive() === false && event !== null) {
      // track
      this.tracker.trackEvent(TrackerCategory.DISTRIBUTION, (inFavouritesList.length === 0 ? TrackerAction.ADD_TO_FAVOURITE : TrackerAction.REMOVE_FROM_FAVOURITE), this.formatTrackerDistributionName(element));

    }
    super.favourite(element, event);
  }

  /**
   * The function `openDialog` tracks an event and then opens a dialog with details of a distribution
   * item.
   * @param {DistributionItem} element - The `element` parameter in the `openDialog` method represents
   * a `DistributionItem` object that is being passed to the method.
   */
  public openDialog(element: DistributionItem): void {

    if (this.tourService.isActive() === false) {
      // track
      this.tracker.trackEvent(TrackerCategory.DISTRIBUTION, TrackerAction.SHOW_DETAILS, this.formatTrackerDistributionName(element));
    }

    super.openDialog(element);
  }

  public triggerAdvancedSearchFilterButton() {
    const iconElements = document.getElementsByClassName('expand-item');
    if (iconElements.length > 0) {
      const iconElement = iconElements[3] as HTMLElement; // Access the first matching element
      iconElement.click(); // Simulate the click on the element
    }
  }
  public openMonitoringPopup(event: Event, element: DistributionItem): void {
  event.stopPropagation();
  this.dialog.open(MonitoringPopupComponent, {
    width: '450px',
    height: 'auto',
    data: {
      serviceName: element.name,
      status: element.status,
      statusTimestamp: element.statusTimestamp || '',
      monitoringUrl: element.statusURL,
    },
    disableClose: false,
    panelClass: 'monitoring-popup-dialog'
  });
}

  protected updateConfigs(): void {
    super.updateConfigs();
    this.configurables.updateSpatialBounds(this.model.dataSearchBounds.get());
    this.configurables.updateTemporalRange(this.model.dataSearchTemporalRange.get());
  }

  private formatTrackerDistributionName(elem: DistributionItem): string {
    return elem.code + Tracker.TARCKER_DATA_SEPARATION + elem.name;
  }

}
