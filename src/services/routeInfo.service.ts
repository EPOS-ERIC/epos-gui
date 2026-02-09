import { Injectable } from '@angular/core';
import { Router, Event, NavigationStart, Route } from '@angular/router';
import { Subscription, Observable, BehaviorSubject } from 'rxjs';

/**
 * Convenience service for more easily monitoring the current route
 * and retrieving data associated with it.
 */
@Injectable()
export class RouteInfoService {
  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  private readonly currentRouteSource = new BehaviorSubject<null | Route>(null);

  constructor(
    private readonly router: Router,
  ) {
    this.subscriptions.push(
      this.router.events.subscribe((event: Event) => {
        if (event instanceof NavigationStart) {
          const currentUrl = this.cleanUrl(event.url);
          this.setCurrentRoute(this.getRoute(currentUrl));
        }
      })
    );
  }

  /**
   * @return The Route object associated with the routeUrl parameter.
   * @param routeUrl A url string.
   */
  public getRoute(routeUrl: string): Route {
    routeUrl = this.cleanUrl(routeUrl);
    const route = this.router.config.find((r: Route) => (r.path === routeUrl));
    return (route != null)
      ? route
      : this.router.config.find((r: Route) => (r.path === '**'))!; // not found
  }

  /**
   * @return A value that is associated with the key in the Route.
   *
   * @param key Identifier for the value.
   * @param defaultVal The value to return if the key isn't found.
   * @param route Route to retrieve the key value from.  If not supplied an attempt will be made
   * to retrieve it from the application Router.
   */
  public getDataValue<T>(key: string, defaultVal: null | T = null, route: null | Route = null): null | T {
    route = (route == null) ? this.getCurrentRoute() : route;

    return ((route != null) && (route.data != null) && (route.data[key] != null))
      ? route.data[key] as T
      : defaultVal;
  }

  /**
   * @return An rxjs/Observable that is triggered with the new Route object when the
   * current route of the application changes.
   */
  public watchCurrentRoute(): Observable<null | Route> {
    return this.currentRouteSource.asObservable();
  }
  private setCurrentRoute(route: Route): void {
    this.currentRouteSource.next(route);
  }
  private getCurrentRoute(): null | Route {
    return this.currentRouteSource.getValue();
  }

  private cleanUrl(url: string): string {
    return url.replace(/^\/+/, ''); // strip leading slashes
  }
}
