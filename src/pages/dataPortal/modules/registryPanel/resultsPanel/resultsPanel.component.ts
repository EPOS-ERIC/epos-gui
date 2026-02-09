import { AfterContentInit, Component, HostListener, OnInit } from '@angular/core';
import { DiscoverResponse } from 'api/webApi/classes/discoverApi.interface';
import { Domain } from 'api/webApi/data/domain.interface';
import { Model } from 'services/model/model.service';
import { DialogService } from 'components/dialog/dialog.service';
import { LoadingService } from 'services/loading.service';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';
import { ResultsPanelService } from 'pages/dataPortal/services/resultsPanel.service';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { NotificationService } from 'services/notification.service';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { LandingService } from '../services/landing.service';
import { DataSearchConfigurablesServiceRegistry } from '../services/dataSearchConfigurables.service';
import { CONTEXT_FACILITY } from 'api/api.service.factory';
import { BaseResultsPanelComponent } from 'components/baseResultsPanel/baseResultsPanel.component';
import { SearchService } from '../../../../../services/search.service';
import { LeafletLoadingService } from '../../../../../utility/eposLeaflet/services/leafletLoading.service';
import { MetaDataStatusService } from 'services/metaDataStatus.service';
import { AaaiService } from 'api/aaai.service';

@Unsubscriber(['domainSubscription', 'subscriptions'])
@Component({
  selector: 'app-results-panel',
  templateUrl: 'resultsPanel.component.html',
  styleUrls: ['../../../../../components/baseResultsPanel/baseResultsPanel.component.scss'],
})
export class ResultsPanelComponent extends BaseResultsPanelComponent implements OnInit, AfterContentInit {

  constructor(readonly model: Model,
    public readonly configurables: DataSearchConfigurablesServiceRegistry,
    protected readonly dialogService: DialogService,
    protected readonly loadingService: LoadingService,
    protected readonly landingService: LandingService,
    protected readonly panelsEvent: PanelsEmitterService,
    protected readonly resultPanelService: ResultsPanelService,
    protected readonly localStoragePersister: LocalStoragePersister,
    protected readonly notification: NotificationService,
    protected readonly searchService: SearchService,
    protected readonly leafletLoadingService: LeafletLoadingService,
    protected readonly metadataStatusService: MetaDataStatusService,
    protected readonly aaaiService: AaaiService
  ) {
    super(configurables, dialogService, loadingService, landingService, panelsEvent, resultPanelService, localStoragePersister, notification, searchService, leafletLoadingService, metadataStatusService, model, aaaiService);

    this.context = CONTEXT_FACILITY;
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(): void {
    this.configurables.setSelected(null, true);
  }

  /**
   * The `ngOnInit` function initializes the component by subscribing to various observables and
   * performing some initial setup tasks.
   */
  ngOnInit(): void {
    super.ngOnInit();
    this.domainSubscription.push(

      // waiting list of domains
      this.landingService.domainObs.subscribe((domains) => {

        if (domains !== null) {
          this.domains = domains;

          this.subscriptions.push(
            this.model.domainMIReg.valueObs.subscribe((selectedDomain: Domain) => {
              this.onChangeDomain(selectedDomain);
            }),

            this.model.dataDiscoverResponseReg.valueObs.subscribe((discoverResponse: DiscoverResponse) => {

              this.onChangeResponse(discoverResponse, this.model.domainMIReg, null);

              this.resultPanelService.setCounterRegistry(this.data.length);

            }),

          );
        }
      }),
    );

    const activeDomainCode = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_DOMAIN_OPEN + CONTEXT_FACILITY) as string | boolean ?? false;
    if (activeDomainCode !== false && activeDomainCode !== '') {
      this.loadingService.showLoading(true);
      this.toggleDomain(activeDomainCode, false);

      this.activeDomainData = this.configurables.getDomainInfoBy(this.domains, activeDomainCode as string, 'code');
    }
  }

  /**
   * The updateConfigs function updates spatial bounds and equipment types based on data search bounds
   * and equipment types.
   */
  protected updateConfigs(): void {
    super.updateConfigs();

    this.configurables.updateSpatialBounds(this.model.dataSearchBoundsReg.get());
    this.configurables.updateEquipmentTypes(this.model.dataSearchEquipmentTypeReg.get());

  }

}
