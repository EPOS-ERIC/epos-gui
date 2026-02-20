/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Component, HostListener, OnInit } from '@angular/core';
import { ModelPrimer } from 'services/model/modelPrimer.service';
import { ActivatedRoute, Event, NavigationEnd, Params, Route, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RouteInfoService } from 'services/routeInfo.service';
import { AaaiService } from 'api/aaai.service';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { DialogService } from 'components/dialog/dialog.service';
import { PoliciesService } from 'services/policiesService.service';
import { initHotjarFunc } from './initHotjar';
import { InformationsService } from 'services/informationsService.service';
import { TourService } from 'services/tour.service';
import { environment } from 'environments/environment';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { CONTEXT_RESOURCE } from 'api/api.service.factory';
import { Tracker } from 'utility/tracker/tracker.service';
import { NotificationService } from 'services/notification.service';
import { NewFeaturesService } from 'components/dialog/newFeatureDialog/newFeatures.service';

/**
 * This is the standard Angular root component that is included by the index.html file.
 *
 *
 * It contains any global html elements/angular components that need to be included as standard
 * throughout the app, like the {@link HeaderComponent}.
 *
 *
 * It uses a customized {@link AppRouterOutletDirective} rather than a standard router to handle
 * routing (page navigation), to ensure that the state of pages that have been navigated away from
 * are cached.
 *
 *
 * This is where user mouse interactions are trigger updates {@link AaaiService} to ensure an
 * "active" user isn't logged out prematurely.
 *
 *
 * This is also where the Matomo analytics and Hotjar user feedback plugins are initialised.
 *
 */
@Unsubscriber('subscriptions')
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public pageCssClass: '';
  public hideHeader = false;
  public mobile = false;
  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  constructor(
    private readonly aaaiService: AaaiService,
    private readonly routeInfo: RouteInfoService,
    private readonly router: Router,
    private readonly modelPrimer: ModelPrimer, // REQUIRED - needs to be referenced somewhere to be instantiated immediately
    private dialogService: DialogService,
    private policiesService: PoliciesService,
    private informationService: InformationsService,
    private tourService: TourService,
    private readonly localStoragePersister: LocalStoragePersister,
    private readonly tracker: Tracker,
    private readonly activatedRoute: ActivatedRoute,
    private readonly notificationService: NotificationService,
    private readonly newFeaturesService: NewFeaturesService,
  ) {

    const shouldShowPoliciesPopup = (window.location.href.indexOf('policy-index') < 0)
      && environment.showPoliciesPopup
      && (!policiesService.hasConsents);

    if (shouldShowPoliciesPopup) {
      void this.dialogService.openCookiesBanner();
    } else {
      this.checkMobile();
      if (!informationService.infoEnabled && this.mobile === false && environment.showWelcomePopup) {
        void this.dialogService.openInformationBanner().then(() => {
    // After it closes, open the New Features dialog
      this.newFeaturesService.openNewFeatures();});
      } else {
        // Open the New Features dialog
        this.newFeaturesService.openNewFeatures();
      }
      if (this.localStoragePersister.getValue(LocalStorageVariables.LS_GUIDE_TOUR_SNACKBAR_CHECK) === false || this.localStoragePersister.getValue(LocalStorageVariables.LS_GUIDE_TOUR_SNACKBAR_CHECK) === null) {
        void this.notificationService.sendAvailableGuidedTourNotification('Start Guided Tour', 'assets/img/guided_tour_snack_logo_orange.svg');
      }

    }

    if (policiesService.cookiesEnabled) {
      initHotjarFunc();
      this.tracker.trackPageView();
    }

    this.subscriptions.push(
      this.routeInfo.watchCurrentRoute().subscribe((route: Route) => {
        this.pageCssClass = this.routeInfo.getDataValue('pageCssClass', '')!;
        this.hideHeader = this.routeInfo.getDataValue<boolean>('hideHeader', false)!;

        const lastDetailDialogId = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_LAST_DETAIL_DIALOG_ID);
        if (lastDetailDialogId !== null && (lastDetailDialogId as string).trim() !== '') {
          setTimeout(() => {
            void this.dialogService.openDetailsDialog(
              lastDetailDialogId as string,
              CONTEXT_RESOURCE,
              [],
            );
          }, 500);
        }
      }),

      this.router.events.subscribe((event: Event) => {
        if (event instanceof NavigationEnd) {
          this.modelPrimer.setServicesAndTriggerInitialValues();
        }
      }),
    );
  }

  /**
   * Detect user mouse interactions are trigger updates {@link AaaiService} to ensure an
   * "active" user isn't logged out prematurely.
   */
  @HostListener('window:mousemove', ['$event'])
  mousemove(event: MouseEvent): void {
    this.aaaiService.userInteracted();
  }
  @HostListener('window:touchstart', ['$event'])
  touchstart(event: MouseEvent): void {
    this.aaaiService.userInteracted();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: MouseEvent): void {
    this.checkMobile();
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.tourService.tourActiveObservable.subscribe((active: string) => {
        let value: string | null = active;
        if (active !== 'true' && active !== 'false') {
          value = 'false';
        }
        this.informationService.setEposTourActive(value);
      }),

      this.activatedRoute.queryParams
        .subscribe((params: Params) => {
          // check if there are some configurables from URL
          if (params.share !== undefined) {

            void this.dialogService.closeInformationBanner();

            void this.dialogService.openShareInformationBanner('retrieve', 'YES');
          }
        })
    );

    const version = this.routeInfo.getDataValue('version', environment.version)! as string;
    const versionLocalStorage = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_VERSION);
    const confFromShare = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONF_FROM_SHARE) as boolean;

    // if different version AND is not a configuration share URL
    if (version !== versionLocalStorage && confFromShare !== true) {

      // reset localstorage variables
      this.localStoragePersister.resetAllVariables();

      // set new version on localstorage
      this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, version, false, LocalStorageVariables.LS_VERSION);

      // refresh page
      location.reload();
    }

  }

  /**
   * It checks if the user is on a mobile device and if so, it opens a dialog box
   */
  private checkMobile(): void {

    this.mobile = (window.innerWidth < environment.minWidth) ? true : false;
    const canShowMobileDisclaimer = this.policiesService.hasConsents || !environment.showPoliciesPopup;

    // show mobile disclaimer
    if (this.mobile) {
      if (canShowMobileDisclaimer) {
        void this.dialogService.openNoMobileDisclaimer();
        this.dialogService.closeInformationBanner();
      }
    } else {
      this.dialogService.closeNoMobileDisclaimer();
    }

  }
}
