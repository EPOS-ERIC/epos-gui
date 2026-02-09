import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

export interface MonitoringPopupData {
  serviceName: string;
  status: number;
  statusTimestamp: string;
  monitoringUrl: string;
}

@Component({
  selector: 'app-monitoring-popup',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './monitoring-popup.component.html',
  styleUrls: ['./monitoring-popup.component.scss'],
})
export class MonitoringPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<MonitoringPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MonitoringPopupData
  ) {}

  goToMonitoring(): void {
    window.open(this.data.monitoringUrl, '_blank', 'noopener,noreferrer');
    this.dialogRef.close();
  }

  close(): void {
    this.dialogRef.close();
  }
}  //
