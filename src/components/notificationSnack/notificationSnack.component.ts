import { Component, Inject, Injector, OnInit } from '@angular/core';
import {
  MatSnackBarRef,
  MAT_SNACK_BAR_DATA,
} from '@angular/material/snack-bar';
import { NotificationService } from 'services/notification.service';
import { ISnackbar } from './notificationSnack.interface';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { MatCheckboxChange } from '@angular/material/checkbox';

@Component({
  selector: 'app-notification-snack',
  templateUrl: './notificationSnack.component.html',
  styleUrls: ['./notificationSnack.component.scss'],
})
export class NotificationSnackComponent implements OnInit {

  public typeSuccess = NotificationService.TYPE_SUCCESS;
  public typeInfo = NotificationService.TYPE_INFO;
  public typeWarning = NotificationService.TYPE_WARNING;
  public typeError = NotificationService.TYPE_ERROR;
  public typeLoadingDistribution = NotificationService.LOADING_DISTRIBUTION;
  public typeAvailableGuidedTour = NotificationService.AVAILABLE_GUIDED_TOUR;

  // flag to handle the don't show again of a snackbar (if present)
  public dontShowAgain: boolean = false;

  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: ISnackbar,
    private snackbarRef: MatSnackBarRef<NotificationSnackComponent>,
    private injector: Injector,
    private localStoragePersister: LocalStoragePersister,
  ) { }



  ngOnInit(): void {
  // called whenever a snackbar is dismissed
    this.snackbarRef.afterDismissed().subscribe(() => {
    // manage the "Don't show again" option of the Available Guided Tour snackbar (for possible future needs: other snackbar types 'dismissing' as well can be managed here !)
      if (this.data.type === NotificationService.AVAILABLE_GUIDED_TOUR) {
        const dontShowAgainValue = this.snackbarRef.instance.dontShowAgain;
        this.localStoragePersister.set(LocalStorageVariables.LS_GUIDE_TOUR_SNACKBAR_CHECK, dontShowAgainValue);
      }
    });
  }



  public handleClose(): void {
    this.snackbarRef.dismiss();
  }

  public setDontShowAgain(matChecked: MatCheckboxChange): void {
    if (matChecked.checked === true) {
      this.dontShowAgain = true;
    }else {
      this.dontShowAgain = false;
    }
  }

  public async startGuidedTourFromSnackBar(event: Event): Promise<void> {
    try {
      // there is a cyclic build dependency on the tour service and the notification service so we load the import lazily
      const { TourService } = await import('services/tour.service');
      const tourService = this.injector.get(TourService, null);
      if (tourService) {
        tourService.startEposFiltersTour(event);
        // Set the flag to true when the tour starts...
        this.dontShowAgain = true;
        // ...and dismiss the snackbar
        this.snackbarRef.dismiss();
      }
    } catch (error) {
      console.error('Error accessing TourService:', error);
    }
  }
}
