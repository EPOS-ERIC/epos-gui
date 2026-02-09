import { UserNotification } from 'components/userNotifications/userNotification';
import { Observable } from 'rxjs';
import { Button } from 'utility/button';

/**
 * Interface of the service.
 *
 * Must be an abstract class because an adapter needs to use a factory method, which demands this.
 */
export abstract class UserNotificationService {
  abstract sendWarningNotification(notificationText: string, showFor?: number, action?: Button): void;
  abstract sendErrorNotification(notificationText: string, showFor?: number, action?: Button): void;
  abstract sendPositiveNotification(notificationText: string, showFor?: number, action?: Button): void;
  abstract listenForNotification(): Observable<UserNotification>;
}
