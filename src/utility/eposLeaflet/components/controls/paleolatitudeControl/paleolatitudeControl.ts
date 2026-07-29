import { DialogService } from 'components/dialog/dialog.service';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';
import * as L from 'leaflet';
import { MapLayer } from '../../layers/mapLayer.abstract';
import { EposLeafletComponent } from '../../eposLeaflet.component';
import { Stylable } from 'utility/styler/stylable.interface';
import { Style } from 'utility/styler/style';
import { BehaviorSubject } from 'rxjs';

const PALEOLATITUDE_MARKERS_LAYER_ID = 'paleolatitude-markers';

class PaleolatitudeMarkerLayer extends MapLayer {
  private readonly locationLayer = L.layerGroup();

  constructor() {
    super(PALEOLATITUDE_MARKERS_LAYER_ID, 'Paleolatitude markers');
    this.options.pane.set(this.id);
    this.options.customLayerOptionOpacity.set(1);
    this.options.customLayerOptionMarkerType.set(MapLayer.MARKERTYPE_RAW);

    const stylable = new PaleolatitudeMarkerStylable();
    stylable.setStyle(new Style('#d71920'));
    this.options.customLayerOptionStylable.set(stylable);
  }

  public addMarker(latLng: L.LatLng, normalizedLon: number): void {
    L.marker(latLng, {
      pane: this.id,
      icon: L.divIcon({
        className: '',
        html: '<span class="material-icons" style="color:#d71920;font-size:30px;line-height:30px;text-shadow:0 1px 3px rgba(0,0,0,.45);">location_on</span>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      }),
    })
      .bindTooltip(`X: ${normalizedLon.toFixed(6)}<br>Y: ${latLng.lat.toFixed(6)}`, {
        permanent: false,
        direction: 'right',
        offset: [8, -18],
        className: 'result-tooltip',
      })
      .addTo(this.locationLayer);
  }

  public clearMarkers(): void {
    this.locationLayer.clearLayers();
  }

  protected getLeafletLayer(): Promise<L.Layer> {
    return Promise.resolve(this.locationLayer);
  }

  protected updateLeafletLayerOpacity(): void {
    this.locationLayer.eachLayer((layer: L.Layer) => {
      if (layer instanceof L.Marker) {
        layer.setOpacity(this.options.customLayerOptionOpacity.get()!);
      }
    });
  }
}

class PaleolatitudeMarkerStylable implements Stylable {
  private readonly styleSrc = new BehaviorSubject<null | Style>(null);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public readonly styleObs = this.styleSrc.asObservable();

  public setStyle(style: null | Style): void {
    this.styleSrc.next(style);
  }

  public getStyle(): null | Style {
    return this.styleSrc.value;
  }
}

export class PaleolatitudeControl {
  private map: L.Map;
  private eposLeaflet: EposLeafletComponent;
  private readonly locationLayer = new PaleolatitudeMarkerLayer();
  private locationLayerAdded = false;
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

  public addTo(eposLeaflet: EposLeafletComponent): this {
    this.eposLeaflet = eposLeaflet;
    this.map = eposLeaflet.getLeafletObject();
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
    this.locationLayer.addMarker(latLng, normalizedLon);
    if (!this.locationLayerAdded) {
      this.locationLayerAdded = true;
      this.eposLeaflet.addLayer(this.locationLayer);
    }
  }

  private clearMarkers(): void {
    this.locationLayer.clearMarkers();
    if (this.locationLayerAdded) {
      this.locationLayerAdded = false;
      this.eposLeaflet.removeLayerByIdCRS(this.locationLayer.id);
    }
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
