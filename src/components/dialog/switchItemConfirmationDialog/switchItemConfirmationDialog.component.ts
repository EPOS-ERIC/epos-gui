import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SwitchDistributionItemService } from 'services/switchDistributionItem.service';
import { DialogData } from '../baseDialogService.abstract';

export interface ConfirmationDataIn {
  dialogTitle: string;
  addTofavouriteAndContinueButtonCssClass: string;
  expandedElementName: string;
  continueButtonHtml: string;
}

@Component({
  selector: 'app-switch-item-confirmation-dialog',
  templateUrl: './switchItemConfirmationDialog.component.html',
  styleUrls: ['./switchItemConfirmationDialog.component.scss', '../../baseResultsPanel/baseResultsPanel.component.scss']
})
export class SwitchItemConfirmationDialogComponent{

  public noShowAgain: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData<ConfirmationDataIn, boolean>,
    private switchDistributionItem: SwitchDistributionItemService
  ) {
    this.noShowAgain = false;
  }

  public setCheckbox(): void {
    this.setNoShowAgain(this.noShowAgain);
  }

  public setNoShowAgain(noShowAgain: boolean){
    this.switchDistributionItem.setNoShowAgain(noShowAgain);
  }

  public favouriteAndContinue(): void {
    this.close(true);
  }
  public continue(): void {
    this.close(false);
  }

  private close(confirmed: boolean): void {
    this.data.dataOut = confirmed;
    this.data.close();
  }

}
