import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogData } from '../baseDialogService.abstract';

/**
 * This is the "Disclaimer" dialog.
 */
@Component({
  selector: 'app-disclaimer-dialog',
  templateUrl: './disclaimerDialog.component.html',
  styleUrls: ['./disclaimerDialog.component.scss']
})
export class DisclaimerDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) { }

}
