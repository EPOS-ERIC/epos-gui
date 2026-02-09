import { Injectable } from '@angular/core';
import { AaaiService } from 'api/aaai.service';
import { DialogService } from 'components/dialog/dialog.service';
import { LoginMessageObject } from 'components/dialog/pleaseLoginDialog/pleaseLoginContent.component';

/**
 * A service that checks if user is logged after attempting to click on download link
 */
@Injectable({
    providedIn: 'root'
})
export class AuthenticatedClickService {
    constructor(
        private readonly aaaiService: AaaiService,
        private readonly dialogService: DialogService,
    ) {
    }

    public authenticatedClick(message: LoginMessageObject | null = null): boolean {

        if (message === null) {
            message = {
                title: 'Login To Continue',
                message: 'In order to access the EPOS application\'s full functionality please Login.'
            };
        }

        if (null == this.aaaiService.getUser()) {
            void this.dialogService.openPleaseLoginDialog(undefined, message);
        }
        return null != this.aaaiService.getUser();
    }

    public authenticatedContactForm(): boolean {
        const message = { title: 'Login to send message', message: '' };
        return this.authenticatedClick(message);
    }
}
