import { Injectable } from '@angular/core';
import { LocalStoragePersister } from './model/persisters/localStoragePersister';
import { LocalStorageVariables } from './model/persisters/localStorageVariables.enum';
import { BehaviorSubject, Observable } from 'rxjs';


@Injectable({
    providedIn: 'root',
})
export class MetaDataStatusService{

    public metadataStatusModeActive = new BehaviorSubject<boolean>(false);

    public metadataSelectedStatuses = new BehaviorSubject<null | Array<string>>(null);

    constructor(
        private localStoragePersister: LocalStoragePersister,
    ) {
     }

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
        this.localStoragePersister.set(LocalStorageVariables.LS_METADATA_STATUS_MODE, (noShowAgain) ? 'true' : 'false', false);
    }

    public metadataStatusModeActiveObs(): Observable<boolean>{
        return this.metadataStatusModeActive.asObservable();
    }

    public metadataSelectedStatusesObs(): Observable<null | Array<string>>{
        return this.metadataSelectedStatuses.asObservable();
    }

}
