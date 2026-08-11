import { DialogService } from 'components/dialog/dialog.service';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';
import * as L from 'leaflet';
import { MapLayer } from '../../layers/mapLayer.abstract';
import { EposLeafletComponent } from '../../eposLeaflet.component';
import { Stylable } from 'utility/styler/stylable.interface';
import { Style } from 'utility/styler/style';
import { BehaviorSubject, Subscription } from 'rxjs';
import { PALEOLATITUDE_CONFIG_ID } from 'pages/dataPortal/modules/graphPanel/objects/paleolatitude.interface';

const PALEOLATITUDE_MARKERS_LAYER_ID = 'paleolatitude-markers';
const PALEOLATITUDE_MARKER_PENDING_COLOR = '#9e9e9e';

class PaleolatitudeMarkerLayer extends MapLayer {
  private readonly locationLayer = L.layerGroup();
  private readonly markers = new Map<string, L.Marker>();

  constructor(
    private readonly onMarkerHover: (id: null | string) => void,
    private readonly onMarkerRemove: (id: string) => void,
  ) {
    super(PALEOLATITUDE_MARKERS_LAYER_ID, 'Paleolatitude markers');
    this.options.pane.set(this.id);
    this.options.customLayerOptionOpacity.set(1);
    this.options.customLayerOptionMarkerType.set(MapLayer.MARKERTYPE_RAW);

    const stylable = new PaleolatitudeMarkerStylable();
    stylable.setStyle(new Style('#d71920'));
    this.options.customLayerOptionStylable.set(stylable);
  }

  public addMarker(id: string, latLng: L.LatLng, normalizedLon: number): void {
    const marker = L.marker(latLng, {
      pane: this.id,
      icon: this.createMarkerIcon(PALEOLATITUDE_MARKER_PENDING_COLOR),
    })
      .bindTooltip(this.createTooltipContent('Paleolatitude', normalizedLon, latLng.lat), {
        permanent: false,
        direction: 'right',
        offset: [8, -18],
        className: 'result-tooltip',
      })
      .bindPopup(this.createRemoveButton(id), {
        className: 'paleolatitude-marker-popup',
        closeButton: false,
        minWidth: 0,
        maxWidth: 120,
      })
      .on('mouseover', () => this.onMarkerHover(id))
      .on('mouseout', () => this.onMarkerHover(null))
      .addTo(this.locationLayer);
    this.markers.set(id, marker);
  }

  public setMarkerColor(id: string, color: null | string): void {
    this.markers.get(id)?.setIcon(this.createMarkerIcon(color ?? PALEOLATITUDE_MARKER_PENDING_COLOR));
  }

  public removeMarker(id: string): void {
    const marker = this.markers.get(id);
    if (marker != null) {
      this.locationLayer.removeLayer(marker);
      this.markers.delete(id);
    }
  }

  public setMarkerDetails(id: string, title: string, lon: number, lat: number): void {
    this.markers.get(id)?.setTooltipContent(this.createTooltipContent(title, lon, lat));
  }

  public clearMarkers(): void {
    this.locationLayer.clearLayers();
    this.markers.clear();
  }

  private createMarkerIcon(color: string): L.DivIcon {
    return L.divIcon({
      className: '',
      html: `<span class="material-icons" style="color:${color};font-size:30px;line-height:30px;text-shadow:0 1px 3px rgba(0,0,0,.45);">location_on</span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
  }

  private createTooltipContent(title: string, lon: number, lat: number): HTMLElement {
    const content = document.createElement('div');
    const heading = document.createElement('b');
    heading.textContent = `${title}:`;
    content.append(heading, document.createElement('br'));
    content.append(`X: ${lon.toFixed(6)}`, document.createElement('br'));
    content.append(`Y: ${lat.toFixed(6)}`);
    return content;
  }

  private createRemoveButton(id: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'remove marker';
    button.style.background = 'transparent';
    button.style.border = '0';
    button.style.color = '#293971';
    button.style.cursor = 'pointer';
    button.style.fontSize = '11px';
    button.style.lineHeight = '16px';
    button.style.padding = '1px 3px';
    button.style.textDecoration = 'underline';
    button.addEventListener('click', () => this.onMarkerRemove(id));
    return button;
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
  private readonly locationLayer: PaleolatitudeMarkerLayer;
  private locationLayerAdded = false;
  private enabled = false;
  private readonly locationClickHandler: EventListener;
  private readonly keydownHandler: EventListener;
  private readonly subscriptions = new Array<Subscription>();
  private paleolatitudeMarkerId = 0;

  constructor(
    private dialogService: DialogService,
    private panelsEvent: PanelsEmitterService,
  ) {
    this.locationLayer = new PaleolatitudeMarkerLayer(
      (id: null | string) => this.panelsEvent.setPaleolatitudeMarkerHover(id),
      (id: string) => this.panelsEvent.removePaleolatitude(id),
    );
    this.locationClickHandler = (event: Event) => this.addLocationMarker(event as MouseEvent);
    this.keydownHandler = (event: Event) => this.handleKeydown(event as KeyboardEvent);
  }

  public addTo(eposLeaflet: EposLeafletComponent): this {
    this.eposLeaflet = eposLeaflet;
    this.map = eposLeaflet.getLeafletObject();
    this.subscriptions.push(
      this.panelsEvent.paleolatitudeMarkerColorObs.subscribe(({ id, color }) => {
        this.locationLayer.setMarkerColor(id, color);
      }),
      this.panelsEvent.removePaleolatitudeMarkerObs.subscribe((id: string) => {
        this.locationLayer.removeMarker(id);
      }),
      this.panelsEvent.removePaleolatitudeObs.subscribe((id: string) => {
        this.locationLayer.removeMarker(id);
      }),
      this.panelsEvent.paleolatitudeResultObs.subscribe((result) => {
        const title = result.plateName == null ? 'Paleolatitude' : `Paleolatitude - ${result.plateName}`;
        this.locationLayer.setMarkerDetails(result.id, title, result.selectedLon, result.selectedLat);
      }),
    );
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
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
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
    const markerId = `${PALEOLATITUDE_CONFIG_ID}-${++this.paleolatitudeMarkerId}`;
    this.locationLayer.addMarker(markerId, latLng, normalizedLon);
    this.panelsEvent.setPaleolatitudeRequest(markerId, latLng.lat, normalizedLon);
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
