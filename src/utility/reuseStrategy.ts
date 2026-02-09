import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';
import { Injectable } from '@angular/core';

/**
 * This reuse strategy is designed to ensure that the state of a page that a user navigates away
 * from is maintained for when they navigate back to it.
 *
 *
 * See the {@link AppRouterOutletDirective} and {@link OnAttachDetach} decorator for additional lifecyle hooks that are available
 * for when navigating to or from a routed component.
 */
@Injectable()
export class CustomReuseStrategy implements RouteReuseStrategy {

  handlers = {} as Record<string, DetachedRouteHandle>;

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return true;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    if ((null != route.routeConfig) && (null != route.routeConfig.path)) {
      this.handlers[route.routeConfig.path] = handle;
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return !!route.routeConfig && (null != route.routeConfig.path) && !!this.handlers[route.routeConfig.path];
  }

  retrieve(route: ActivatedRouteSnapshot): null | DetachedRouteHandle {
    return ((!route.routeConfig) || (null == route.routeConfig.path))
      ? null
      : this.handlers[route.routeConfig.path];
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  clearRoutes(): void {
    this.handlers = {};
  }

}
