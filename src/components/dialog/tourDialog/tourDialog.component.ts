import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TourService } from 'services/tour.service';
import { DialogData } from '../baseDialogService.abstract';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';

@Component({
  selector: 'app-tour-dialog',
  templateUrl: './tourDialog.component.html',
  styleUrls: ['./tourDialog.component.scss']
})
export class TourDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<TourDialogComponent>,
    private readonly tourService: TourService,
    private readonly panelsEvent: PanelsEmitterService,
  ) { }

  public handleClose(): void {
    this.dialogRef.close();
  }

  public handleShowAgain(checked: boolean): void {
    if (checked) {
      // Don't show again
      localStorage.setItem('tourCompleted', 'true');
    } else {
      // Keep showing
      localStorage.setItem('tourCompleted', 'false');
    }
  }

  public handleStartTour(event: Event): void {
    this.tourService.startEposFiltersTour(event);
    // }, 100);
    this.data.close();
    this.panelsEvent.invokeTablePanelClose.emit();
    this.panelsEvent.invokeGraphPanelClose.emit();
  }
}
