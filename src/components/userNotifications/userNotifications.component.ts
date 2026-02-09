import { Component, OnInit } from '@angular/core';
import { UserNotificationService } from 'components/userNotifications/userNotifications.service';
import { UserNotification } from 'components/userNotifications/userNotification';

/**
 * A component that displays toast-like notifications when the associated service is prompted.
 */
@Component({
  selector: 'app-user-notification',
  templateUrl: 'userNotifications.component.html',
  styleUrls: ['./userNotifications.component.scss']
})
export class UserNotificationsComponent implements OnInit {
  public notificationType: string;
  public notificationText: string;
  public notificationButton: unknown;
  public notifications: Array<UserNotification> = [];
  constructor(
    private readonly userNotificationService: UserNotificationService,
  ) { }

  public ngOnInit(): void {
    this.userNotificationService.listenForNotification().subscribe((notification: UserNotification) => {
      this.notifications.push(notification);
      setTimeout(() => {
        this.hideNotification(notification.getId());
      }, notification.getShowFor());
    });
  }

  public hideNotification(id: string): void {
    this.notifications.forEach((notification, index) => {
      if (notification.getId() === id) {
        this.notifications.splice(index, 1);
      }
    });
  }
}
