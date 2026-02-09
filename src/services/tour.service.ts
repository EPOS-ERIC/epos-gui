/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { ElementRef, EventEmitter, Injectable } from '@angular/core';
import { MatDialogState } from '@angular/material/dialog';
import { DialogService } from 'components/dialog/dialog.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { LocalStoragePersister } from './model/persisters/localStoragePersister';
import { TourFilterCache } from './model/persisters/tourFilterCache.enum';
import { LocalStorageVariables } from './model/persisters/localStorageVariables.enum';
import { PanelsEmitterService } from './panelsEventEmitter.service';
import { driver ,Config , Driver , DriveStep ,Popover} from 'driver.js';

@Injectable()
export class TourService {
  tourDriver: Driver;
  tourSteps: Map<string, Map<number, DriveStep>>;
  tourCurrentStep = 0;
  tourCurrentName: string;
  tourConfig: Config = {
    allowKeyboardControl: false,
    onHighlightStarted: (Element) => {
      const position = (Element as HTMLElement).getBoundingClientRect();
      const top = (position as unknown as Record<string, number>).top;

      const parent = this.getScrollParent(Element as HTMLElement);
      if (parent) {
        const offset = parent.offsetTop;
        const height = (Element as HTMLElement).getBoundingClientRect().height;
        parent.scrollTo(0, top - offset - height);
      }
    },
    overlayOpacity: 0.80,
    onDestroyed: () => {
      this.tourActive.next('false');
      if (this.tourSteps.has(this.tourCurrentName)) {
        this.triggerClearFiltersCall();
        this.restoreConfigurables();

        setTimeout(() => {
          this.restoreCachedDataSearchConfigurables();
        }, 1000);
      }
    },
    onNextClick: (element) => {
      // trigger the `tourForward` function in the tourDirective
      const highlightedElementRef: ElementRef = new ElementRef(element);
      this.tourStepForward.next(highlightedElementRef);
      this.tourCurrentStep++;
      // Delay the movement to the next step until after logic excuted
      setTimeout(() => {
        // Move to the next step
        this.tourDriver.moveNext();
      }, 0);
    },
    onPrevClick: (element) => {
      // trigger the `tourBackward` function in the tourDirective
      const highlightedElementRef: ElementRef = new ElementRef(element);
      this.tourStepBackward.next(highlightedElementRef);
      this.tourCurrentStep--;
      // Delay the movement to the previous step until after logic excuted
      setTimeout(() => {
        // Move to the previous step
        this.tourDriver.movePrevious();
      }, 0);
    },
    onHighlighted: (element) => {
      // trigger the `tourEnter` function in the tourDirective
      const highlightedElementRef: ElementRef = new ElementRef(element);
      this.tourStepEnter.next(highlightedElementRef);
      setTimeout(() => {
        this.triggerRefresh();
      }, 100);
      setTimeout(() => {
        this.triggerRefresh();
      }, 200);
      setTimeout(() => {
        this.triggerRefresh();
      }, 300);
    },

  };

  private readonly tourActive = new BehaviorSubject<string | null>(null);
  public tourActiveObservable = this.tourActive.asObservable();

  private readonly triggerDemoTemporalSelection = new EventEmitter<void>();
  public triggerDemoTemporalSelectionObservable = this.triggerDemoTemporalSelection.asObservable();

  private readonly triggerClearFilters = new EventEmitter<void>();
  public triggerClearFiltersObservable = this.triggerClearFilters.asObservable();

  private readonly triggerInformationDialogForTour = new EventEmitter<void>();
  public triggerInformationDialogForTourObservable = this.triggerInformationDialogForTour.asObservable();

  private readonly triggerRemoveAllFavorites = new EventEmitter<void>();
  public triggerRemoveAllFavoritesObservable = this.triggerRemoveAllFavorites.asObservable();

  private readonly triggerInfoIconStep = new EventEmitter<void>();
  public triggerInfoIconStepObservable = this.triggerInfoIconStep.asObservable();

  public readonly tourStepEnter = new Subject<ElementRef>();
  public tourStepEnterObservable = this.tourStepEnter.asObservable();

  private readonly tourStepBackward = new Subject<ElementRef>();
  public tourStepBackwardObservable = this.tourStepBackward.asObservable();

  private readonly tourStepForward = new Subject<ElementRef>();
  public tourStepForwardObservable = this.tourStepForward.asObservable();

  private readonly advancedSerachItemSelected = new EventEmitter<void>();
  public advancedSerachItemSelectedObservable = this.advancedSerachItemSelected.asObservable();

  private readonly handleCloseNotification = new EventEmitter<void>();
  public handleCloseNotificationObservable = this.handleCloseNotification.asObservable();

  private readonly triggerCloseGraphtablePanelToggle = new EventEmitter<void>();
  public triggerCloseGraphtablePanelToggleObservable = this.triggerCloseGraphtablePanelToggle;




  getScrollParent = (node: HTMLElement): HTMLElement => {
    if (null != node) {
      if (node.scrollHeight > node.clientHeight) {
        return node;
      } else {
        return this.getScrollParent(node.parentElement as HTMLElement);
      }
    } else {
      return node;
    }
  };

  constructor(private dialogsService: DialogService, private localStoragePersistor: LocalStoragePersister, private panelEventEmiterService: PanelsEmitterService) {
    this.tourSteps = new Map<string, Map<number, DriveStep>>();
    this.tourDriver = driver();
    this.tourDriver.setConfig(this.tourConfig);
  }

  public triggerDemoTemporalSelectionCall(): void {
    this.triggerDemoTemporalSelection.next();
  }

  public triggerClearFiltersCall(): void {
    this.triggerClearFilters.next();
  }

  public triggerInformationDialogForTourCall(): void {
    if (this.dialogsService.dialog.getDialogById('detailsDialog')?.getState() !== MatDialogState.OPEN) {
      this.triggerInformationDialogForTour.next();
    }
  }

  public triggerRemoveFavorites(): void {
    this.triggerRemoveAllFavorites.next();
  }

  private tourStepIsDefined(tourName: string, step: number) {
    return this.tourSteps.has(tourName) && this.tourSteps.get(tourName)!.has(step);
  }

  public triggerAddInfoIconStep(): void {
    this.triggerInfoIconStep.next();
  }

  public triggeradvancedSerachItemSelected(): void{
    this.advancedSerachItemSelected.next();
  }

  public triggerHandleCloseNotification(): void{
    this.handleCloseNotification.next();
  }

  /**
   * The `startTour` function starts a tour by setting the current tour name and step, updating the
   * tour runner steps, and starting the tour driver.
   * @param {string} tourName - The `tourName` parameter is a string that represents the name of the
   * tour. It is used to identify a specific tour that you want to start.
   * @param {Event | null} [event] - The `event` parameter is an optional parameter of type `Event` or
   * `null`. It is used to handle the event that triggers the start of the tour. If provided, it can be
   * used to stop the propagation of the event using `event.stopPropagation()`. If not provided, it
   * will be
   * @param {number} [stage] - The `stage` parameter is an optional parameter of type `number`. It
   * represents the starting step of the tour. If provided, the tour will start from the specified
   * step. If not provided, the tour will start from the beginning (step 0) if the current step is
   * greater than 0
   */
  public startTour(tourName: string, event?: Event | null, stage?: number): void {
    const startStep = typeof stage !== 'undefined' ? stage : this.tourCurrentStep > 0 ? this.tourCurrentStep : 0;

    if (this.tourCurrentName !== tourName) {
      this.tourDriver.destroy();
    }
    this.tourActive.next('true');
    this.tourCurrentName = tourName;
    this.tourCurrentStep = startStep;

    if (this.tourSteps.has(tourName)) {
      this.updateTourRunnerSteps(tourName);
      this.tourDriver.drive(startStep);
    }
    // eslint-disable-next-line
    event ? event.stopPropagation() : null;
  }

  public addStep(tourName: string, element: string | Element, popup: Popover, position: number, transparent = false): void {
    let stepMap = this.tourSteps.get(tourName);
    if (!stepMap) {
      stepMap = new Map<number, DriveStep>();
    }

    // append the tour name to the popup title so we can display and style it
    popup.title = `<span class="tour-title"><strong>Tour:</strong> ${tourName}</span>${popup.title}`;
    popup.popoverClass = 'driverJs-theme';

    stepMap.set(position, {
      element: element,
      popover: popup,
      // stageBackground: transparent ? 'transparent' : '#fff',
    });
    this.tourSteps.set(tourName, stepMap);

    if (this.tourActive.getValue() === 'true' && this.tourCurrentName === tourName) {
      // Does the 'current' step exist?
      if (this.tourStepIsDefined(tourName, this.tourCurrentStep)) {
        this.updateTourRunnerSteps(tourName);
      }
    }
  }

  public startEposFiltersTour(evt: Event): void {
    // eventually open left panel
    this.panelEventEmiterService.dataPanelOpen();

    this.cacheFiltersAndFavourites();

    this.triggerClearFiltersCall();

    this.triggerCloseGraphtablePanelToggle.next();

    setTimeout(() => {
      this.startTour('EPOS Overview', evt, 0);
    }, 100);
  }

  public triggerRefresh(): void {
    /**
     * Force refresh of highlight layer
     */
    this.tourDriver.refresh();
  }

  public isActive(): boolean {
    return this.tourActive.getValue() === 'true';
  }

  private cacheFiltersAndFavourites(): void {
    // save on temp variable cache all configurables informations
    this.localStoragePersistor.get(LocalStorageVariables.LS_CONFIGURABLES).then((data) => {
      this.localStoragePersistor.set(TourFilterCache.CACHED_CONFIGURABLES, data);
    });

    // save on temp variabile cache dataSearchConfigurables informations
    this.localStoragePersistor.get(LocalStorageVariables.LS_DATA_SEARCH_CONFIGURABLES).then((data) => {
      this.localStoragePersistor.set(TourFilterCache.CACHED_DATA_SEARCH_CONFIGURABLES, data);
    });
  }

  /**
   * The function restores configurable data from local storage.
   */
  private restoreConfigurables(): void {
    this.localStoragePersistor.get(TourFilterCache.CACHED_CONFIGURABLES).then((data) => {
      this.localStoragePersistor.set(LocalStorageVariables.LS_CONFIGURABLES, data);
      this.localStoragePersistor.set(TourFilterCache.CACHED_CONFIGURABLES, '[]');
    });
  }

  /**
   * The function restores cached data for search configurables and reloads the page.
   */
  private restoreCachedDataSearchConfigurables(): void {
    this.localStoragePersistor
      .get(TourFilterCache.CACHED_DATA_SEARCH_CONFIGURABLES)
      .then((data) => {
        this.localStoragePersistor.set(LocalStorageVariables.LS_DATA_SEARCH_CONFIGURABLES, data);
      })
      .finally(() => {
        this.localStoragePersistor.set(TourFilterCache.CACHED_DATA_SEARCH_CONFIGURABLES, '[]');
        location.reload();
      });
  }

  /**
   * The function updates the steps of a tour runner by removing invalid steps and sorting the
   * remaining steps in ascending order.
   * @param {string} tourName - The `tourName` parameter is a string that represents the name of a
   * tour.
   */
  private updateTourRunnerSteps(tourName: string): void {
    if (this.tourSteps.has(tourName)) {
      const stepMap = this.tourSteps.get(tourName);
      if (null != stepMap) {
        // remove step without valid Element
        stepMap.forEach((_step, index) => {
          if (_step.element === null) {
            stepMap.delete(index);
          }
        });

        const stepArray = Array.from(stepMap);
        stepArray.sort((a, b) => {
          return a[0] - b[0];
        });
        const steps = stepArray.map((a) => {
          return a[1];
        });
        this.updateConfigWithSteps(steps);
      }
    }
  }

  private updateConfigWithSteps(steps: Array<DriveStep>): void {
    this.tourConfig.steps = steps;
    this.tourDriver.setConfig((this.tourConfig));
  }

}



