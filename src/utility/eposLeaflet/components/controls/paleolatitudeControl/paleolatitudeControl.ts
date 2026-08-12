import { DialogService } from 'components/dialog/dialog.service';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';
import * as L from 'leaflet';
import { MapLayer } from '../../layers/mapLayer.abstract';
import { EposLeafletComponent } from '../../eposLeaflet.component';
import { Stylable } from 'utility/styler/stylable.interface';
import { Style } from 'utility/styler/style';
import { BehaviorSubject, Subscription } from 'rxjs';
import { PALEOLATITUDE_CONFIG_ID } from 'pages/dataPortal/modules/graphPanel/objects/paleolatitude.interface';
import { FeatureDisplayItem } from '../../featureDisplay/featureDisplayItem';
import { MoveMethod } from '../../moveMethod.enum';

const PALEOLATITUDE_MARKERS_LAYER_ID = 'paleolatitude-markers';
const PALEOLATITUDE_MARKER_PENDING_COLOR = '#9e9e9e';

class PaleolatitudeMarkerLayer extends MapLayer {
  private readonly locationLayer = L.layerGroup();
  private readonly markers = new Map<string, L.Marker>();

  constructor(
    private readonly onMarkerHover: (id: null | string) => void,
    private readonly onMarkerClick: (id: string, lat: number, lon: number) => void,
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
      .on('mouseover', () => this.onMarkerHover(id))
      .on('mouseout', () => this.onMarkerHover(null))
      .on('click', () => this.onMarkerClick(id, latLng.lat, normalizedLon))
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

  public getMarker(id: string): L.Marker | undefined {
    return this.markers.get(id);
  }

  public clearMarkers(): void {
    this.locationLayer.clearLayers();
    this.markers.clear();
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

  private createMarkerIcon(color: string): L.DivIcon {
    return L.divIcon({
      className: '',
      html: `<span class="material-icons" style="color:${color};font-size:30px;line-height:30px;text-shadow:0 1px 3px rgba(0,0,0,.45);">location_on</span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
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
      (id: string, lat: number, lon: number) => this.showMarkerPopup(id, lat, lon),
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
      this.panelsEvent.viewPaleolatitudeOnMapObs.subscribe((id: string) => {
        this.viewMarkerOnMap(id);
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

  private showMarkerPopup(id: string, lat: number, lon: number): void {
    const result = this.panelsEvent.getPaleolatitudeResults().find((item) => item.id === id);
    const title = result?.plateName == null ? 'Paleolatitude' : `Paleolatitude - ${result.plateName}`;
    const content = document.createElement('div');
    const heading = document.createElement('h5');
    heading.className = 'popup-title';
    heading.textContent = title;
    content.append(heading);
    content.append(this.createPopupAction('View on Graph', 'fas fa-chart-line', () => {
      this.panelsEvent.viewPaleolatitudeOnGraph(id);
    }));

    const table = document.createElement('table');
    table.className = 'layer-popup-table';
    table.append(
      this.createPopupRow('Latitude', lat.toFixed(6)),
      this.createPopupRow('Longitude', lon.toFixed(6)),
    );
    content.append(table);
    const removeMarkerAction = this.createPopupAction('Remove marker', 'fas fa-trash-alt', () => {
      this.panelsEvent.removePaleolatitude(id);
      this.map.closePopup();
    });
    removeMarkerAction.style.margin = '8px auto';
    content.append(removeMarkerAction);

    const displayItem = new FeatureDisplayItem(null, () => content);
    this.eposLeaflet.getLayerClickManager()?.displayFeatures(
      Promise.resolve([displayItem]),
      [lat, lon],
    );
  }

  private viewMarkerOnMap(id: string): void {
    const marker = this.locationLayer.getMarker(id);
    if (marker == null) {
      return;
    }
    const latLng = marker.getLatLng();
    const latOffset = -60 * Math.pow(0.5, this.map.getZoom());
    this.eposLeaflet.moveView(latLng.lat, latLng.lng, MoveMethod.PAN, 10, latOffset, 0);
    setTimeout(() => this.showMarkerPopup(id, latLng.lat, this.normalizeLongitude(latLng.lng)), 400);
  }

  private createPopupRow(label: string, value: string): HTMLTableRowElement {
    const row = document.createElement('tr');
    const heading = document.createElement('th');
    const cell = document.createElement('td');
    heading.textContent = label;
    cell.textContent = value;
    row.append(heading, cell);
    return row;
  }

  private createPopupAction(label: string, iconClass: string, action: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    const icon = document.createElement('i');
    button.type = 'button';
    button.textContent = label;
    button.style.background = 'transparent';
    button.style.border = '0';
    button.style.cursor = 'pointer';
    button.style.display = 'block';
    button.style.font = 'inherit';
    button.style.margin = '8px 0 8px auto';
    button.style.padding = '0';
    button.style.textDecoration = 'underline';
    icon.className = iconClass;
    icon.style.marginLeft = '5px';
    button.append(icon);
    button.addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation();
      action();
    });
    return button;
  }

  private async showPaleolatitudeDialog(): Promise<boolean> {
    const message = `
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
