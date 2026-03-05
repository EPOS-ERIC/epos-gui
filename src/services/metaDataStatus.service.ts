import { Injectable } from '@angular/core';
import { LocalStoragePersister } from './model/persisters/localStoragePersister';
import { LocalStorageVariables, METADATA_PROMPT_PENDING_TTL_MS } from './model/persisters/localStorageVariables.enum';
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

    public setPromptPending(pending: boolean): void {
        if (pending) {
            const payload: PromptPendingPayload = {
                pending: true,
                createdAt: Date.now(),
            };
            sessionStorage.setItem(LocalStorageVariables.LS_METADATA_PROMPT_PENDING, JSON.stringify(payload));
        } else {
            sessionStorage.removeItem(LocalStorageVariables.LS_METADATA_PROMPT_PENDING);
        }
    }

    public isPromptPending(): boolean {
        const payload = this.getPromptPendingPayload();
        if (payload == null) {
            return false;
        }

        const isExpired = (Date.now() - payload.createdAt) > METADATA_PROMPT_PENDING_TTL_MS;
        if (isExpired) {
            sessionStorage.removeItem(LocalStorageVariables.LS_METADATA_PROMPT_PENDING);
            return false;
        }

        return payload.pending === true;
    }

    public consumePromptPending(): boolean {
        const pending = this.isPromptPending();
        if (pending) {
            sessionStorage.removeItem(LocalStorageVariables.LS_METADATA_PROMPT_PENDING);
        }
        return pending;
    }

    public shouldSkipPromptByPreference(): boolean {
        return this.localStoragePersister.getValue(LocalStorageVariables.LS_METADATA_STATUS_MODE) === 'true';
    }

    private getPromptPendingPayload(): null | PromptPendingPayload {
        const rawValue = sessionStorage.getItem(LocalStorageVariables.LS_METADATA_PROMPT_PENDING);
        if (rawValue == null) {
            return null;
        }

        try {
            const payload = JSON.parse(rawValue) as PromptPendingPayload;
            if (payload != null && payload.pending === true && typeof payload.createdAt === 'number') {
                return payload;
            }
        } catch {
        }

        sessionStorage.removeItem(LocalStorageVariables.LS_METADATA_PROMPT_PENDING);
        return null;
    }

}

interface PromptPendingPayload {
    pending: boolean;
    createdAt: number;
}
