import { Injectable } from '@angular/core';
 import { LocalStoragePersister } from './model/persisters/localStoragePersister';
 import { LocalStorageVariables } from './model/persisters/localStorageVariables.enum';
 import { BehaviorSubject, Observable } from 'rxjs';


 @Injectable({
     providedIn: 'root',
 })
 export class RadioTempRangeFilterService{

    public temporalRangeRadioFilter = new BehaviorSubject<null | string>(null);

    constructor(
        private localStoragePersister: LocalStoragePersister,
    ) {
    }

     /**
    * The function sets the value of the "tempRadioFilter" property and calls another function to store the
    * value in the localStorage.
    * @param {boolean} tempRadioFilter - A boolean value indicating whether the information check is allowed or
    * not.
    */
    public setTempRadioFilter(tempRadioFilter: null | string): void {
        this.storeTempRadioFilter(tempRadioFilter);
    }

    public storeTempRadioFilter(tempRadioFilter: null | string): void {
        this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, tempRadioFilter, false, LocalStorageVariables.LS_DATA_SEARCH_TEMPORAL_RANGE_RADIO_FILTER);
    }

    public temporalRangeFilterRadioObs(): Observable<null | string>{
    return this.temporalRangeRadioFilter.asObservable();
    }

}
