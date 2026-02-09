import { ErrorHandler } from '../classes/errorHandler.interface';
import { LoggingService } from 'services/logging.service';
import * as HttpStatus from 'http-status-codes'; // https://www.npmjs.com/package/http-status-codes
import { NotificationService } from 'services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ErrorDialogComponent } from 'components/dialog/errorDialog/errorDialog.component';

/**
 * Handles the errors raised by the {@link RestImpl}.
 * Triggers the display of error notification (if required).
 */
export class ErrorHandlerImpl implements ErrorHandler {
  private dialogRef!: MatDialogRef<ErrorDialogComponent>;
  constructor(
    private readonly notificationService: NotificationService,
    private readonly loggingService: LoggingService,
    private readonly dialog: MatDialog,
  ) { }
  handleError(error: Record<string, unknown>, url: string, method = 'get'): Promise<Record<string, unknown>> {
    console.log('API Error', error);
    let doToast = true;
    let isWarning = false;

    const status = error.status as HttpStatus.StatusCodes;

    const prefix = method == null ? 'GET?' : method.trim().toUpperCase();
    const shortMessage = prefix + ' (' + (status == null ? '?' : String(status)) + ') ' + url;
    console.log('ERROR', shortMessage);

    let notificationMessage: Array<string> = [];
    const consoleMessage: Array<string> = [];

    if (status != null) {

      if (
        (status >= HttpStatus.StatusCodes.INTERNAL_SERVER_ERROR || status === HttpStatus.StatusCodes.NOT_FOUND)
        &&
        (error.url as string).includes('api/v1/resources/search')) {
        this.dialogRef = this.dialog.open(ErrorDialogComponent, {
          width: '80vw',
          height: '80vh',
          maxWidth: '80vw',
          maxHeight: '80vh',
          panelClass: 'error-dialog',
          disableClose: true,
        });
      } else {

        const getStatusDocLink = () => {
          return `
           <a
             href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/${status}"
             target="_blank"
             rel="noopener noreferrer"
           >
             Learn more
           </a>
         `;
        };

        switch (status) {
          case (HttpStatus.StatusCodes.BAD_GATEWAY): {
            notificationMessage = ['(502) Bad Gateway', getStatusDocLink()];
            break;
          }
          case (HttpStatus.StatusCodes.INTERNAL_SERVER_ERROR): {
            console.log(error.url);
            notificationMessage = ['(500) Internal Server Error', getStatusDocLink()];
            break;
          }
          case (HttpStatus.StatusCodes.UNAUTHORIZED): {
            doToast = false;
            isWarning = true;
            // dot
            notificationMessage = ['(401) Unauthorized', getStatusDocLink()];
            break;
          }
          default:
            break;
        }
      }


      // if HttpErrorResponse from api/v1/execute => not show toast
      if (error instanceof HttpErrorResponse && (error.url as string).includes('/api/v1/execute')) {
        doToast = false;
      }

      consoleMessage.push(...notificationMessage);

      console.log(notificationMessage);


      if (notificationMessage.length > 0) {
        if (isWarning) {
          if (doToast) {
            this.notificationService.sendNotification(notificationMessage.join(' '), 'x', NotificationService.TYPE_WARNING, 5000);
          }
          this.loggingService.warn(consoleMessage.join(' '), true);
        } else {
          if (doToast) {
            this.notificationService.sendNotification(notificationMessage.join(' '), 'x', NotificationService.TYPE_ERROR, 5000);
          }
          this.loggingService.error(consoleMessage.join(' '), true);
        }
      }
    }

    return Promise.reject(error);
  }
}
