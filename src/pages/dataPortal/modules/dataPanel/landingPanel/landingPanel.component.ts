import { AfterContentInit, AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ResultsPanelComponent } from '../resultsPanel/resultsPanel.component';
import { LandingService } from '../services/landing.service';
import { TourService } from 'services/tour.service';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';
import { ResultsPanelService } from 'pages/dataPortal/services/resultsPanel.service';
import { Domain } from 'api/webApi/data/domain.interface';
import { DistributionItem } from 'api/webApi/data/distributionItem.interface';
import { DataSearchConfigurablesServiceResource } from '../services/dataSearchConfigurables.service';
import { Tracker } from 'utility/tracker/tracker.service';
import { TrackerAction, TrackerCategory } from 'utility/tracker/tracker.enum';
import { Popover } from 'driver.js';

@Unsubscriber('subscriptions')
@Component({
  selector: 'app-landing-panel',
  templateUrl: './landingPanel.component.html',
  styleUrls: ['./landingPanel.component.scss'],
})
export class LandingPanelComponent implements OnInit, AfterContentInit, AfterViewInit {
  @ViewChild('blockResults') blockResults: ElementRef;
  @ViewChild(ResultsPanelComponent)
  private resultPanelComponent: ResultsPanelComponent;

  public showLanding = true;
  public activeDomainCode: string | boolean = false;
  public domainResultsCounter: Array<number> = [];
  public data: Array<DistributionItem>;

  public domains: Array<Domain>;

  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  constructor(
    private landingService: LandingService,
    private tourService: TourService,
    private readonly configurables: DataSearchConfigurablesServiceResource,
    private readonly localStoragePersister: LocalStoragePersister,
    private readonly panelsEventEmitter: PanelsEmitterService,
    private readonly resultPanelService: ResultsPanelService,
    private readonly tracker: Tracker,
  ) {
  }

  ngOnInit(): void {
    this.subscriptions.push(

      this.landingService.domainObs.subscribe(domains => {
        if (domains !== null) {
          this.domains = domains;
        }
      }),

      this.configurables.watchAll().subscribe(() => {
        // eslint-disable-next-line @typescript-eslint/dot-notation
        this.domainResultsCounter['FAV'] =
          this.configurables.getAllPinned().length;
      }),

      this.landingService.activeDomainSrcObs.subscribe((activeDomain: string | boolean) => {
        this.activeDomainCode = activeDomain;
      }),

      this.panelsEventEmitter.invokeDataPanelToggle.subscribe(() => {
        if (this.blockResults !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          this.resultPanelService.setLandingPanelTopSrc((this.blockResults.nativeElement as HTMLElement).offsetTop.toString());
        }
      }),

    );

    const activeDomainCode = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_DOMAIN_OPEN) as string | null ?? false;
    if (activeDomainCode !== false && activeDomainCode !== '') {
      this.landingService.showLanding(false);
      this.activeDomainCode = activeDomainCode;
      this.toggleDomain(activeDomainCode, false);
    }
  }

  ngAfterContentInit(): void {
    setTimeout(() => {
      this.subscriptions.push(
        this.landingService.showLandingObs.subscribe((showLanding: boolean) => {
          this.showLanding = showLanding;
        }),
      );
    });
  }

  /**
   * The ngAfterViewInit function calls the addTCSWrapperStep function.
   */
  ngAfterViewInit(): void {
    this.addTCSWrapperStep();
  }

  /** Set Domain selection
   * @param value Domain code.
   */
  public toggleDomain(value: string, checkForClose = true): void {
    if (this.domainResultsCounter[value] > 0) {

      // unselect last item
      this.configurables.setSelected(null, true);

      // reset pagination
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      this.resultPanelComponent.resetPagination();

      if (checkForClose === false) {
        this.landingService.setDomain((value === undefined) ? false : value);
      } else {
        this.landingService.setDomain((value === undefined || value === this.activeDomainCode) ? false : value);
        this.tracker.trackEvent(TrackerCategory.PANEL, TrackerAction.SELECT_DOMAIN, value);
      }
    }
  }

  /**
   * The function "getDistributionItemList" assigns the value of the "event" parameter to the "data" property.
   * @param {DistributionItem[]} event - The parameter "event" is an array of objects of type "DistributionItem".
   */
  public getDistributionItemList(event: DistributionItem[]): void {
    this.data = event;
  }

  /**
   * The function assigns the value of the event array to the domainResultsCounter property.
   * @param event - The parameter "event" is an array of numbers.
   */
  public getDomainResultsCounter(event: Array<number>): void {
    this.domainResultsCounter = event;
  }

  /**
   * The function `addTCSWrapperStep()` adds a step to a tour with a specific title, description,
   * position, and element, and sets a domain during the tour.
   */
  private addTCSWrapperStep(): void {
    const tCSWrapperStepElement = this.blockResults.nativeElement as HTMLElement;
    const tourName = 'EPOS Overview';
    const options: Popover = {
      title: `<span class="tour-title"><strong>Tour:</strong> ${tourName}</span>Thematic Core Service (TCS)`,
      description: 'Services within the chosen thematic domain e.g. Seismology',
      side: 'right',
    };
    this.tourService.addStep(tourName, tCSWrapperStepElement, options, 7);
    this.subscriptions.push(
      this.tourService.tourStepEnterObservable.subscribe((value: ElementRef<HTMLElement>) => {
        if (value.nativeElement.id === 'TCS-wrapper') {
          this.landingService.setDomainDuringTour('SEI');
        }
      })
    );
  }
}
