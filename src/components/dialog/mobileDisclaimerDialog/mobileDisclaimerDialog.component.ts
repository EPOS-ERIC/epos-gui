import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from 'environments/environment';
import { DialogData } from '../baseDialogService.abstract';

/**
 * This is the "Disclaimer" dialog.
 */
@Component({
  selector: 'app-mobile-disclaimer-dialog',
  templateUrl: './mobileDisclaimerDialog.component.html',
  styleUrls: ['./mobileDisclaimerDialog.component.scss']
})
export class MobileDisclaimerDialogComponent {

  public website = environment.homepage;
  public minWidth = environment.minWidth;

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) { }

}
