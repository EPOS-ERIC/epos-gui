import { Injectable } from '@angular/core';
import moment from 'moment-es6';
import { LocalStorageVariables } from './model/persisters/localStorageVariables.enum';

@Injectable()
/** The `PoliciesService` class is responsible for managing the user's consent for cookies and terms &
conditions, storing the consent status in local storage, and providing methods to check and update
the consent status. */
export class PoliciesService {
  /** The line `public static readonly COOKIES_CONSENT = LocalStorageVariables.STORAGE_PREFIX +
  'cookiesConsents';` is defining a static constant variable named `COOKIES_CONSENT` in the
  `PoliciesService` class. */
  public static readonly COOKIES_CONSENT = LocalStorageVariables.STORAGE_PREFIX + 'cookiesConsents';

  /** The line `public static readonly T_AND_C_GDPR_COOKIES_CONSENTS_GIVEN =
  LocalStorageVariables.STORAGE_PREFIX + 'tAndCGdprCookiesConsentsGiven';` is defining a static
  constant variable named `T_AND_C_GDPR_COOKIES_CONSENTS_GIVEN` in the `PoliciesService` class. */
  public static readonly T_AND_C_GDPR_COOKIES_CONSENTS_GIVEN = LocalStorageVariables.STORAGE_PREFIX + 'tAndCGdprCookiesConsentsGiven';

  /** The line `public static readonly CONSENT_PERIOD_HOURS = 4320; // 6 months, 4320 hours` is defining a
  static constant variable named `CONSENT_PERIOD_HOURS` in the `PoliciesService` class. It is set to
  the value 4320, which represents the number of hours in 6 months. This constant is used to determine
  the expiration period for the consents given by the user. */
  public static readonly CONSENT_PERIOD_HOURS = 4320; // 6 months, 4320 hours

  /** The line `private cookiesConsent: boolean;` is declaring a private instance variable named
  `cookiesConsent` of type boolean in the `PoliciesService` class. This variable is used to store the
  user's consent for cookies. It is initialized in the constructor based on the value stored in the
  local storage. */
  private cookiesConsent: boolean;

  /** The line `private consentsGivenTimestamp: moment.Moment;` is declaring a private instance variable
  named `consentsGivenTimestamp` of type `moment.Moment` in the `PoliciesService` class. This variable
  is used to store the timestamp when the user gave their consents for cookies and terms & conditions.
  It is initialized in the constructor based on the value stored in the local storage. */
  private consentsGivenTimestamp: moment.Moment;

  private consentGivenString: string | null;

  /**
   * The constructor initializes the cookiesConsent property based on the value stored in localStorage
   * and parses the consentsGivenTimestamp from a string.
   */
  constructor(
  ) {
    this.cookiesConsent = localStorage.getItem(PoliciesService.COOKIES_CONSENT) === 'true';
    this.consentGivenString = localStorage.getItem(PoliciesService.T_AND_C_GDPR_COOKIES_CONSENTS_GIVEN);
    if (null != this.consentGivenString) {
      // format 'X' is unix timestamp
      this.consentsGivenTimestamp = this.toTimestamp(this.consentGivenString);
    }
  }

  /**
   * The function checks if the consents given timestamp is not null and if the current time is before
   * the expiration of the consent period.
   * @returns The method is returning a boolean value.
   */
  public get hasConsents(): boolean {
    return (
      (null != this.consentsGivenTimestamp)
      && (moment().isBefore(this.consentsGivenTimestamp.add(PoliciesService.CONSENT_PERIOD_HOURS, 'hours')))
    );
  }

  /**
   * The function returns a boolean value indicating whether cookies are enabled or not based on the
   * cookiesConsent variable.
   * @returns The value of the `cookiesConsent` property, which is a boolean value indicating whether
   * cookies are enabled or not.
   */
  public get cookiesEnabled(): boolean {
    return this.cookiesConsent;
  }

  /**
   * The function stores the user's cookie consent preference in the local storage.
   * @param {boolean} allow - The "allow" parameter is a boolean value that indicates whether the user
   * has given consent for storing cookies. If it is set to true, it means the user has allowed storing
   * cookies. If it is set to false, it means the user has denied storing cookies.
   */
  public static storeCookieConsent(allow: boolean): void {
    localStorage.setItem(PoliciesService.COOKIES_CONSENT, (allow) ? 'true' : 'false');
  }

  /**
   * The function stores a given timestamp in the local storage as a Unix timestamp string.
   * @param timestamp - The `timestamp` parameter is of type `moment.Moment`, which is a library for
   * handling dates and times in JavaScript. It represents a specific point in time.
   */
  public static storeConsentsTimestamp(timestamp: moment.Moment): void {
    if (null == timestamp) {
      localStorage.removeItem(PoliciesService.T_AND_C_GDPR_COOKIES_CONSENTS_GIVEN);
    }
    localStorage.setItem(PoliciesService.T_AND_C_GDPR_COOKIES_CONSENTS_GIVEN, timestamp.unix().toString());
  }

  /**
   * The function sets the consents timestamp and stores it in the PoliciesService.
   * @param timestamp - The `timestamp` parameter is of type `moment.Moment`, which is a library for
   * handling dates and times in JavaScript. It represents a specific point in time.
   */
  public setConsentsTimestamp(timestamp: moment.Moment): void {
    PoliciesService.storeConsentsTimestamp(timestamp);
    this.consentsGivenTimestamp = timestamp;
  }

  public getConsentGivenString(): string | null {
    return this.consentGivenString;
  }

  public setConsentGivenString(consentGivenString: string | null): void {
    if (null != consentGivenString) {
      this.consentGivenString = consentGivenString;
      this.consentsGivenTimestamp = this.toTimestamp(this.consentGivenString);
      this.setConsentsTimestamp(this.consentsGivenTimestamp);
    }
  }

  /**
   * The function sets the cookie consent status and stores it in the PoliciesService.
   * @param {boolean} allow - The "allow" parameter is a boolean value that indicates whether the user
   * has given consent to store cookies or not. If "allow" is true, it means the user has given
   * consent, and if it is false, it means the user has not given consent.
   */
  public setCookieConsent(allow: boolean): void {
    PoliciesService.storeCookieConsent(allow);
    this.cookiesConsent = allow;
  }

  /**
   * The function `toTimestamp` converts a time string to a Moment object using the 'X' format.
   * @param {string} timeString - A string representing a time value.
   * @returns A Moment object representing the timestamp parsed from the input timeString.
   */
  private toTimestamp(timeString: string): moment.Moment {
    // format 'X' is unix timestamp
    return moment(timeString, 'X');
  }

}
