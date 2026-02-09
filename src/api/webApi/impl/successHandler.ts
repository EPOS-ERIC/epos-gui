import { NotificationService } from 'services/notification.service';
import { LoggingService } from 'services/logging.service';
import { SuccessHandler } from '../classes/successHandler.interface';

export class SuccessHandlerImpl implements SuccessHandler {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly loggingService: LoggingService
  ) { }
  handleSuccess(status: number, url: string, method = 'get'): void {
  }
}
