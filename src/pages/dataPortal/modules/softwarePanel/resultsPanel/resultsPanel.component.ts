import { AfterContentInit, Component, OnInit } from '@angular/core';
import { DiscoverResponse } from 'api/webApi/classes/discoverApi.interface';
import { Domain } from 'api/webApi/data/domain.interface';
import { DataSearchConfigurablesServiceSoftware } from '../services/dataSearchConfigurables.service';
import { Model } from 'services/model/model.service';
import { DialogService } from 'components/dialog/dialog.service';
import { LoadingService } from 'services/loading.service';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';
import { ResultsPanelService } from 'pages/dataPortal/services/resultsPanel.service';
import { LandingServiceSoftware } from '../services/landing.service';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { NotificationService } from 'services/notification.service';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { CONTEXT_SOFTWARE } from 'api/api.service.factory';
import { BaseResultsPanelComponent } from 'components/baseResultsPanel/baseResultsPanel.component';
import { SearchService } from '../../../../../services/search.service';
import { ShareService } from 'services/share.service';
import { MetaDataStatusService } from 'services/metaDataStatus.service';
import { AaaiService } from 'api/aaai.service';
import { LeafletLoadingService } from 'utility/eposLeaflet/services/leafletLoading.service';

@Unsubscriber(['domainSubscription', 'subscriptions'])
@Component({
  selector: 'app-results-panel',
  templateUrl: 'resultsPanel.component.html',
  styleUrls: ['../../../../../components/baseResultsPanel/baseResultsPanel.component.scss'],
})
export class ResultsPanelComponent extends BaseResultsPanelComponent implements OnInit, AfterContentInit {
  constructor(
    readonly model: Model,
    public readonly configurables: DataSearchConfigurablesServiceSoftware,
    protected readonly dialogService: DialogService,
    protected readonly loadingService: LoadingService,
    protected readonly landingService: LandingServiceSoftware,
    protected readonly panelsEvent: PanelsEmitterService,
    protected readonly resultPanelService: ResultsPanelService,
    protected readonly localStoragePersister: LocalStoragePersister,
    protected readonly notification: NotificationService,
    protected readonly searchService: SearchService,
    protected readonly leafletLoadingService: LeafletLoadingService,
    private readonly shareService: ShareService,
    protected readonly metadataStatusService: MetaDataStatusService,
    protected readonly aaaiService: AaaiService,
  ) {

    super(
      configurables,
      dialogService,
      loadingService,
      landingService,
      panelsEvent,
      resultPanelService,
      localStoragePersister,
      notification,
      searchService,
      leafletLoadingService,
      metadataStatusService,
      model,
      aaaiService,
    );

    this.context = CONTEXT_SOFTWARE;
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.domainSubscription.push(
      this.landingService.domainObs.subscribe((domains) => {
        if (domains !== null) {
          this.domains = domains;

          this.subscriptions.push(
            this.model.domainMISoft.valueObs.subscribe((selectedDomain: Domain) => {
              this.onChangeDomain(selectedDomain);
            }),

            this.model.dataDiscoverResponseSoft.valueObs.subscribe((discoverResponse: DiscoverResponse) => {
              this.onChangeResponse(discoverResponse, this.model.domainMISoft, this.model.dataSearchTypeDataSoft);
              this.resultPanelService.setCounterSoftware(this.data.length);
            }),

            this.shareService.triggerRemoveAllFavoritesObservable.subscribe(() => {
              this.removeAllFavourites(true);
            }),
          );
        }
      }),
    );

    const activeDomainCode = (this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_DOMAIN_OPEN + CONTEXT_SOFTWARE) as string | boolean) ?? false;
    if (activeDomainCode !== false && activeDomainCode !== '') {
      this.loadingService.showLoading(true);
      this.toggleDomain(activeDomainCode, false);

      this.activeDomainData = this.configurables.getDomainInfoBy(this.domains, activeDomainCode as string, 'code');
    }
  }

  /**
   * Aggiorna le configurazioni. Le logiche specifiche per limiti spaziali e temporali sono state rimosse
   * perché non pertinenti per i software.
   */
  protected updateConfigs(): void {
    super.updateConfigs();
    // Non sono più necessari aggiornamenti specifici per limiti spaziali o temporali.
  }
}
