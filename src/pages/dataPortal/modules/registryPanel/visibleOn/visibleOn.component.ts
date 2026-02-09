import { Component } from '@angular/core';
import { MapInteractionService } from 'utility/eposLeaflet/services/mapInteraction.service';
import { VisibleOnComponent as MainVisibileOnComponent } from 'components/visibleOn/visibleOn.component';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { DialogService } from 'components/dialog/dialog.service';
import { LeafletLoadingService } from 'utility/eposLeaflet/services/leafletLoading.service';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';

@Component({
  selector: 'app-visible-on-registry',
  templateUrl: './visibleOn.component.html',
  styleUrls: ['./visibleOn.component.scss'],
  animations: [
  ],
})
export class VisibleOnComponent extends MainVisibileOnComponent {

  constructor(
    protected readonly panelsEvent: PanelsEmitterService,
    protected readonly mapInteractionService: MapInteractionService,
    protected readonly leafletLoadingService: LeafletLoadingService,
    protected readonly dialogService: DialogService,
    protected localStoragePersister: LocalStoragePersister
  ) {
    super(panelsEvent, mapInteractionService, leafletLoadingService, dialogService, localStoragePersister);
  }

}

