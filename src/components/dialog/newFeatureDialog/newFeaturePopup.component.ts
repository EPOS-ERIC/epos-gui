import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

export interface NewFeatureData {
  version: string;
  features: string[];
}

@Component({
  selector: 'app-new-featurepopup',
  standalone: true,
  imports: [CommonModule,MatDialogModule],
  templateUrl: './newFeaturePopup.component.html',
  styleUrls: ['./newFeaturePopup.component.scss'],
})
export class NewFeaturePopupComponent {
  constructor(
    public dialogRef: MatDialogRef<NewFeaturePopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NewFeatureData
  ) {}

  close(): void {
    // Save the current version as seen
    localStorage.setItem('newFeaturePopupSeen', this.data.version);
    this.dialogRef.close();
  }
}
