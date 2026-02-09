import { Injectable } from '@angular/core';
import { MatomoTracker } from '@ngx-matomo/tracker';
import { environment } from 'environments/environment';
import { PoliciesService } from 'services/policiesService.service';

@Injectable()
export class Tracker {

  public static readonly TARCKER_DATA_SEPARATION = '|';

  constructor(
    private readonly tracker: MatomoTracker,
    private policiesService: PoliciesService,
  ) {
  }

  /**
   * The trackEvent function tracks an event if Matomo tracking is enabled and cookies are enabled.
   * @param {string} category - Category is a string parameter that represents the category of the
   * event being tracked. It is used to group related events together for analysis and reporting
   * purposes.
   * @param {string} action - The `action` parameter in the `trackEvent` function represents the
   * specific action or event that you want to track. It could be a button click, form submission, page
   * view, or any other user interaction that you want to monitor and analyze.
   * @param {string} [name] - The `name` parameter in the `trackEvent` function is a string that
   * represents the name of the event being tracked. It is an optional parameter, meaning it does not
   * have to be provided when calling the function.
   * @param {number} [value] - The `value` parameter in the `trackEvent` function is of type `number`
   * and represents a numerical value associated with the event being tracked. It is an optional
   * parameter, meaning it does not have to be provided when calling the function. If provided, it
   * should be a number that provides additional
   */
  public trackEvent(category: string, action: string, name?: string, value?: number): void {
    if (environment.matomoTrackEvent && this.policiesService.cookiesEnabled) {
      this.tracker.trackEvent(category, action, name, value);
    }
  }

  /**
   * The trackPageView function tracks a page view only if cookies are enabled.
   */
  public trackPageView(): void {
    if (this.policiesService.cookiesEnabled) {
      this.tracker.trackPageView();
    }
  }

}
