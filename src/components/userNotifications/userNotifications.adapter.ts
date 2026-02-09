import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { notificationType, UserNotification } from 'components/userNotifications/userNotification';
import { UserNotificationService } from 'components/userNotifications/userNotifications.service';
import { Button } from 'utility/button';

/**
 * This is the service that is called when another part of the code wants to
 * display a notification.
 */
@Injectable()
export class UserNotificationAdapter implements UserNotificationService {
  private readonly notification: Subject<UserNotification> = new Subject<UserNotification>();

  /**
   * Show a WARNING notification.
   * @param notificationText {string} text to show
   * @param showForMillis {number} millis to show notification for.
   * @param action {Button} The definition of a button that should be shown on the notification.
   */
  public sendWarningNotification(notificationText: string, showForMillis = 2000, action?: Button): void {
    const type: notificationType = notificationType.WARNING;
    this.sendNotification(type, notificationText, showForMillis);
  }

  /**
   * Show an ERROR notification.
   * @param notificationText {string} text to show
   * @param showForMillis {number} millis to show notification for.
   * @param action {Button} The definition of a button that should be shown on the notification.
   */
  public sendErrorNotification(notificationText: string, showForMillis = 2000, action?: Button): void {
    const type: notificationType = notificationType.NEGATIVE;
    this.sendNotification(type, notificationText, showForMillis);
  }

  /**
   * Show a POSITIVE notification.
   * @param notificationText {string} text to show
   * @param showForMillis {number} millis to show notification for.
   * @param action {Button} The definition of a button that should be shown on the notification.
   */
  public sendPositiveNotification(notificationText: string, showForMillis = 2000, action?: Button): void {
    const type: notificationType = notificationType.POSITIVE;
    if (action) {
      this.sendNotification(type, notificationText, showForMillis, action);
    } else {
      this.sendNotification(type, notificationText, showForMillis);
    }
  }

  public listenForNotification(): Observable<UserNotification> {
    return this.notification.asObservable();
  }

  private sendNotification(type: notificationType, notificationText: string, showForMillis = 3000, action?: Button) {
    if (notificationText.length > 219) {
      notificationText = notificationText.substr(0, 200) + ' \u2026';
    }
    const notification = new UserNotification(type, notificationText, showForMillis, action);
    this.emitNotificationChange(notification);
  }

  private emitNotificationChange(notification: UserNotification) {
    this.notification.next(notification);
    // this.startTimer(notification.getShowFor());
  }

}
export const userNotificationFactory = (): UserNotificationService => {
  return new UserNotificationAdapter();
};

export const userNotificationProvider = {
  provide: UserNotificationService,
  useFactory: userNotificationFactory,
  deps: []
};
