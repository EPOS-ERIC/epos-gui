import { AfterViewInit, Component, ElementRef, HostListener, Renderer2, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { OnAttachDetach } from 'decorators/onAttachDetach.decorator';
import { DataSearchConfigurablesServiceResource } from './modules/dataPanel/services/dataSearchConfigurables.service';
import { Subscription } from 'rxjs';
import { ResultsPanelService } from 'pages/dataPortal/services/resultsPanel.service';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { environment } from 'environments/environment';
import { MapInteractionService } from 'utility/eposLeaflet/services/mapInteraction.service';
import { MatButtonToggle } from '@angular/material/button-toggle';
import { CONTEXT_FACILITY, CONTEXT_RESOURCE, CONTEXT_SOFTWARE } from 'api/api.service.factory';
import { DialogService } from 'components/dialog/dialog.service';
import { TourService } from 'services/tour.service';

@OnAttachDetach()
@Unsubscriber('subscriptions')
@Component({
  selector: 'app-data-portal',
  templateUrl: './dataPortal.component.html',
  styleUrls: ['dataPortal.component.scss'],
})
export class DataPortalComponent implements AfterViewInit {
  @ViewChild('dataPanel') dataPanel: ElementRef;
  @ViewChild('dataPanelButton') dataPanelButton: MatButtonToggle;
  @ViewChild('dataPanelSidenav') dataPanelSidenav: MatSidenav;
  @ViewChild('analysisPanelSidenav') analysisPanelSidenav: MatSidenav;
  @ViewChild('registryPanelSidenav') registryPanelSidenav: MatSidenav;
  @ViewChild('softwarePanelSidenav') softwarePanelSidenav: MatSidenav;
  @ViewChild('tablePanelSidenav') tablePanelSidenav: MatSidenav;
  @ViewChild('graphPanelSidenav') graphPanelSidenav: MatSidenav;
  @ViewChild('analysisPanel') analysisPanel: ElementRef;
  @ViewChild('analysisPanelButton') analysisPanelButton: ElementRef;
  @ViewChild('registryPanel') registryPanel: ElementRef;
  @ViewChild('registryPanelButton') registryPanelButton: ElementRef;
  @ViewChild('softwarePanel') softwarePanel: ElementRef;
  @ViewChild('softwarePanelButton') softwarePanelButton: ElementRef;

  public tableInResults = true;
  public graphInResults = true;
  public checkIsNewSelected = true;

  public currentScreenWidth;
  public leftNavWidth;
  public counterData = 0;
  public counterRegistry = 0;
  public counterSoftware = 0;
  public counterEnvironment = 0;
  public counterTable = 0;
  public counterGraph = 0;

  public hasModuleData = false;
  public hasModuleAnalysis = false;
  public hasModuleRegistry = false;
  public hasModuleSoftware = false;

  public hasHiddenMarker = false;

  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  private updateTimeout: NodeJS.Timeout;

  constructor(
    private readonly configurables: DataSearchConfigurablesServiceResource,
    private readonly panelsEvent: PanelsEmitterService,
    private readonly resultPanelService: ResultsPanelService,
    private readonly localStoragePersister: LocalStoragePersister,
    private readonly mapInteractionService: MapInteractionService,
    private readonly dialogService: DialogService,
    private readonly tourService: TourService,
    private renderer: Renderer2,
  ) {
    this.hasModuleData = environment.modules.data;
    this.hasModuleAnalysis = environment.modules.analysis;
    this.hasModuleRegistry = environment.modules.registry;
    this.hasModuleSoftware = environment.modules.software;

    this.leftNavWidth = this.getWidthLeftPanels();

    this.subscriptions.push(
      this.resultPanelService.counterDataObs.subscribe((counter: number) => {
        this.counterData = counter;
      }),

      this.resultPanelService.counterRegistryObs.subscribe((counter: number) => {
        this.counterRegistry = counter;
      }),

      this.resultPanelService.counterSoftwareObs.subscribe((counter: number) => {
        this.counterSoftware = counter;
      }),

      this.resultPanelService.counterEnvironmentObs.subscribe((counter: number) => {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
          this.counterEnvironment = counter;
        }, 50);
      }),

      this.resultPanelService.counterTableObs.subscribe((counter: number) => {
        this.counterTable = counter;
      }),

      this.resultPanelService.counterGraphObs.subscribe((counter: number) => {
        this.counterGraph = counter;
      }),

      this.panelsEvent.invokeNewSelected.subscribe((newSelected: boolean) => {
        this.checkIsNewSelected = newSelected;
      }),

      this.panelsEvent.invokeDataPanelOpen.subscribe(() => {
        this.setDataPanel(true);
        if (this.hasModuleRegistry) {
          this.setRegistryPanel(false);
        }
      }),

      this.panelsEvent.invokeTablePanelToggle.subscribe((itemId: string) => {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
          // if the right sidenav is closed
          if (!this.tablePanelSidenav.opened || !this.checkIsNewSelected) {
            this.tablePanelToggle();
          }
        }, 50);
      }),

      this.panelsEvent.invokeTablePanelClose.subscribe(() => {
        void this.tablePanelSidenav.close();
        this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, JSON.stringify(false), false, LocalStorageVariables.LS_RIGHT_TOP_SIDENAV);
      }),

      this.panelsEvent.invokeGraphPanelToggle.subscribe(() => {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
          // if the bottom sidenav is closed
          if (!this.graphPanelSidenav.opened || !this.checkIsNewSelected) {
            this.graphPanelToggle();
          }
        }, 50);
      }),

      this.panelsEvent.invokeGraphPanelOpen.subscribe((itemId: string) => {
        void this.graphPanelSidenav.open();
        this.panelsEvent.invokeGraphPanel.emit(true);
        this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, JSON.stringify(true), false, LocalStorageVariables.LS_RIGHT_BOTTOM_SIDENAV);
      }),

      this.panelsEvent.invokeGraphPanelClose.subscribe(() => {
        void this.graphPanelSidenav.close();
        this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, JSON.stringify(false), false, LocalStorageVariables.LS_RIGHT_BOTTOM_SIDENAV);
      }),

      this.resultPanelService.landingPanelTopSrcObs.subscribe((top: string) => {
        this.setTopPositionAnalysis(top);
      }),

      this.mapInteractionService.featureOnlayerToggle.subscribe((featureOnLayer: Map<string, Array<number> | string | boolean>) => {
        this.checkHiddenMarkerOnMap();
      }),

      this.tourService.triggerCloseGraphtablePanelToggleObservable.subscribe(() => {
        this.closeGraphPanel();
        this.closeTablePanel();
      }),
    );

    this.currentScreenWidth = window.innerWidth;
  }

  ngAfterViewInit(): void {
    this.currentScreenWidth = window.innerWidth;

    setTimeout(() => {
      if (this.hasModuleData) {
        // leftSidenav opened at first time
        this.dataPanelSidenav.opened = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_LEFT_TOP_SIDENAV) === 'false' ? false : true;
        this.setDataPanel(this.dataPanelSidenav.opened);
        // rightSidenav and bottomSidenav closed at first time
        this.tablePanelSidenav.opened = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_RIGHT_TOP_SIDENAV) === 'true' ? true : false;

        this.graphPanelSidenav.opened = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_RIGHT_BOTTOM_SIDENAV) === 'true' ? true : false;
      }

      if (this.hasModuleRegistry) {
        this.renderer.setStyle(this.registryPanelButton.nativeElement as HTMLElement, 'top', '11.9vh');

        // leftMidSidenav opened at first time
        this.registryPanelSidenav.opened = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_REGISTRY_SIDENAV) === 'true' ? true : false;

        this.setRegistryPanel(this.registryPanelSidenav.opened);
        // check left sidenav panels open
        this.checkLeftSidenavOpen();
      }

      if (this.hasModuleSoftware) {
        this.renderer.setStyle(this.softwarePanelButton.nativeElement as HTMLElement, 'top', '26.2vh');

        this.softwarePanelSidenav.opened = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_SOFTWARE_SIDENAV) === 'true' ? true : false;

        this.setSoftwarePanel(this.softwarePanelSidenav.opened);

        this.checkLeftSidenavOpen();
      }

      if (this.hasModuleAnalysis) {
        this.renderer.setStyle(this.analysisPanelButton.nativeElement as HTMLElement, 'top', '41.1vh');

        // leftMidSidenav opened at first time
        this.analysisPanelSidenav.opened = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_ANALYSIS_SIDENAV) === 'true' ? true : false;
      }

      this.checkHiddenMarkerOnMap();

      // When initializing the page, reset the state of the table and graph dialogs
      this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, false, false, LocalStorageVariables.LS_TABLE_DIALOG_OPENED);
      this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, false, false, LocalStorageVariables.LS_GRAPH_DIALOG_OPENED);
    }, 100);
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  @HostListener('window:resize', ['$event'])
  public onWindowResize(): void {
    this.currentScreenWidth = window.innerWidth;
    this.leftNavWidth = this.getWidthLeftPanels();
  }

  public dataPanelStatusChange(closing: boolean): void {
    this.leftNavWidth = this.getWidthLeftPanels();

    if (this.hasModuleAnalysis) {
      this.setAnalysisPanelLeft();
    }

    if (!closing) {
      if (this.hasModuleRegistry) {
        // close registry panel
        this.setRegistryPanel(false);
      }

      if (this.hasModuleSoftware) {
        this.setSoftwarePanel(false);
      }
    }
  }

  public registryPanelStatusChange(closing: boolean): void {
    this.leftNavWidth = this.getWidthLeftPanels();

    if (this.hasModuleAnalysis) {
      this.setAnalysisPanelLeft();
    }

    if (!closing) {
      if (this.hasModuleData) {
        // close data panel
        this.setDataPanel(false);
      }

      if (this.hasModuleSoftware) {
        this.setSoftwarePanel(false);
      }
    }
  }

  public softwarePanelStatusChange(closing: boolean): void {
    this.leftNavWidth = this.getWidthLeftPanels();

    if (this.hasModuleAnalysis) {
      this.setAnalysisPanelLeft();
    }

    if (!closing) {
      // Se il pannello software si apre, chiudi gli altri pannelli a sinistra
      if (this.hasModuleData) {
        this.setDataPanel(false);
      }
      if (this.hasModuleRegistry) {
        this.setRegistryPanel(false);
      }
    }
  }

  public setAnalysisPanelLeft() {
    const leftPx = this.getWidthLeftPanels();
    this.renderer.setStyle(this.analysisPanel.nativeElement as HTMLElement, 'left', leftPx.toString() + 'px');
  }

  public filterPanelToggle(): void {
    void this.dataPanelSidenav.toggle().then(() => {
      this.setDataPanel(this.dataPanelSidenav.opened);
    });
  }

  public analysisPanelToggle(): void {
    void this.analysisPanelSidenav.toggle().then(() => {
      this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, JSON.stringify(this.analysisPanelSidenav.opened), false, LocalStorageVariables.LS_ANALYSIS_SIDENAV);

      if (this.analysisPanelSidenav.opened) {
        if (this.tablePanelSidenav.opened) {
          this.tablePanelToggle();
        }
        if (this.graphPanelSidenav.opened) {
          this.graphPanelToggle();
        }
      }
    });
  }

  public registryPanelToggle(): void {
    void this.registryPanelSidenav.toggle().then(() => {
      this.setRegistryPanel(this.registryPanelSidenav.opened);
    });
  }

  public softwarePanelToggle(): void {
    void this.softwarePanelSidenav.toggle().then(() => {
      this.setSoftwarePanel(this.softwarePanelSidenav.opened);
    });
  }

  /**
   * It toggles the right sidenav and emits an event.
   *
   * If the table panel dialog is open, it will close it and skip the rest of the function.
   */
  public tablePanelToggle(): void {
    // If the table dialog is open
    if (this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_TABLE_DIALOG_OPENED)) {
      this.panelsEvent.invokeTableDialogClose.emit();
      // Don't open the table panel if closing the dialog
      return;
    }

    void this.tablePanelSidenav.toggle().then(() => {
      this.panelsEvent.invokeTablePanel.emit();
      this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, JSON.stringify(this.tablePanelSidenav.opened), false, LocalStorageVariables.LS_RIGHT_TOP_SIDENAV);
    });
    this.checkHiddenMarkerOnMap();
  }

  public graphPanelToggle(): void {
    // If the graph dialog is open
    if (this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_GRAPH_DIALOG_OPENED)) {
      this.panelsEvent.invokeGraphDialogClose.emit();
      // Don't open the graph panel if closing the dialog
      return;
    }

    void this.graphPanelSidenav.toggle().then(() => {
      this.panelsEvent.invokeGraphPanel.emit(this.graphPanelSidenav.opened);
      this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, JSON.stringify(this.graphPanelSidenav.opened), false, LocalStorageVariables.LS_RIGHT_BOTTOM_SIDENAV);
    });
  }

  public detachPanel(type: string): void {
    switch (type) {
      case 'table':
        this.tablePanelToggle();
        void this.dialogService.openTablePanel();
        break;

      case 'graph':
        this.graphPanelToggle();
        void this.dialogService.openGraphPanel();
        break;

      default:
        break;
    }
  }
  public closeTablePanel(): void {
    // Check if the table panel is currently open
    if (this.tablePanelSidenav.opened) {
      void this.tablePanelSidenav.close().then(() => {
        // Emit event to indicate the table panel is closed
        this.panelsEvent.invokeTablePanel.emit(false);
        // Update local storage to reflect the closed state
        this.localStoragePersister.set(
          LocalStorageVariables.LS_CONFIGURABLES,
          JSON.stringify(false), // Store the closed state
          false,
          LocalStorageVariables.LS_RIGHT_TOP_SIDENAV,
        );
      });
    }
  }

  public closeGraphPanel(): void {
    // If the graph dialog is open, close it
    if (this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_GRAPH_DIALOG_OPENED)) {
      this.panelsEvent.invokeGraphDialogClose.emit();
    }
    // Ensure the graph panel is closed
    if (this.graphPanelSidenav.opened) {
      void this.graphPanelSidenav.close().then(() => {
        // Emit event to indicate the panel is closed
        this.panelsEvent.invokeGraphPanel.emit(false);
        // Update local storage to reflect the closed state
        this.localStoragePersister.set(
          LocalStorageVariables.LS_CONFIGURABLES,
          JSON.stringify(false), // Store the closed state
          false,
          LocalStorageVariables.LS_RIGHT_BOTTOM_SIDENAV,
        );
      });
    }
  }

  /**
   * The function returns the width of the left panels based on whether the data panel or the registry
   * panel is opened.
   * @returns a number.
   */
  private getWidthLeftPanels(): number {
    if (this.dataPanelSidenav !== undefined && this.dataPanelSidenav.opened) {
      return (this.dataPanel.nativeElement as HTMLElement).offsetWidth;
    }

    if (this.registryPanelSidenav !== undefined && this.registryPanelSidenav.opened) {
      return (this.registryPanel.nativeElement as HTMLElement).offsetWidth;
    }

    if (this.softwarePanelSidenav?.opened) {
      return (this.softwarePanel.nativeElement as HTMLElement).offsetWidth;
    }

    return 0;
  }

  private setTopPositionAnalysis(top: string): void {
    if (this.hasModuleAnalysis) {
      this.renderer.setStyle(this.analysisPanel.nativeElement as HTMLElement, 'top', top + 'px');
    }
  }

  private checkHiddenMarkerOnMap(): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let dataSearchToggleOnMap: Array<string> = JSON.parse((this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_TOGGLE_ON_MAP) as string) || '[]');

    // if no layer selected => remove all dataSearchToggleOnMap records
    setTimeout(() => {
      if (this.configurables.getAll().length === 0) {
        dataSearchToggleOnMap = [];
        this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, JSON.stringify(dataSearchToggleOnMap), false, LocalStorageVariables.LS_TOGGLE_ON_MAP);
      }

      this.hasHiddenMarker = dataSearchToggleOnMap.length !== 0 ? true : false;
    }, 1000);
  }

  private checkLeftSidenavOpen(): void {
    if (this.dataPanelSidenav?.opened) {
      if (this.hasModuleRegistry) {
        this.setRegistryPanel(false);
      }
      if (this.hasModuleSoftware) {
        this.setSoftwarePanel(false);
      }
    }
  }

  private setDataPanel(open = true): void {
    if (open) {
      void this.dataPanelSidenav.open();
      // change map context to data
      this.mapInteractionService.bboxContext.set(CONTEXT_RESOURCE);
    } else {
      void this.dataPanelSidenav.close();
    }
    this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, JSON.stringify(this.dataPanelSidenav.opened), false, LocalStorageVariables.LS_LEFT_TOP_SIDENAV);
  }

  private setRegistryPanel(open = true): void {
    if (open) {
      void this.registryPanelSidenav.open();

      // change map context to registry
      this.mapInteractionService.bboxContext.set(CONTEXT_FACILITY);
    } else {
      void this.registryPanelSidenav.close();
    }
    this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, JSON.stringify(this.registryPanelSidenav.opened), false, LocalStorageVariables.LS_REGISTRY_SIDENAV);
  }

  private setSoftwarePanel(open = true): void {
    if (open) {
      void this.softwarePanelSidenav.open();

      // change map context to software
      this.mapInteractionService.bboxContext.set(CONTEXT_SOFTWARE);
    } else {
      void this.softwarePanelSidenav.close();
    }
    // Salva lo stato nel LocalStorage
    this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, JSON.stringify(this.softwarePanelSidenav.opened), false, LocalStorageVariables.LS_SOFTWARE_SIDENAV);
  }
}
