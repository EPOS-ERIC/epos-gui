import { Component, OnInit } from '@angular/core';
import { LastPageRedirectService } from 'services/lastPageRedirect.service';
import { TrackerAction, TrackerCategory } from 'utility/tracker/tracker.enum';
import { Tracker } from 'utility/tracker/tracker.service';

/** The `LastPageRedirectComponent` class implements the `OnInit` interface and redirects to the last
page using the `LastPageRedirectService`. */
@Component({
  selector: 'app-last-page-redirect',
  templateUrl: './lastPageRedirect.component.html',
})
export class LastPageRedirectComponent implements OnInit {

  /**
   * The constructor function takes in a LastPageRedirectService parameter and assigns it to a private
   * readonly property.
   * @param {LastPageRedirectService} lastPageRedirectService - The parameter `lastPageRedirectService`
   * is a service called `LastPageRedirectService` that is being injected into the constructor using
   * Angular's dependency injection system. This service likely provides functionality related to
   * redirecting to the last visited page or handling page redirection logic within the application.
   */
  constructor(
    private readonly lastPageRedirectService: LastPageRedirectService,
    private readonly tracker: Tracker
  ) {
  }

  /**
   * The ngOnInit function calls a service method to redirect to the last visited page.
   */
  ngOnInit(): void {
    this.lastPageRedirectService.goToLastPage();

    setTimeout(() => {
      this.tracker.trackEvent(TrackerCategory.GENERAL, TrackerAction.LOGIN, 'Submit');
    }, 1000);
  }
}
