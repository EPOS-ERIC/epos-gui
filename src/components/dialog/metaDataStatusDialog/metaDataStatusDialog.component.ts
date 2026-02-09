import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MetaDataStatusService } from 'services/metaDataStatus.service';
import { DialogData } from '../baseDialogService.abstract';

export interface ConfirmationDataIn {
  dialogTitle: string;
  closable: boolean;
  userRole: string;
  activateMetaDataStatusCssClass: string;
  cancelButtonHtml: string;
}

@Component({
  selector: 'app-metadata-status-dialog',
  templateUrl: './metaDataStatusDialog.component.html',
  styleUrls: ['./metaDataStatusDialog.component.scss']
})
export class MetaDataStatusDialogComponent{

  public noShowAgain: boolean;

  public defaultStatus = 'Published';
  public selectedStatusesDefault = [this.defaultStatus];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData<ConfirmationDataIn, boolean>,
    private metadataStatusService: MetaDataStatusService
  ) {
    this.noShowAgain = false;
  }

  public setCheckbox(): void {
    this.setNoShowAgain(this.noShowAgain);
  }

  public setNoShowAgain(noShowAgain: boolean){
    this.metadataStatusService.setNoShowAgain(noShowAgain);
  }

  public enableMetadataStatusMode(): void {
    this.close(true);
    this.metadataStatusService.metadataStatusModeActive.next(true);
    this.metadataStatusService.metadataSelectedStatuses.next(this.selectedStatusesDefault);
  }
  public continue(): void {
    this.close(false);
  }

  private close(confirmed: boolean): void {
    this.data.dataOut = confirmed;
    this.data.close();
  }

}
