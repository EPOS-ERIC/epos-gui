import { DialogService } from 'components/dialog/dialog.service';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';
import * as L from 'leaflet';
import 'leaflet-ruler';

export class MeasureDistanceControl extends L.Control {
  private static dialogShown = false;
  private static paleolatitudeDialogShown = false;

  private measureControl: L.Control.Ruler;
  private measurePane: HTMLElement;
  private originalPathPane: string | undefined;
  private map: L.Map;
  private toolbar: HTMLElement;
  private locationLayer: L.LayerGroup;
  private distanceClick: ((this: HTMLElement, event: MouseEvent) => void) | null = null;
  private activeMode: 'distance' | 'location' | null = null;
  private readonly locationClickHandler: EventListener;
  private readonly toolKeydownHandler: EventListener;

  constructor(
    private dialogService: DialogService,
    private panelsEvent: PanelsEmitterService,
  ) {
    super({ position: 'topright' });
    this.locationClickHandler = (event: Event) => this.addlocationMarker(event as MouseEvent);
    this.toolKeydownHandler = (event: Event) => this.handleToolKeydown(event as KeyboardEvent);
  }

  public addTo(map: L.Map): this {
    this.map = map;
    this.measurePane = map.createPane('rulerMeasure');
    this.measurePane.style.zIndex = '600';
    this.measurePane.style.pointerEvents = 'none';
    this.locationLayer = L.layerGroup().addTo(map);

    const options: L.Control.RulerOptions = {
      position: 'topright',
      pane: 'rulerMeasure',
      lengthUnit: {
        factor: 1,
        display: 'km',
        decimal: 2,
        label: 'Distance',
      },
      circleMarker: {
        color: 'red',
        radius: 4,
      },
      lineStyle: {
        color: 'red',
        dashArray: '5, 5',
      },
      measureArea: false,
    };

    // 1. Save the original value before modifying it
    this.originalPathPane = L.Path.prototype.options.pane;

    // 2. Apply the patch (required by the leaflet-ruler plugin)
    L.Path.prototype.options.pane = 'rulerMeasure';

    this.measureControl = L.control.ruler(options).addTo(map);
    const container = this.measureControl.getContainer();

    if (container) {
      container.classList.add('measure-distance-button');
      const rulerInstance = this.measureControl as L.Control.Ruler & {
        '_choice': boolean;
        '_toggleMeasure': () => void;
      };
      const choiceKey = '_choice';
      const toggleMeasureKey = '_toggleMeasure';
      L.DomEvent.off(container, 'click', rulerInstance[toggleMeasureKey], rulerInstance);
      this.distanceClick = () => {
        if (!rulerInstance[choiceKey]) {
          rulerInstance[toggleMeasureKey]();
        }
      };
      this.toolbar = this.createToolbar();
      map.getContainer().appendChild(this.toolbar);

      // Override the click to show the tool selector instead of immediately activating the ruler plugin.
      container.onclick = (event: MouseEvent) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        this.toggleToolbar();
      };
    }
    return this;
  }

  /**
     * Forcibly stops an active measurement and manually cleans up
     * all listeners, states, and styles (like 'leaflet-crosshair')
     * left behind by the leaflet-ruler plugin.
     *
     * This is a "hard reset" necessary to prevent state leaks (e.g., a stuck
     * crosshair cursor) when the map is destroyed or re-initialized
     * (e.g., switching projections).
     */
  /* eslint-disable no-underscore-dangle, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */
  public stopMeasurement(): void {
    // Get the internal leaflet-ruler control instance.
    // We must use 'as any' to access its private, underscored properties.
    const rulerInstance = this.measureControl as any;

    // Safety check: Only proceed if the ruler instance and its associated map still exist.
    if (rulerInstance && rulerInstance._map) {
      // Get the L.Map instance
      const map = rulerInstance._map;
      // Get the main map <div> container element
      const container = map._container;

      // Check if the map container element exists
      if (container) {
        // KEY FIX: Reset the inline cursor style to default.
        // The plugin often sets 'cursor: crosshair' directly on the element's style.
        container.style.cursor = rulerInstance._defaultCursor ?? '';
        document.removeEventListener('keydown', this.toolKeydownHandler);

        // Also remove the CSS class, just in case the plugin uses both methods.
        L.DomUtil.removeClass(container, 'leaflet-crosshair');
      }
      if (rulerInstance._container) {
        L.DomUtil.removeClass(rulerInstance._container, 'leaflet-ruler-clicked');
      }

      // --- Manually remove event listeners ---
      if (rulerInstance._escape) {
        L.DomEvent.off(container, 'keydown', rulerInstance._escape, rulerInstance);
      }
      if (rulerInstance._closePath) {
        L.DomEvent.off(container, 'dblclick', rulerInstance._closePath, rulerInstance);
      }
      if (rulerInstance._clicked) {
        map.off('click', rulerInstance._clicked, rulerInstance);
      }
      if (rulerInstance._moving) {
        map.off('mousemove', rulerInstance._moving, rulerInstance);
      }

      // Forcefully reset the plugin's internal state to 'not measuring'.
      if (rulerInstance._measuring) {
        rulerInstance._measuring = false;
      }
      rulerInstance._choice = false;
      rulerInstance._clickedLatLong = null;
      rulerInstance._clickedPoints = [];
      rulerInstance._clickCount = 0;
      rulerInstance._totalLength = 0;

      // --- Clean up any leftover map layers ---
      if (rulerInstance._allLayers && map.hasLayer(rulerInstance._allLayers)) {
        map.removeLayer(rulerInstance._allLayers);
      }
      if (rulerInstance._tempLine && map.hasLayer(rulerInstance._tempLine)) {
        map.removeLayer(rulerInstance._tempLine);
      }
      if (rulerInstance._tempPoint && map.hasLayer(rulerInstance._tempPoint)) {
        map.removeLayer(rulerInstance._tempPoint);
      }
      rulerInstance._allLayers = L.layerGroup();
      rulerInstance._tempLine = null;
      rulerInstance._tempPoint = null;
      rulerInstance._pointLayer = null;
      rulerInstance._polylineLayer = null;

      map.doubleClickZoom.enable();
    }
  }

  public remove(): this {
    this.stopMeasurement();
    this.deactivatelocation(true);

    if (this.toolbar && this.toolbar.parentNode) {
      this.toolbar.parentNode.removeChild(this.toolbar);
    }

    if (this.measureControl) {
      this.measureControl.remove();
    }
    // Remove the custom pane
    if (this.measurePane && this.measurePane.parentNode) {
      this.measurePane.parentNode.removeChild(this.measurePane);
    }

    // Restore the original prototype value
    L.Path.prototype.options.pane = this.originalPathPane;

    return this;
  }

  private createToolbar(): HTMLElement {
    const toolbar = L.DomUtil.create('div', 'map-tool-mode-toolbar hidden');
    const distanceButton = L.DomUtil.create('button', 'map-tool-mode-button', toolbar);
    const locationButton = L.DomUtil.create('button', 'map-tool-mode-button', toolbar);

    distanceButton.type = 'button';
    locationButton.type = 'button';
    distanceButton.innerText = 'Distance';
    locationButton.innerText = 'Paleolatitude';

    L.DomEvent.disableClickPropagation(toolbar);
    L.DomEvent.on(distanceButton, 'click', (event: MouseEvent) => {
      event.preventDefault();
      void this.activateDistance(event);
    });
    L.DomEvent.on(locationButton, 'click', (event: MouseEvent) => {
      event.preventDefault();
      void this.activatelocation(event);
    });

    return toolbar;
  }

  private toggleToolbar(): void {
    if (!this.toolbar) {
      return;
    }

    if (this.activeMode !== null) {
      this.resetTool();
      return;
    }

    const isHidden = this.toolbar.classList.contains('hidden');
    if (isHidden) {
      this.toolbar.classList.remove('hidden');
      document.addEventListener('keydown', this.toolKeydownHandler);
    } else {
      this.toolbar.classList.add('hidden');
      document.removeEventListener('keydown', this.toolKeydownHandler);
    }
  }

  private async activateDistance(event: MouseEvent): Promise<void> {
    this.deactivatelocation(true);
    this.setActiveMode('distance');

    if (!MeasureDistanceControl.dialogShown) {
      event.stopPropagation();
      (this.map.getContainer() as HTMLElement).blur();
      await this.showMeasureDialog();
      MeasureDistanceControl.dialogShown = true;
    }

    if (this.distanceClick && this.measureControl.getContainer()) {
      this.distanceClick.call(this.measureControl.getContainer() as HTMLElement, event);
      document.addEventListener('keydown', this.toolKeydownHandler);
    }
  }

  private handleToolKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      setTimeout(() => {
        this.resetTool();
      });
    }
  }

  private async activatelocation(event: MouseEvent): Promise<void> {
    this.stopMeasurement();
    this.clearlocationMarkers();
    this.setActiveMode('location');

    if (!MeasureDistanceControl.paleolatitudeDialogShown) {
      event.stopPropagation();
      (this.map.getContainer() as HTMLElement).blur();
      await this.showPaleolatitudeDialog();
      MeasureDistanceControl.paleolatitudeDialogShown = true;
    }

    this.map.getContainer().classList.add('leaflet-crosshair');
    this.map.getContainer().addEventListener('dblclick', this.locationClickHandler, true);
    document.addEventListener('keydown', this.toolKeydownHandler);
  }

  private deactivatelocation(clearMarkers = false): void {
    if (!this.map) {
      return;
    }
    this.map.getContainer().classList.remove('leaflet-crosshair');
    this.map.getContainer().removeEventListener('dblclick', this.locationClickHandler, true);
    if (clearMarkers) {
      this.clearlocationMarkers();
    }
    if (this.activeMode === 'location') {
      this.panelsEvent.clearPaleolatitude();
      this.setActiveMode(null);
    }
  }

  private addlocationMarker(event: MouseEvent): void {
    if (this.activeMode !== 'location') {
      return;
    }
    const target = event.target as HTMLElement;
    if (this.toolbar?.contains(target) || target.closest('.leaflet-control') !== null) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    const latLng = this.map.mouseEventToLatLng(event);
    const normalizedLon = this.normalizeLongitude(latLng.lng);
    this.panelsEvent.setPaleolatitudeRequest(latLng.lat, normalizedLon);
    const marker = L.marker(latLng, {
      icon: L.divIcon({
        className: '',
        html: '<span class="material-icons" style="color:#d71920;font-size:30px;line-height:30px;text-shadow:0 1px 3px rgba(0,0,0,.45);">location_on</span>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      }),
    }).addTo(this.locationLayer);
    marker
      .bindTooltip(`X: ${normalizedLon.toFixed(6)}<br>Y: ${latLng.lat.toFixed(6)}`, {
        permanent: true,
        direction: 'right',
        offset: [8, -18],
        className: 'result-tooltip',
      })
      .openTooltip();
  }

  private clearlocationMarkers(): void {
    if (this.locationLayer) {
      this.locationLayer.clearLayers();
    }
  }

  private normalizeLongitude(lon: number): number {
    return ((((lon + 180) % 360) + 360) % 360) - 180;
  }

  private resetTool(): void {
    this.toolbar?.classList.add('hidden');
    this.stopMeasurement();
    this.deactivatelocation(true);
    this.setActiveMode(null);
    document.removeEventListener('keydown', this.toolKeydownHandler);
  }

  private setActiveMode(mode: 'distance' | 'location' | null): void {
    this.activeMode = mode;
    const container = this.measureControl?.getContainer();
    if (container) {
      if (mode === null) {
        container.classList.remove('leaflet-ruler-clicked');
      } else {
        container.classList.add('leaflet-ruler-clicked');
      }
    }
    if (!this.toolbar) {
      return;
    }

    this.toolbar.querySelectorAll('.map-tool-mode-button').forEach((button: Element) => {
      button.classList.remove('active');
    });

    if (mode === 'distance') {
      this.toolbar.querySelector('.map-tool-mode-button:first-child')?.classList.add('active');
    }
    if (mode === 'location') {
      this.toolbar.querySelector('.map-tool-mode-button:last-child')?.classList.add('active');
    }
  }

  /**
   * Displays the confirmation dialog with improved instructions.
   */
  private async showMeasureDialog(): Promise<boolean> {
    const message = `
      <p><b>Measure Tool Tips:</b></p>
      <p> To finish the current line, double-click or press ESC; </p>
      <p> To clear all measurements and close the tool, click the ruler icon again. </p>
    `;

    return this.dialogService.openConfirmationDialog(
      message,      // messageHtml
      true,        // closable
      'Got It',     // confirmButtonHtml
      'confirm',    // confirmButtonCssClass (valore di default)
    );
  }

  private async showPaleolatitudeDialog(): Promise<boolean> {
    const message = `
      <p><b>Paleolatitude Graph View</b></p>
      <p>To select a point on the map, double-click on it.</p>
      <p>To clear all markers and close the tool, click the paleolatitude icon again.</p>
    `;

    return this.dialogService.openConfirmationDialog(
      message,
      true,
      'Got It',
      'confirm',
    );
  }
}


// Type declarations for leaflet-ruler (unchanged)
declare module 'leaflet' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Control {
    interface RulerOptions extends ControlOptions {
      measureArea?: boolean;
      circleMarker?: {
        color: string;
        radius: number;
      };
      lineStyle?: {
        color: string;
        dashArray: string;
      };
      polyStyle?: {
        stroke: boolean;
        fillColor: string;
        fillOpacity: number;
      };
      lengthUnit?: {
        display: string;
        decimal: number;
        factor: number;
        label?: string;
      };
      pane?: string;
    }

    interface Ruler extends Control {
      remove(): this;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace control {
    function ruler(options?: Control.RulerOptions): Control.Ruler;
  }
}
