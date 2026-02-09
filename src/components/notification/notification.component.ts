import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { NotificationService } from './notification.service';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { TourService } from 'services/tour.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent implements OnInit, OnDestroy {

  @Input() showMessage = true;
  @Input() type = NotificationService.TYPE_INFO;
  @Input() id = '';
  @Input() checkShowAgain = false;
  @Input() title = '';
  @Input() message = '';

  @Output() showMessageEvent = new EventEmitter<boolean>();

  public icon = 'info';
  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  constructor(
    private readonly localStoragePersister: LocalStoragePersister,
    private readonly tourService: TourService
  ) {
  }
  ngOnInit(): void {
    switch (this.type) {
      case NotificationService.TYPE_INFO:
        this.icon = 'info';
        break;
      case NotificationService.TYPE_WARNING:
        this.icon = 'warning';
        break;
      case NotificationService.TYPE_ERROR:
        this.icon = 'error';
        break;
    }
    this.subscriptions.push(
    this.tourService.handleCloseNotificationObservable.subscribe(() => {
      this.showMessage = false;
  })
);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => {
      s.unsubscribe();
    });
  }

  public handleShowAgain(checked: boolean): void {
    if (this.checkShowAgain) {
      if (checked) {
        // Don't show again
        this.localStoragePersister.set(this.id, false);
      } else {
        // Keep showing
        this.localStoragePersister.set(this.id, true);
      }
    }
  }

  public handleClose(): void {
    this.showMessage = false;
    this.showMessageEvent.emit(false);
  }

}
