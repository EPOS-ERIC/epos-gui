import { Injectable } from '@angular/core';
import { LocalStoragePersister } from './model/persisters/localStoragePersister';
import { LocalStorageVariables } from './model/persisters/localStorageVariables.enum';


@Injectable({
    providedIn: 'root',
})
export class SwitchDistributionItemService{

    constructor(
        private localStoragePersister: LocalStoragePersister,
    ) { }

    /**
   * The function sets the value of the "noShowAgain" property and calls another function to store the
   * value in the localStorage.
   * @param {boolean} noShowAgain - A boolean value indicating whether the information check is allowed or
   * not.
   */
    public setNoShowAgain(noShowAgain: boolean): void {
        this.storeNoShowAgainCheck(noShowAgain);
    }

    public storeNoShowAgainCheck(noShowAgain: boolean): void {
        this.localStoragePersister.set(LocalStorageVariables.LS_SWITCH_DISTRIBUTION_ITEM_CHECK, (noShowAgain) ? 'true' : 'false', false);
    }

}
