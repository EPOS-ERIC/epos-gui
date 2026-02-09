import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { NotificationSnackComponent } from 'components/notificationSnack/notificationSnack.component';
import { BehaviorSubject } from 'rxjs';

/** The line `export interface NotificationMessage {` is declaring an interface named
`NotificationMessage` and exporting it. An interface in TypeScript is a way to define the structure
or shape of an object. In this case, the `NotificationMessage` interface is used to define the
structure of a notification message object. It specifies the properties that a notification message
object should have, such as `id`, `title`, `message`, `type`, and `showAgain`. Other parts of the
code can then use this interface to ensure that they are working with objects that adhere to this
structure. */
export interface NotificationMessage {

  /** The line `id: string | null;` is declaring a property named `id` in the `NotificationMessage`
  interface. The property `id` can have a value of type `string` or `null`. This means that the `id`
  property can either hold a string value or be null. */
  id: string | null;

  /** The line `title: string | null;` is declaring a property named `title` in the `NotificationMessage`
  interface. The property `title` can have a value of type `string` or `null`. This means that the
  `title` property can either hold a string value or be null. */
  title: string | null;

  /** The line `message: string;` is declaring a property named `message` in the `NotificationMessage`
  interface. This property is of type `string`, which means it can hold a string value. The `message`
  property is used to store the content or text of a notification message. */
  message: string;

  /** The line `type: string;` is declaring a property named `type` in the `NotificationMessage`
  interface. This property is of type `string`, which means it can hold a string value. The `type`
  property is used to specify the type or category of a notification message, such as success, error,
  warning, or info. */
  type: string;

  /** The line `showAgain: boolean;` is declaring a property named `showAgain` in the
  `NotificationMessage` interface. This property is of type `boolean`, which means it can hold a
  boolean value (`true` or `false`). The `showAgain` property is used to determine whether the
  notification should be shown again in the future. It can be used to implement a feature where the
  user can choose to hide or show certain types of notifications. */
  showAgain: boolean;
}


@Injectable({
  providedIn: 'root',
})
/** The `NotificationService` class is a TypeScript class that provides methods for sending different
types of notifications, such as success, error, warning, and info, using the Angular Material
`MatSnackBar` service. */
export class NotificationService {

  /** The line `public static TYPE_SUCCESS = 'success';` is declaring a public static property named
  `TYPE_SUCCESS` with the value `'success'`. This property is a constant that represents the type of a
  success notification in the `NotificationService` class. It can be used to specify the type of a
  notification when calling the `sendNotification` method. */
  public static TYPE_SUCCESS = 'success';

  /** The line `public static TYPE_ERROR = 'error';` is declaring a public static property named
  `TYPE_ERROR` with the value `'error'`. This property is a constant that represents the type of an
  error notification in the `NotificationService` class. It can be used to specify the type of a
  notification when calling the `sendNotification` method. */
  public static TYPE_ERROR = 'error';

  /** The line `public static TYPE_WARNING = 'warning';` is declaring a public static property named
  `TYPE_WARNING` with the value `'warning'`. This property is a constant that represents the type of a
  warning notification in the `NotificationService` class. It can be used to specify the type of a
  notification when calling the `sendNotification` method. */
  public static TYPE_WARNING = 'warning';

  /** The line `public static TYPE_INFO = 'info';` is declaring a public static property named `TYPE_INFO`
  with the value `'info'`. This property is a constant that represents the type of an info
  notification in the `NotificationService` class. It can be used to specify the type of a
  notification when calling the `sendNotification` method. */
  public static TYPE_INFO = 'info';

  /** The line `public static TYPE_CUSTOM = 'custom';` is declaring a public static property named
   * `TYPE_CUSTOM` with the value `'custom'`. This property is a constant that represents the type of a
   * custom notification in the `NotificationService` class. It can be used to specify the type of a
   * notification when calling the `sendNotification` method.
   */
  public static LOADING_DISTRIBUTION = 'loading-distribution';

  /** The line `public static TYPE_CUSTOM = 'custom';` is declaring a public static property named
   * `TYPE_CUSTOM` with the value `'custom'`. This property is a constant that represents the type of a
   * custom notification in the `NotificationService` class. It can be used to specify the type of a
   * notification when calling the `sendNotification` method.
   */
  public static AVAILABLE_GUIDED_TOUR = 'available-guided-tour';

  /** The line `private distributionNotification = new BehaviorSubject<NotificationMessage | null>(null);`
  is declaring a private property named `distributionNotification` and initializing it with a new
  instance of the `BehaviorSubject` class. */
  private distributionNotification = new BehaviorSubject<NotificationMessage | null>(null);

  /** The line `public distributionNotificationObs = this.distributionNotification.asObservable();` is
  creating a public property named `distributionNotificationObs` and assigning it the value of
  `this.distributionNotification.asObservable()`. */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public distributionNotificationObs = this.distributionNotification.asObservable();

  /**
   * The constructor function takes a MatSnackBar parameter and assigns it to a private property.
   * @param {MatSnackBar} snackBar - The `snackBar` parameter is of type `MatSnackBar`, which is a
   * service provided by Angular Material. It is used to display snack bar messages, which are small
   * notifications that appear at the bottom of the screen. The `MatSnackBar` service provides methods
   * to open snack bars with different configurations and
   */
  constructor(private snackBar: MatSnackBar) { }

  /**
   * The function `sendNotification` opens a snackbar with a specified title, action, type, and
   * optional duration.
   * @param {string} title - A string representing the title of the notification.
   * @param {string} action - The "action" parameter is a string that represents the action to be
   * performed when the notification is clicked or interacted with. It could be a button label or any
   * other action that you want to associate with the notification.
   * @param {string} type - The "type" parameter in the "sendNotification" function is used to specify
   * the type or category of the notification. It can be used to differentiate between different types
   * of notifications, such as success, error, warning, info, etc.
   * @param {number} [duration] - The duration parameter is an optional parameter that specifies the
   * duration (in milliseconds) for which the notification should be displayed. If a value is provided
   * for duration, it will be used as the duration for the notification. If no value is provided, the
   * default duration of 3000 milliseconds (3 seconds)
   * @param indefinite - The indefinite parameter is an optional parameter that specifies whether the
   * notification should be displayed indefinitely. If the indefinite parameter is set to true, the
   * notification will be displayed indefinitely until the user interacts with it or it is dismissed manually.
   * @param customIcon - The customIcon parameter is an optional parameter that specifies the URL of a
   * custom icon to be displayed in the notification. If a custom icon URL is provided, the notification
   * will display the custom icon instead of the default icon.
   */
  public sendNotification(
    title: string,
    action: string,
    type: string,
    duration: number = 3000,
    indefinite: boolean = false,
    customIcon: string | null = null,
  ): MatSnackBarRef<NotificationSnackComponent> {
    return this.snackBar.openFromComponent(NotificationSnackComponent, {
      duration: indefinite ? undefined : duration,
      data: {
        title,
        action,
        type: type,
        customIcon,
      },
      panelClass: ['snackbar', 'mat-toolbar', 'snackbar-' + type],
      horizontalPosition: 'center'
    });
  }

  /**
   * The function sends a distribution notification with a given message.
   * @param {NotificationMessage} message - The parameter "message" is of type "NotificationMessage".
   */
  public sendDistributionNotification(message: NotificationMessage): void {
    this.distributionNotification.next(message);
  }

  /**
   * The function sends a positive notification with a message and an optional title.
   * @param {string} message - A string that represents the content of the positive notification
   * message.
   * @param [title] - The title of the notification. It is an optional parameter and if not provided,
   * it will be an empty string.
   */
  public sendPositiveNotification(message: string, title = ''): void {
    this.sendNotification(title, message, NotificationService.TYPE_SUCCESS);
  }

  /**
   * The function sends an error notification with a message and an optional title.
   * @param {string} message - The message parameter is a string that represents the error message that
   * you want to send in the error notification.
   * @param [title] - The title of the error notification. It is an optional parameter and if not
   * provided, it will be an empty string.
   */
  public sendErrorNotification(message: string, title = ''): void {
    this.sendNotification(title, message, NotificationService.TYPE_ERROR);
  }

  public sendLoadingNotification(message: string, customIconUrl: string | null): MatSnackBarRef<NotificationSnackComponent> {
    return this.sendNotification(message, 'x', NotificationService.LOADING_DISTRIBUTION, undefined, true, customIconUrl);
  }

  public sendAvailableGuidedTourNotification(message: string, customIconUrl: string | null): MatSnackBarRef<NotificationSnackComponent> {
    return this.sendNotification(message, 'x', NotificationService.AVAILABLE_GUIDED_TOUR, 7000, false, customIconUrl);
  }


}
