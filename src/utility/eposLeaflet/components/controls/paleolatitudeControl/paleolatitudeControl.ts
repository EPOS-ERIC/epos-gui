import { DialogService } from 'components/dialog/dialog.service';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';
import * as L from 'leaflet';

export class PaleolatitudeControl {
  private map: L.Map;
  private locationLayer: L.LayerGroup;
  private enabled = false;
  private readonly locationClickHandler: EventListener;
  private readonly keydownHandler: EventListener;

  constructor(
    private dialogService: DialogService,
    private panelsEvent: PanelsEmitterService,
  ) {
    this.locationClickHandler = (event: Event) => this.addLocationMarker(event as MouseEvent);
    this.keydownHandler = (event: Event) => this.handleKeydown(event as KeyboardEvent);
  }

  public addTo(map: L.Map): this {
    this.map = map;
    this.locationLayer = L.layerGroup().addTo(map);
    return this;
  }

  public setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) {
      return;
    }

    this.enabled = enabled;
    if (enabled) {
      void this.activate();
    } else {
      this.deactivate();
    }
  }

  public remove(): void {
    this.enabled = false;
    this.deactivate();
    this.locationLayer?.remove();
  }

  private async activate(): Promise<void> {
    this.clearMarkers();
    (this.map.getContainer() as HTMLElement).blur();
    await this.showPaleolatitudeDialog();

    if (!this.enabled) {
      return;
    }
    this.map.getContainer().classList.add('leaflet-crosshair');
    this.map.getContainer().addEventListener('dblclick', this.locationClickHandler, true);
    document.addEventListener('keydown', this.keydownHandler);
  }

  private deactivate(): void {
    if (!this.map) {
      return;
    }
    this.map.getContainer().classList.remove('leaflet-crosshair');
    this.map.getContainer().removeEventListener('dblclick', this.locationClickHandler, true);
    document.removeEventListener('keydown', this.keydownHandler);
    this.clearMarkers();
    this.panelsEvent.clearPaleolatitude();
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.clearMarkers();
      this.panelsEvent.clearPaleolatitude();
    }
  }

  private addLocationMarker(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.leaflet-control') !== null) {
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

  private clearMarkers(): void {
    this.locationLayer?.clearLayers();
  }

  private normalizeLongitude(lon: number): number {
    return ((((lon + 180) % 360) + 360) % 360) - 180;
  }

  private async showPaleolatitudeDialog(): Promise<boolean> {
    const message = `
      <p><b>Paleolatitude Graph View</b></p>
      <p>To select a point on the map, double-click on it.</p>
      <p>To clear all markers, press ESC on the keyboard.</p>
    `;

    return this.dialogService.openConfirmationDialog(
      message,
      true,
      'Got It',
      'confirm',
    );
  }
}
