import { Component, Input } from '@angular/core';
import { DialogData } from '../baseDialogService.abstract';
import { MatDialog } from '@angular/material/dialog';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';

@Component({
  selector: 'app-base-dialog',
  templateUrl: './baseDialog.component.html',
  styleUrls: ['./baseDialog.component.scss'],
})
export class BaseDialogComponent {
  @Input() data: DialogData;
  @Input() title = '';
  /**
   * Function to be called when the dialog is closed using the close button.
   */
  @Input() closingFunction: () => void;

  // Dialog that acts as a wrapper for other dialogs.
  constructor(
    public readonly dialog: MatDialog,
    private readonly localStoragePersister: LocalStoragePersister,
  ) {
  }

  public closing(): void {
    if (this.dialog.getDialogById('detailsDialog') !== undefined) {
      this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, '', false, LocalStorageVariables.LS_LAST_DETAIL_DIALOG_ID);
    }

    // If a closing function has been set, call it.
    if (this.closingFunction) {
      this.closingFunction();
    }
  }
}
