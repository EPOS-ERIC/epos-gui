import { Injectable } from '@angular/core';
import { NotificationService as GeneralNotificationService } from 'services/notification.service';
import { DistributionNotificationText } from '../../pages/dataPortal/enums/distributionNotification.enum';

@Injectable()
export class NotificationService extends GeneralNotificationService {

  // eslint-disable-next-line max-len
  public static MESSAGE_REFINE_DATA = DistributionNotificationText.MESSAGE_REFINE_DATA;
  public static MESSAGE_NO_DATA = DistributionNotificationText.MESSAGE_NO_DATA;
  public static MESSAGE_ERROR_HTML = DistributionNotificationText.MESSAGE_ERROR_HTML;

}
