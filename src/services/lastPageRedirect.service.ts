import { Injectable } from '@angular/core';
import { Router, Route } from '@angular/router';
import { RouteInfoService } from './routeInfo.service';

/**
 * A service that monitors page navigations and stores the last navigation in local storage.
 * It also facilitates navigation to the last navigated page.
 */
@Injectable()
export class LastPageRedirectService {
  private readonly KEY = 'last_navigated_page';

  constructor(
    protected readonly router: Router,
    private readonly routeInfo: RouteInfoService,
  ) {
    this.routeInfo.watchCurrentRoute().subscribe((route: Route) => {
      if ((route != null)
        && (this.routeInfo.getDataValue('ignoreAsLastPage') !== true)) {
        this.updateLastPage(route.path ?? null);
      }
    });

  }

  /**
   * Causes the application to navigate to the last page the was set
   * by calling [updateLastPage]{@link #updateLastPage}.
   */
  public goToLastPage(): void {
    // get last navigated to page
    const lastPage = localStorage.getItem(this.KEY);
    void this.router.navigate([(lastPage == null) ? '' : lastPage]);
  }

  /**
   * @param url Url of the page to set as the latest page.
   */
  private updateLastPage(url: null | string): void {
    if (null != url) {
      const urlMinusFragment = url;
      localStorage.setItem(this.KEY, urlMinusFragment);
    }
  }

}
