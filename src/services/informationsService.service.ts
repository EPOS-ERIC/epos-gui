import { Injectable } from '@angular/core';
import { LocalStoragePersister } from './model/persisters/localStoragePersister';
import { LocalStorageVariables } from './model/persisters/localStorageVariables.enum';

@Injectable()
/** The `InformationsService` class manages the storage and retrieval of information check and tour
active status using local storage. */
export class InformationsService {

  /** The line `private infoCheck: boolean;` is declaring a private member variable named `infoCheck` of
  type `boolean` in the `InformationsService` class. This variable is used to store the value of
  whether the information check is enabled or not. */
  private infoCheck: boolean;

  /** The line `private tourActive: string | null;` is declaring a private member variable named
  `tourActive` in the `InformationsService` class. This variable can hold a value of type `string` or
  `null`. It is used to store the value of whether a tour is currently active or not. If a tour is
  active, the variable will hold the name or identifier of the active tour. If no tour is active, the
  variable will hold the value `null`. */
  private tourActive: string | null;

  /**
   * The constructor initializes two variables by retrieving values from local storage using a local
   * storage persister.
   * @param {LocalStoragePersister} localStoragePersister - The `localStoragePersister` parameter is of
   * type `LocalStoragePersister`. It is a dependency that is injected into the constructor. It is used
   * to interact with the browser's local storage to get and set values.
   */
  constructor(private readonly localStoragePersister: LocalStoragePersister,) {
    this.infoCheck = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_INFO_CHECK) === 'true';
    this.tourActive = this.localStoragePersister.getValue(LocalStorageVariables.LS_TOUR_ACTIVE) as string;
  }

  /**
   * The function returns a boolean value indicating whether the infoCheck property is enabled.
   * @returns The method is returning the value of the variable `infoCheck`, which is of type boolean.
   */
  public get infoEnabled(): boolean {
    return this.infoCheck;
  }

  /**
   * The function returns the value of the tourActive property, which is a string or null.
   * @returns The method is returning a value of type string or null.
   */
  public get tourIsActive(): string | null {
    return this.tourActive;
  }

  /**
   * The function `storeInfoCheck` sets a value in the local storage based on the value of the `allow`
   * parameter.
   * @param {boolean} allow - The "allow" parameter is a boolean value that determines whether to allow
   * or disallow the storage of information. If "allow" is true, the information will be stored, and if
   * it is false, the information will not be stored.
   */
  public storeInfoCheck(allow: boolean): void {
    this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, (allow) ? 'true' : 'false', false, LocalStorageVariables.LS_INFO_CHECK);
  }

  /**
   * The function sets the value of the "infoCheck" property and calls another function to store the
   * value.
   * @param {boolean} allow - A boolean value indicating whether the information check is allowed or
   * not.
   */
  public setInfoCheck(allow: boolean): void {
    this.storeInfoCheck(allow);
    this.infoCheck = allow;
  }

  /**
   * The function sets the "tourActive" property to the specified value and saves it.
   * @param {string} active - The "active" parameter is a string that represents the status of a tour.
   * It is used to determine whether a tour is active or not.
   */
  public setEposTourActive(active: string): void {
    this.saveTourActive(active);
    this.tourActive = active;
  }

  /**
   * The function saves the value of the "active" parameter to the local storage using the key
   * "LS_TOUR_ACTIVE".
   * @param {string} active - The "active" parameter is a string that represents the status of a tour.
   * It is used to determine whether a tour is currently active or not.
   */
  private saveTourActive(active: string): void {
    this.localStoragePersister.set(LocalStorageVariables.LS_TOUR_ACTIVE, active);
  }
}
