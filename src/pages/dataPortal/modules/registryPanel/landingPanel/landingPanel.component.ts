import { AfterContentInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';
import { ResultsPanelService } from 'pages/dataPortal/services/resultsPanel.service';
import { Domain } from 'api/webApi/data/domain.interface';
import { LandingService } from '../services/landing.service';
import { DataSearchConfigurablesServiceRegistry } from '../services/dataSearchConfigurables.service';
import { ResultsPanelComponent } from '../resultsPanel/resultsPanel.component';
import { DistributionItem } from 'api/webApi/data/distributionItem.interface';
import { CONTEXT_FACILITY } from 'api/api.service.factory';

@Unsubscriber('subscriptions')
@Component({
  selector: 'app-landing-panel',
  templateUrl: './landingPanel.component.html',
  styleUrls: ['./landingPanel.component.scss'],
})
export class LandingPanelComponent implements OnInit, AfterContentInit {
  @ViewChild('blockResults') blockResults: ElementRef;
  @ViewChild(ResultsPanelComponent) private resultPanelComponent: ResultsPanelComponent;

  public showLanding = true;
  public activeDomainCode: string | boolean = false;
  public domainResultsCounter: Array<number> = [];
  public data: Array<DistributionItem>;

  public domains: Array<Domain>;

  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  constructor(
    private landingService: LandingService,
    private readonly configurables: DataSearchConfigurablesServiceRegistry,
    private readonly localStoragePersister: LocalStoragePersister,
    private readonly panelsEventEmitter: PanelsEmitterService,
    private readonly resultPanelService: ResultsPanelService
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

    const activeDomainCode = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_DOMAIN_OPEN + CONTEXT_FACILITY) as string | null ?? false;
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

}
