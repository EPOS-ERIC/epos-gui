import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import * as L from 'leaflet';
import { Map as LMap } from 'leaflet';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MapLayer } from '../layers/mapLayer.abstract';
import { Subscription } from 'rxjs';
import { LayersService } from 'utility/eposLeaflet/services/layers.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { BaseLayerOption } from '../controls/public_api';
import { baseLayerOptions } from '../controls/baseLayerControl/baseLayerOptions';
import { Style } from 'utility/styler/style';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { GeoJSONImageOverlayMapLayer } from 'utility/maplayers/geoJSONImageOverlayMapLayer';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Feature, FeatureCollection, GeoJsonObject, GeometryObject, Point } from 'geojson';
import { GeoJsonLayer } from '../layers/geoJsonLayer/geoJsonLayer';
import { WmsTileLayer } from '../layers/wmsTileLayer';
import { WmtsTileLayer } from '../layers/wmtsTileLayer';
import {
  ExternalTileServiceCatalogLayer,
  ExternalTileServiceLayer,
} from '../layers/externalTileServiceLayer';
import { ElementLegendItem, Legend } from '../controls/public_api';
import { GeoJSONHelper } from 'utility/maplayers/geoJSONHelper';
import { CovJSONHelper } from 'utility/maplayers/covJSONHelper';
import { MapInteractionService } from 'utility/eposLeaflet/services/mapInteraction.service';
import { PopupProperty } from 'utility/maplayers/popupProperty';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { NotificationService } from 'services/notification.service';

type WmsCrsRow = { layerName: string; crs: string; status: boolean };
type ExternalLayerType = 'geojson' | 'covjson' | 'wms' | 'wmts' | 'wfs';
type ExternalVectorLayerType = 'geojson' | 'covjson' | 'wfs';

type ExternalWfsSource = {
  baseUrl: string;
  parameters: Map<string, string>;
  version: string;
};

type PersistedExternalLayer = {
  url: string;
  name: string;
  type: ExternalLayerType;
  layerIdentifier?: string;
};

type ExternalLayersStorageV2 = {
  version: 2;
  layers: Array<PersistedExternalLayer>;
};

@Unsubscriber('subscriptions')
@Component({
  selector: 'app-layer-control',
  templateUrl: './layerControl.component.html',
  styleUrls: ['./layerControl.component.scss']
})
export class LayerControlComponent implements OnInit {

  private static readonly EXTERNAL_LAYER_COLORS = [
    '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f',
    '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ab',
  ];

  @Output() externalLayerAdd = new EventEmitter<MapLayer>();

  public selectedBaseLayerVal = '';

  public currentCRS: string = 'EPSG:3857';

  public orderedLayers: Array<MapLayer> = [];

  public arcticOverlays: Array<MapLayer> = [];

  public filteredBaseLayers: BaseLayerOption[] = [];

  public basemapToggled = true;

  public externalLayerFormOpened = false;

  public externalLayerUrl = '';

  public externalLayerName = '';

  public externalCatalogLayers: Array<ExternalTileServiceCatalogLayer> = [];

  public selectedExternalLayerIdentifier = '';

  public selectedExternalLayerIdentifiers = new Array<string>();

  public externalLayerLoading = false;

  public externalLayerError = '';

  protected subscriptions: Array<Subscription> = new Array<Subscription>();

  private _map: LMap;

  private pendingServiceLayer: WmsTileLayer | WmtsTileLayer | null = null;

  private pendingCapabilitiesXml: JQuery<XMLDocument> | null = null;

  private pendingWfsSource: ExternalWfsSource | null = null;

  private detectedExternalLayerType: ExternalLayerType | null = null;

  private detectedExternalGeoJsonData: GeoJsonObject | null = null;

  private detectedExternalCovJsonData: Record<string, unknown> | null = null;

  private detectedExternalSourceName = '';

  private externalVectorLayerColorIndex = 0;

  private externalLayerNames = new Set<string>();

  private externalLayerStorageRecords = new Map<string, PersistedExternalLayer>();

  private externalLayerStorageWarningShown = false;

  constructor(
    private layersService: LayersService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private mapInteractionService: MapInteractionService,
    private localStoragePersister: LocalStoragePersister,
    private notificationService: NotificationService,
  ) {}

  get activeArcticOverlaysCount(): number {
    if (!this.arcticOverlays) {
      return 0;
    }
    // Counts the layers that are NOT hidden.
    return this.arcticOverlays.filter(layer => !layer.hidden.get()).length;
  }

  public get canAddExternalLayer(): boolean {
    if (this.isExternalMultiLayerSource) {
      return this.selectedExternalLayerIdentifiers.length > 0;
    }
    return (this.detectedExternalLayerType !== 'wmts' && this.detectedExternalLayerType !== 'wfs')
      || this.selectedExternalLayerIdentifier.length > 0;
  }

  public get isExternalMultiLayerSource(): boolean {
    return this.detectedExternalLayerType === 'wms' || this.detectedExternalLayerType === 'wmts';
  }

  public get compatibleExternalCatalogLayers(): Array<ExternalTileServiceCatalogLayer> {
    return this.externalCatalogLayers.filter(layer => layer.compatible);
  }

  @Input() set map(map: LMap) {
    if (map) {
      this._map = map;
    }
  }

  ngOnInit(): void {
    // Retrieve stored CRS or use default
    this.currentCRS = this.layersService.getStoredCRS() ?? 'EPSG:3857';

    // Load and apply base layer for current CRS
    const baseMapStorage = this.layersService.getBaseLayerFromStorage(this.currentCRS);
    this.applyBaseLayerState(baseMapStorage);

    // Reactive subscriptions
    this.subscriptions.push(

      // CRS change → update current CRS and base layer
      this.layersService.crsChange$.subscribe((newCRS: string) => {
        this.currentCRS = newCRS;
        const updatedBaseMap = this.layersService.getBaseLayerFromStorage(newCRS);
        this.applyBaseLayerState(updatedBaseMap);

        // Re-trigger compatibility checks for current layers (new CRS)
        for (const layer of this.orderedLayers) {
          // reset pending promise to allow a fresh run for the new CRS
          if (this.isTileCrsCheckCapable(layer)) {
            layer.crsCheckReady = undefined;
          }
          // trigger (lazy) check; UI will update when the async finishes
          this.checkLayerCompatibility(layer);
        }
      }),

      // Layer changes → reorder visible layers
      this.layersService.layersChangeSourceObs.subscribe((layers: Array<MapLayer>) => {
        this.orderLayers(layers);
        this.mapInteractionService.retainExternalVisualisationSources(
          layers.filter(layer => layer.id.startsWith('external-layer-')).map(layer => layer.id)
        );

        // Trigger (lazy) compatibility checks for any new/updated layer
        for (const layer of this.orderedLayers) {
          this.checkLayerCompatibility(layer);
        }
      }),

      // Base layer change (e.g. via radio or toggle) → update state and options
      this.layersService.baseLayerChangeSourceObs.subscribe((basemap: BaseLayerOption) => {
        if (basemap) {
          this.applyBaseLayerState(basemap);
        }
      })
    );

    void this.restoreExternalLayers();
  }

  public applyBaseLayerState(basemap: BaseLayerOption): void {
    this.selectedBaseLayer(basemap.name);
    this.basemapToggled = basemap.name !== 'None';

    this.filteredBaseLayers = baseLayerOptions.filter(
      b =>
        b.supportedCRS?.includes(this.currentCRS) ||
        b.name === basemap.name
    );
  }

  public drop(event: CdkDragDrop<MapLayer[]>): void {
    if (event.previousContainer === event.container) {
      this.changeOrder(event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  public selectedBaseLayer(selectedBaseLayer: string): void {
    this.selectedBaseLayerVal = selectedBaseLayer;
  }

  public removeExternalLayer(layer: MapLayer): void {
    if (layer.id.startsWith('external-layer-')) {
      this.removePersistedExternalLayer(layer.id);
      this.mapInteractionService.removeHiddenMarkerByLayerId(layer.id, false);
      layer.getEposLeaflet().removeLayerById(layer.id);
    }
  }

  public updateEnable(event: MatSlideToggleChange): void {
    if (event.checked) {
      this.layersService.baseLayerChange(this.layersService.lastActiveBaseLayer, this.currentCRS);
      this.selectedBaseLayer((this.layersService.lastActiveBaseLayer as BaseLayerOption).name);

      if (this.arcticOverlays && this.arcticOverlays.length > 0) {
        this.arcticOverlays.forEach(layer => {
          layer.hidden.set(false);
          this.layersService.setArticOverlayLayerVisibility(layer.id, true);
        });
      }

    } else {
      const noneLayer = baseLayerOptions.find(b => b.name === 'None')!;
      this.layersService.baseLayerChange(noneLayer, this.currentCRS);
      this.selectedBaseLayer('None');

      if (this.arcticOverlays && this.arcticOverlays.length > 0) {
        this.arcticOverlays.forEach(layer => {
          layer.hidden.set(true);
          this.layersService.setArticOverlayLayerVisibility(layer.id, false);
        });
      }
    }
  }

  public toggleExternalLayerForm(): void {
    if (this.externalLayerFormOpened) {
      this.resetExternalLayerForm();
    } else {
      this.externalLayerFormOpened = true;
    }
  }

  public externalLayerSourceChanged(): void {
    this.externalCatalogLayers = [];
    this.selectedExternalLayerIdentifier = '';
    this.selectedExternalLayerIdentifiers = [];
    this.pendingServiceLayer = null;
    this.pendingCapabilitiesXml = null;
    this.pendingWfsSource = null;
    this.detectedExternalLayerType = null;
    this.detectedExternalGeoJsonData = null;
    this.detectedExternalCovJsonData = null;
    this.detectedExternalSourceName = '';
    this.externalLayerError = '';
  }

  public async detectExternalSource(): Promise<void> {
    this.externalLayerSourceChanged();
    this.externalLayerLoading = true;

    try {
      const url = this.getExternalLayerUrl();
      const service = this.getExternalServiceType(url);
      if (service === 'wfs' && url.searchParams.get('request')?.toLowerCase() === 'getfeature') {
        const data = this.tryParseJson(await this.getExternalSourceResponse(url));
        if (data == null) {
          throw new Error('The WFS GetFeature response is not valid GeoJSON.');
        }
        this.detectExternalJsonSource(data);
      } else if (service != null) {
        await this.detectExternalServiceSource(url, service);
      } else {
        const response = await this.getExternalSourceResponse(url);
        const data = this.tryParseJson(response);
        if (data != null) {
          this.detectExternalJsonSource(data);
        } else {
          await this.detectExternalServiceSource(url);
        }
      }
    } catch (error) {
      this.externalLayerError = this.getExternalLayerError(error, 'Unable to detect the external source.');
    } finally {
      this.externalLayerLoading = false;
    }
  }

  public async addExternalLayer(): Promise<void> {
    if (this.detectedExternalLayerType === null) {
      await this.detectExternalSource();
      if (this.detectedExternalLayerType === null
        || this.detectedExternalLayerType === 'wms'
        || this.detectedExternalLayerType === 'wmts'
        || this.detectedExternalLayerType === 'wfs') {
        return;
      }
    }

    this.externalLayerError = '';
    this.externalLayerLoading = true;

    try {
      if (this.detectedExternalLayerType === 'geojson' || this.detectedExternalLayerType === 'covjson') {
        this.addDetectedExternalGeoJsonLayer();
      } else if (this.detectedExternalLayerType === 'wfs') {
        await this.addDetectedExternalWfsLayer();
      } else {
        this.addExternalServiceLayer();
      }
      this.resetExternalLayerForm();
    } catch (error) {
      this.externalLayerError = this.getExternalLayerError(error, 'Unable to add the external layer.');
    } finally {
      this.externalLayerLoading = false;
    }
  }

  public resetExternalLayerForm(): void {
    this.externalLayerFormOpened = false;
    this.externalLayerUrl = '';
    this.externalLayerName = '';
    this.externalCatalogLayers = [];
    this.selectedExternalLayerIdentifier = '';
    this.selectedExternalLayerIdentifiers = [];
    this.externalLayerError = '';
    this.pendingServiceLayer = null;
    this.pendingCapabilitiesXml = null;
    this.pendingWfsSource = null;
    this.detectedExternalLayerType = null;
    this.detectedExternalGeoJsonData = null;
    this.detectedExternalCovJsonData = null;
    this.detectedExternalSourceName = '';
  }

  /**
   * Returns true if the layer is compatible with the current CRS.
   * Uses layer-internal check (WMS/WMTS) when available; otherwise falls back to supportsCRS if provided.
   * Triggers an async CRS check on first call for a given CRS.
   */
  public checkLayerCompatibility(layer: MapLayer): boolean {
    const targetCrs = (this.currentCRS ?? 'EPSG:3857').toUpperCase();

    // Fast path: default projection considered OK
    if (targetCrs === 'EPSG:3857') {
      return true;
    }

    // Tile-layer path (WMS or WMTS via duck-typing)
    if (this.isTileCrsCheckCapable(layer)) {
      const rowsForCrs: WmsCrsRow[] =
        layer.crsCompatibilityResults?.filter(r => (r.crs || '').toUpperCase() === targetCrs) ?? [];

      // If we already have results for this CRS, use them
      if (rowsForCrs.length > 0) {
        return rowsForCrs.every(r => r.status === true);
      }

      // Otherwise, trigger the async check once
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      if (!layer.crsCheckReady && typeof layer.checkCrsCompatibility === 'function') {
        layer.crsCheckReady = layer.checkCrsCompatibility(targetCrs)
          .then((rows: WmsCrsRow[]) => {
            // Merge results: keep other CRS rows, add/replace this CRS rows
            const others = (layer.crsCompatibilityResults ?? []).filter(
              r => (r.crs || '').toUpperCase() !== targetCrs
            );
            layer.crsCompatibilityResults = [...others, ...rows];
            // Refresh UI (especially with OnPush)
            this.cdr.markForCheck();
          })
          .catch(() => {
            // Swallow errors; stay optimistic to avoid blocking UI
          });
      }

      // Optimistic until results come back
      return true;
    }

    // Fallback for non tile layers: call supportsCRS if present
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const anyLayer = layer as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (typeof anyLayer.supportsCRS === 'function') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        return !!anyLayer.supportsCRS(targetCrs);
      } catch {
        return true;
      }
    }

    // Default: consider compatible
    return true;
  }

  /**
   * This function changes the order of layers in an array and updates their z-index on a map.
   * @param layers - An array of MapLayer objects representing the layers to be reordered.
   * @param {number} oldIndex - The index of the layer that needs to be moved from its current position.
   * @param {number} newIndex - The index where the moved layer should be placed in the array after it
   * has been moved.
   */
  protected changeOrder(layers: Array<MapLayer>, oldIndex: number, newIndex: number): void {
    if (layers.length > 0 && (oldIndex !== newIndex)) {
      const movedLayer = layers.splice(oldIndex, 1)[0];
      layers.splice(newIndex, 0, movedLayer);

      // order on map and persist order
      this.setZIndex(layers);

    }
  }

  /**
   * Type guard via duck-typing for tile layers (WMS/WMTS) exposing CRS-check fields.
   */
  private isTileCrsCheckCapable(layer: MapLayer): layer is MapLayer & {
    crsCheckReady?: Promise<void>;
    crsCompatibilityResults: WmsCrsRow[];
    checkCrsCompatibility?: (crs: string) => Promise<WmsCrsRow[]>;
  } {
    return !!layer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      && 'crsCompatibilityResults' in (layer as any)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      && Array.isArray((layer as any).crsCompatibilityResults);
  }

  private addDetectedExternalGeoJsonLayer(): void {
    if (this.detectedExternalLayerType === null || this.detectedExternalGeoJsonData === null) {
      throw new Error('Detect the external source before adding it.');
    }
    const isCovJson = this.detectedExternalLayerType === 'covjson';
    const sourceUrl = this.getExternalLayerUrl();
    const name = this.resolveExternalLayerName(this.getExternalJsonSourceName(sourceUrl));
    this.emitExternalGeoJsonLayer(
      this.detectedExternalGeoJsonData,
      name,
      isCovJson ? MapLayer.MARKERTYPE_POINT : this.getGeoJsonMarkerType(this.detectedExternalGeoJsonData),
      isCovJson ? 'covjson' : 'geojson',
      this.detectedExternalCovJsonData,
      { url: sourceUrl.toString(), name, type: isCovJson ? 'covjson' : 'geojson' },
    );
  }

  private async addDetectedExternalWfsLayer(): Promise<void> {
    if (this.pendingWfsSource == null) {
      throw new Error('Detect the WFS source before adding it.');
    }
    const selectedLayer = this.externalCatalogLayers.find(
      layer => layer.identifier === this.selectedExternalLayerIdentifier,
    );
    if (selectedLayer == null) {
      throw new Error('Select a WFS feature type.');
    }

    const url = new URL(this.pendingWfsSource.baseUrl);
    this.pendingWfsSource.parameters.forEach((value, key) => url.searchParams.set(key, value));
    url.searchParams.set('service', 'WFS');
    url.searchParams.set('version', this.pendingWfsSource.version);
    url.searchParams.set('request', 'GetFeature');
    url.searchParams.set(this.pendingWfsSource.version.startsWith('2.') ? 'typeNames' : 'typeName', selectedLayer.identifier);
    url.searchParams.set('outputFormat', selectedLayer.format);

    const data = this.tryParseJson(await this.http.get(url.toString(), { responseType: 'text' }).toPromise() ?? null);
    if (!this.isGeoJsonObject(data)) {
      throw new Error('The WFS GetFeature response is not valid GeoJSON.');
    }
    try {
      L.geoJSON(data);
    } catch {
      throw new Error('The WFS GetFeature response contains invalid GeoJSON geometries.');
    }

    const name = this.resolveExternalLayerName(selectedLayer.title || this.detectedExternalSourceName);
    this.emitExternalGeoJsonLayer(data, name, this.getGeoJsonMarkerType(data), 'wfs', null, {
      url: url.toString(),
      name,
      type: 'wfs',
      layerIdentifier: selectedLayer.identifier,
    });
  }

  private emitExternalGeoJsonLayer(
    data: GeoJsonObject,
    name: string,
    markerType: string,
    type: ExternalVectorLayerType = 'geojson',
    covJsonData: Record<string, unknown> | null = null,
    storageRecord: PersistedExternalLayer | null = null,
    persistStorageRecord = true,
    hidden = false,
  ): void {
    const id = this.createExternalLayerId();
    const color = this.getNextExternalLayerColor();
    const sourceFeatureCollection = this.toFeatureCollection(data);
    const featureCollection: FeatureCollection = {
      ...sourceFeatureCollection,
      features: sourceFeatureCollection.features.map((feature, index) => {
        const featureId = `${id}#${index}#`;
        return {
          ...feature,
          id: featureId,
          properties: {
            ...feature.properties,
            [PopupProperty.PROPERTY_ID]: featureId,
          },
        };
      }),
    };
    const layer = new GeoJsonLayer(id, name);
    layer.setGeoJsonData(featureCollection)
      .setStylingFunction(() => ({
        color: layer.options.customLayerOptionColor.get() ?? color,
        fillColor: layer.options.customLayerOptionFillColor.get() ?? color,
        opacity: layer.options.customLayerOptionOpacity.get() ?? 1,
        fillOpacity: layer.options.customLayerOptionFillColorOpacity.get() ?? 0.2,
        weight: layer.options.customLayerOptionWeight.get() ?? 3,
      }))
      .setPointToLayerFunction((_feature, latlng) => L.circleMarker(latlng, {
        radius: 6,
        color: layer.options.customLayerOptionColor.get() ?? color,
        fillColor: layer.options.customLayerOptionFillColor.get() ?? color,
        fillOpacity: layer.options.customLayerOptionFillColorOpacity.get() ?? 0.8,
        weight: layer.options.customLayerOptionWeight.get() ?? 2,
      }))
      .setFeatureDisplayContentFunc(feature => type === 'covjson'
        ? CovJSONHelper.getPopupContentFromProperties(feature.properties, name, id)
        : GeoJSONHelper.getExternalPopupContentFromProperties(
          feature.properties, name, String(feature.id), id
        ));
    layer.options.customLayerOptionHasMarker.set(true);
    layer.options.customLayerOptionMarkerType.set(markerType);
    layer.options.customLayerOptionColor.set(color);
    layer.options.customLayerOptionFillColor.set(color);
    layer.options.customLayerOptionOpacity.set(1);
    layer.options.customLayerOptionFillColorOpacity.set(0.2);
    layer.options.customLayerOptionWeight.set(3);
    layer.setTooltipFunction(feature => {
      const properties = feature.properties;
      const label = properties?.name ?? properties?.title ?? properties?.id;
      return label == null ? name : String(label);
    });
    layer.setLegendCreatorFunction(() => {
      const symbol = document.createElement('span');
      symbol.dataset.externalLayerLegend = id;
      symbol.style.backgroundColor = layer.options.customLayerOptionFillColor.get() ?? color;
      symbol.style.border = `2px solid ${layer.options.customLayerOptionColor.get() ?? color}`;
      symbol.style.display = 'inline-block';
      symbol.style.height = '12px';
      symbol.style.width = '12px';
      return Promise.resolve([
        new Legend(id, name).addLegendItem(new ElementLegendItem('External GeoJSON', symbol)),
      ]);
    });

    this.externalLayerNames.add(name);
    this.mapInteractionService.setExternalVisualisationSource({
      id,
      name,
      type: type === 'covjson' ? 'covjson' : 'geojson',
      geoJsonData: type !== 'covjson' ? featureCollection : undefined,
      covJsonData: type === 'covjson' ? covJsonData ?? undefined : undefined,
    });
    layer.hidden.set(hidden);
    this.externalLayerAdd.emit(layer);
    if (storageRecord != null) {
      this.registerPersistedExternalLayer(layer.id, storageRecord, persistStorageRecord);
    }
  }

  private addExternalServiceLayer(): void {
    if (this.pendingServiceLayer == null) {
      throw new Error('Detect the external service before adding it.');
    }

    const selected = this.externalCatalogLayers.filter(catalogLayer => {
      return catalogLayer.compatible && this.selectedExternalLayerIdentifiers.includes(catalogLayer.identifier);
    });
    if (selected.length === 0) {
      throw new Error(`No service layers are compatible with ${this.currentCRS}.`);
    }

    const url = this.getExternalLayerUrl();
    selected.forEach(selectedLayer => {
      const name = this.resolveExternalLayerName(selectedLayer.title);
      const layer = new ExternalTileServiceLayer(this.createExternalLayerId(), name, {
        serviceType: this.pendingServiceLayer instanceof WmsTileLayer ? 'wms' : 'wmts',
        url: this.pendingServiceLayer!.url,
        capabilitiesXml: this.pendingCapabilitiesXml!,
        catalogLayers: this.externalCatalogLayers,
        selectedLayerIdentifiers: [selectedLayer.identifier],
        additionalParameters: this.getExternalQueryParameters(url),
      });
      this.externalLayerNames.add(name);
      layer.hidden.set(false);
      this.externalLayerAdd.emit(layer);
      this.registerPersistedExternalLayer(layer.id, {
        url: url.toString(),
        name,
        type: this.pendingServiceLayer instanceof WmsTileLayer ? 'wms' : 'wmts',
        layerIdentifier: selectedLayer.identifier,
      });
    });
  }

  private parseWmsCatalog(xml: JQuery<XMLDocument>): Array<ExternalTileServiceCatalogLayer> {
    const version = xml.find('WMS_Capabilities, WMT_MS_Capabilities').first().attr('version') ?? '1.1.1';
    const formats = xml.find('Request > GetMap > Format').map((_, element) => $(element).text().trim()).get();
    const format = formats.find(value => value.toLowerCase() === 'image/png') ?? formats[0] ?? 'image/png';
    const layers: Array<ExternalTileServiceCatalogLayer> = [];

    xml.find('Layer').each((_, element) => {
      const layerElement = $(element);
      const identifier = layerElement.children('Name').first().text().trim();
      if (!identifier) {
        return;
      }
      const title = layerElement.children('Title').first().text().trim() || identifier;
      const styleElement = layerElement.children('Style').first();
      const style = styleElement.children('Name').first().text().trim();
      const legendUrl = styleElement.find('LegendURL OnlineResource').first().attr('xlink:href')
        ?? styleElement.find('LegendURL OnlineResource').first().attr('href') ?? '';
      const supportedCrs = this.getInheritedWmsCrs(element);
      layers.push({
        identifier,
        title,
        style,
        format,
        legendUrl,
        supportedCrsList: supportedCrs,
        compatible: supportedCrs.length === 0 || supportedCrs.includes(this.normalizeCrs(this.currentCRS)),
        version,
      });
    });

    return layers;
  }

  private parseWmtsCatalog(xml: JQuery<XMLDocument>): Array<ExternalTileServiceCatalogLayer> {
    const matrixSets = new Map<string, string>();
    xml.find('TileMatrixSet').each((_, element) => {
      const supportedCrs = this.getDirectChildText(element, 'SupportedCRS');
      const identifier = this.getDirectChildText(element, 'Identifier');
      if (identifier && supportedCrs) {
        matrixSets.set(identifier, this.normalizeCrs(supportedCrs));
      }
    });

    const layers: Array<ExternalTileServiceCatalogLayer> = [];
    xml.find('Layer').each((_, element) => {
      const layerElement = $(element);
      const identifier = this.getDirectChildText(element, 'Identifier');
      const tileJson = layerElement.find('ResourceURL[resourceType="TileJSON"]').first();
      if (!identifier || tileJson.length === 0) {
        return;
      }

      const matrixSetLinks = layerElement.find('TileMatrixSetLink').map((linkIndex, link) => {
        return this.getDirectChildText(link, 'TileMatrixSet');
      }).get().filter(Boolean);
      const currentCrs = this.normalizeCrs(this.currentCRS);
      const matrixSet = matrixSetLinks.find(value => matrixSets.get(value) === currentCrs) ?? '';
      const styles = layerElement.children('Style');
      const defaultStyle = styles.filter('[isDefault="true"]').first();
      const styleElement = defaultStyle.length > 0 ? defaultStyle : styles.first();
      const style = styleElement.children().filter((styleIndex, child) => child.localName === 'Identifier').first().text().trim();
      const legendUrl = styleElement.find('LegendURL').first().attr('xlink:href') ?? '';
      const formats = layerElement.children().filter((formatIndex, child) => child.localName === 'Format')
        .map((formatIndex, child) => $(child).text().trim()).get();
      const format = formats.find(value => value.toLowerCase() === 'image/png') ?? formats[0] ?? 'image/png';

      layers.push({
        identifier,
        title: this.getDirectChildText(element, 'Title') || identifier,
        style,
        format,
        matrixSet,
        supportedCrs: matrixSets.get(matrixSet),
        legendUrl,
        compatible: matrixSet !== '',
      });
    });

    return layers;
  }

  private parseWfsCatalog(xml: JQuery<XMLDocument>): Array<ExternalTileServiceCatalogLayer> {
    const getFeatureFormats = this.getWfsGetFeatureFormats(xml);
    const layers: Array<ExternalTileServiceCatalogLayer> = [];

    xml.find('FeatureType').each((_, element) => {
      const featureType = $(element);
      const identifier = featureType.children('Name').first().text().trim();
      if (!identifier) {
        return;
      }
      const formats = featureType.find('OutputFormats > Format')
        .map((formatIndex, formatElement) => $(formatElement).text().trim()).get();
      const format = [...formats, ...getFeatureFormats].find(value => this.isGeoJsonFormat(value));
      if (!format) {
        return;
      }
      layers.push({
        identifier,
        title: featureType.children('Title').first().text().trim() || identifier,
        style: '',
        format,
        compatible: true,
      });
    });

    return layers;
  }

  private getWfsGetFeatureFormats(xml: JQuery<XMLDocument>): Array<string> {
    const formats = xml.find('Operation[name="GetFeature"] Parameter[name="outputFormat"] Value')
      .map((_, element) => $(element).text().trim()).get();
    xml.find('Request > GetFeature > ResultFormat').children().each((_, element) => {
      formats.push(element.localName);
    });
    return formats;
  }

  private isGeoJsonFormat(format: string): boolean {
    return ['application/geo+json', 'application/json', 'application/vnd.geo+json', 'geojson', 'json']
      .includes(format.trim().toLowerCase());
  }

  private getInheritedWmsCrs(element: Element): Array<string> {
    const values = new Set<string>();
    let current: Element | null = element;
    while (current != null && current.localName === 'Layer') {
      $(current).children('CRS, SRS').each((_, crsElement) => {
        $(crsElement).text().split(/\s+/).filter(Boolean).forEach(value => values.add(this.normalizeCrs(value)));
      });
      current = current.parentElement;
    }
    return Array.from(values);
  }

  private getDirectChildText(element: Element, localName: string): string {
    return $(element).children().filter((_, child) => child.localName === localName).first().text().trim();
  }

  private normalizeCrs(crs: string): string {
    const epsg = crs.match(/EPSG(?::|\/|::)+(\d+)$/i);
    return epsg ? `EPSG:${epsg[1]}` : crs.trim().toUpperCase();
  }

  private getExternalLayerUrl(): URL {
    let url: URL;
    try {
      url = new URL(this.externalLayerUrl.trim());
    } catch {
      throw new Error('Enter a valid absolute URL.');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Only HTTP and HTTPS URLs are supported.');
    }
    return url;
  }

  private getBaseUrl(url: URL): string {
    const baseUrl = new URL(url.toString());
    baseUrl.search = '';
    baseUrl.hash = '';
    return baseUrl.toString();
  }

  private getCapabilitiesParameters(url: URL): Map<string, string> {
    const parameters = new Map<string, string>();
    url.searchParams.forEach((value, key) => {
      if (!['service', 'request', 'layers', 'layer', 'styles', 'style', 'format', 'transparent',
        'crs', 'srs', 'bbox', 'width', 'height'].includes(key.toLowerCase())) {
        parameters.set(key, value);
      }
    });
    return parameters;
  }

  private async getExternalSourceResponse(url: URL): Promise<string | null> {
    try {
      return await this.http.get(url.toString(), { responseType: 'text' }).toPromise() ?? null;
    } catch {
      return null;
    }
  }

  private tryParseJson(response: string | null): unknown {
    if (response == null) {
      return null;
    }
    try {
      return JSON.parse(response) as unknown;
    } catch {
      return null;
    }
  }

  private detectExternalJsonSource(data: unknown): void {
    if (this.isGeoJsonObject(data)) {
      try {
        L.geoJSON(data);
      } catch {
        throw new Error('The response contains invalid GeoJSON geometries.');
      }
      this.detectedExternalLayerType = 'geojson';
      this.detectedExternalGeoJsonData = data;
      return;
    }
    if (this.isRecord(data) && (data.type === 'Coverage' || data.type === 'CoverageCollection')) {
      this.detectedExternalLayerType = 'covjson';
      this.detectedExternalCovJsonData = data;
      this.detectedExternalGeoJsonData = this.convertCovJsonToGeoJson(data);
      return;
    }
    throw new Error('The JSON response is neither GeoJSON nor CovJSON.');
  }

  private async detectExternalServiceSource(url: URL, service?: 'wms' | 'wmts' | 'wfs'): Promise<void> {
    const additionalParams = this.getCapabilitiesParameters(url);
    const baseUrl = this.getBaseUrl(url);
    let lastError: unknown = null;

    if (service !== 'wms' && service !== 'wmts') {
      try {
        const xml = await this.getWfsCapabilitiesXml(baseUrl, additionalParams);
        if (this.isWfsCapabilities(xml)) {
          this.detectedExternalLayerType = 'wfs';
          this.detectedExternalSourceName = xml.find('ServiceIdentification').first().children()
            .filter((_, element) => element.localName === 'Title').first().text().trim()
            || xml.find('Service > Title').first().text().trim();
          this.externalCatalogLayers = this.parseWfsCatalog(xml);
          this.pendingWfsSource = {
            baseUrl,
            parameters: additionalParams,
            version: xml.find('WFS_Capabilities').first().attr('version') ?? '1.0.0',
          };
          if (this.externalCatalogLayers.length === 0) {
            throw new Error('No WFS feature types supporting GeoJSON were found.');
          }
          return;
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (service !== 'wmts' && service !== 'wfs') {
      try {
        const layer = new WmsTileLayer(this.createExternalLayerId()).setUrl(baseUrl);
        const xml = await layer.refreshGetCapabilitiesXml(this.http, additionalParams);
        if (this.isWmsCapabilities(xml)) {
          this.detectedExternalLayerType = 'wms';
          this.detectedExternalSourceName = xml.find('Service > Title').first().text().trim();
          this.externalCatalogLayers = this.parseWmsCatalog(xml);
          this.pendingServiceLayer = layer;
          this.pendingCapabilitiesXml = xml;
          if (this.externalCatalogLayers.length === 0) {
            throw new Error('No named layers were found in WMS GetCapabilities.');
          }
          return;
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (service !== 'wms' && service !== 'wfs') {
      try {
        const layer = new WmtsTileLayer(this.createExternalLayerId()).setUrl(baseUrl);
        const xml = await layer.refreshGetCapabilitiesXml(this.http, additionalParams);
        if (this.isWmtsCapabilities(xml)) {
          this.detectedExternalLayerType = 'wmts';
          this.detectedExternalSourceName = xml.find('ServiceIdentification').first().children()
            .filter((_, element) => element.localName === 'Title').first().text().trim();
          this.externalCatalogLayers = this.parseWmtsCatalog(xml);
          this.pendingServiceLayer = layer;
          this.pendingCapabilitiesXml = xml;
          if (this.externalCatalogLayers.length === 0) {
            throw new Error('No compatible WMTS layers with a TileJSON resource were found.');
          }
          return;
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError != null) {
      throw lastError;
    }
    throw new Error('The response is not a GeoJSON, CovJSON, WMS, WMTS or GeoJSON-enabled WFS source.');
  }

  private getExternalServiceType(url: URL): 'wms' | 'wmts' | 'wfs' | null {
    switch (url.searchParams.get('service')?.toLowerCase()) {
      case 'wms':
        return 'wms';
      case 'wmts':
        return 'wmts';
      case 'wfs':
        return 'wfs';
      default:
        return null;
    }
  }

  private isWmsCapabilities(xml: JQuery<XMLDocument>): boolean {
    return xml.find('WMS_Capabilities, WMT_MS_Capabilities').length > 0;
  }

  private isWmtsCapabilities(xml: JQuery<XMLDocument>): boolean {
    return xml.find('Contents').first().find('Layer').length > 0;
  }

  private async getWfsCapabilitiesXml(baseUrl: string, parameters: Map<string, string>): Promise<JQuery<XMLDocument>> {
    const url = new URL(baseUrl);
    parameters.forEach((value, key) => url.searchParams.set(key, value));
    url.searchParams.set('service', 'WFS');
    url.searchParams.set('request', 'GetCapabilities');
    const response = await this.http.get(url.toString(), { responseType: 'text' }).toPromise();
    if (response == null) {
      throw new Error('The WFS GetCapabilities response is empty.');
    }
    return $($.parseXML(response)) as JQuery<XMLDocument>;
  }

  private isWfsCapabilities(xml: JQuery<XMLDocument>): boolean {
    return xml.find('WFS_Capabilities').length > 0;
  }

  private getExternalQueryParameters(url: URL): Record<string, string> {
    const ignored = ['service', 'request', 'layers', 'layer', 'styles', 'style', 'format', 'transparent',
      'crs', 'srs', 'bbox', 'width', 'height'];
    const parameters: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      if (!ignored.includes(key.toLowerCase())) {
        parameters[key] = value;
      }
    });
    return parameters;
  }

  private registerPersistedExternalLayer(
    layerId: string,
    storageRecord: PersistedExternalLayer,
    persistStorageRecord = true,
  ): void {
    this.externalLayerStorageRecords.set(layerId, storageRecord);
    if (persistStorageRecord) {
      const storage = this.getExternalLayersStorage();
      storage.layers.push(storageRecord);
      this.setExternalLayersStorage(storage);
    }
  }

  private removePersistedExternalLayer(layerId: string): void {
    const storageRecord = this.externalLayerStorageRecords.get(layerId);
    this.externalLayerStorageRecords.delete(layerId);
    if (storageRecord == null) {
      return;
    }
    const storage = this.getExternalLayersStorage();
    const index = storage.layers.findIndex(layer => this.arePersistedExternalLayersEqual(layer, storageRecord));
    if (index !== -1) {
      storage.layers.splice(index, 1);
      this.setExternalLayersStorage(storage);
    }
  }

  private async restoreExternalLayers(): Promise<void> {
    let failedLayers = 0;
    for (const storageRecord of this.getExternalLayersStorage().layers) {
      try {
        await this.restoreExternalLayer(storageRecord);
      } catch (error) {
        failedLayers++;
        console.warn('Unable to restore an external layer from browser storage.', error);
      }
    }
    if (failedLayers > 0) {
      this.notificationService.sendNotification(
        'Some external layers could not be restored from their source URL.',
        'x',
        NotificationService.TYPE_WARNING,
        5000,
      );
    }
  }

  private async restoreExternalLayer(storageRecord: PersistedExternalLayer): Promise<void> {
    if (storageRecord.type === 'wms' || storageRecord.type === 'wmts') {
      await this.restoreExternalTileServiceLayer(storageRecord);
      return;
    }

    const data = this.tryParseJson(await this.getExternalSourceResponse(new URL(storageRecord.url)));
    if (storageRecord.type === 'covjson') {
      if (!this.isRecord(data) || (data.type !== 'Coverage' && data.type !== 'CoverageCollection')) {
        throw new Error('The saved CovJSON source no longer returns CovJSON.');
      }
      const geoJsonData = this.convertCovJsonToGeoJson(data);
      this.emitExternalGeoJsonLayer(
        geoJsonData,
        storageRecord.name,
        MapLayer.MARKERTYPE_POINT,
        'covjson',
        data,
        storageRecord,
        false,
        true,
      );
      return;
    }

    if (!this.isGeoJsonObject(data)) {
      throw new Error('The saved source no longer returns GeoJSON.');
    }
    L.geoJSON(data);
    this.emitExternalGeoJsonLayer(
      data,
      storageRecord.name,
      this.getGeoJsonMarkerType(data),
      storageRecord.type === 'wfs' ? 'wfs' : 'geojson',
      null,
      storageRecord,
      false,
      true,
    );
  }

  private async restoreExternalTileServiceLayer(storageRecord: PersistedExternalLayer): Promise<void> {
    if ((storageRecord.type !== 'wms' && storageRecord.type !== 'wmts')
      || storageRecord.layerIdentifier == null) {
      throw new Error('The saved tile service does not include a layer identifier.');
    }
    const sourceUrl = new URL(storageRecord.url);
    const baseUrl = this.getBaseUrl(sourceUrl);
    const capabilitiesParameters = this.getCapabilitiesParameters(sourceUrl);
    const serviceLayer = storageRecord.type === 'wms'
      ? new WmsTileLayer(this.createExternalLayerId()).setUrl(baseUrl)
      : new WmtsTileLayer(this.createExternalLayerId()).setUrl(baseUrl);
    const capabilitiesXml = await serviceLayer.refreshGetCapabilitiesXml(this.http, capabilitiesParameters);
    const catalogLayers = storageRecord.type === 'wms'
      ? this.parseWmsCatalog(capabilitiesXml)
      : this.parseWmtsCatalog(capabilitiesXml);
    if ((storageRecord.type === 'wms' && !this.isWmsCapabilities(capabilitiesXml))
      || (storageRecord.type === 'wmts' && !this.isWmtsCapabilities(capabilitiesXml))) {
      throw new Error('The saved source no longer returns the expected capabilities.');
    }
    if (!catalogLayers.some(catalogLayer =>
      catalogLayer.identifier === storageRecord.layerIdentifier && catalogLayer.compatible
    )) {
      throw new Error('The saved sublayer is no longer available for the current CRS.');
    }
    const layer = new ExternalTileServiceLayer(this.createExternalLayerId(), storageRecord.name, {
      serviceType: storageRecord.type,
      url: baseUrl,
      capabilitiesXml,
      catalogLayers,
      selectedLayerIdentifiers: [storageRecord.layerIdentifier],
      additionalParameters: this.getExternalQueryParameters(sourceUrl),
    });
    this.externalLayerNames.add(layer.name);
    layer.hidden.set(true);
    this.externalLayerAdd.emit(layer);
    this.registerPersistedExternalLayer(layer.id, storageRecord, false);
  }

  private getExternalLayersStorage(): ExternalLayersStorageV2 {
    const persistedValue = this.localStoragePersister.getValue(
      LocalStorageVariables.LS_EXTERNAL_LAYERS,
    ) as string | null;
    if (!persistedValue) {
      return { version: 2, layers: [] };
    }
    try {
      const parsed = JSON.parse(persistedValue) as unknown;
      if (!this.isRecord(parsed) || parsed.version !== 2 || !Array.isArray(parsed.layers)) {
        return { version: 2, layers: [] };
      }
      return {
        version: 2,
        layers: (parsed.layers as Array<unknown>).filter(
          (layer): layer is PersistedExternalLayer => this.isPersistedExternalLayer(layer)
        ),
      };
    } catch (error) {
      console.warn('Unable to read external layers from browser storage.', error);
      return { version: 2, layers: [] };
    }
  }

  private setExternalLayersStorage(storage: ExternalLayersStorageV2): void {
    try {
      this.localStoragePersister.set(
        LocalStorageVariables.LS_EXTERNAL_LAYERS,
        JSON.stringify(storage),
      );
      this.externalLayerStorageWarningShown = false;
    } catch (error) {
      this.handleExternalLayerStorageError(error);
    }
  }

  private handleExternalLayerStorageError(error: unknown): void {
    console.warn('Unable to persist external layers in browser storage.', error);
    if (!this.externalLayerStorageWarningShown) {
      this.externalLayerStorageWarningShown = true;
      this.notificationService.sendNotification(
        'External layer changes could not be saved in browser storage.',
        'x',
        NotificationService.TYPE_WARNING,
        5000,
      );
    }
  }

  private isPersistedExternalLayer(value: unknown): value is PersistedExternalLayer {
    if (!this.isRecord(value)
      || typeof value.name !== 'string'
      || typeof value.url !== 'string'
      || !['geojson', 'covjson', 'wfs', 'wms', 'wmts'].includes(value.type as string)) {
      return false;
    }
    return value.layerIdentifier === undefined || typeof value.layerIdentifier === 'string';
  }

  private arePersistedExternalLayersEqual(
    first: PersistedExternalLayer,
    second: PersistedExternalLayer,
  ): boolean {
    return first.url === second.url
      && first.name === second.name
      && first.type === second.type
      && first.layerIdentifier === second.layerIdentifier;
  }

  private getExternalJsonSourceName(url: URL): string {
    const filename = url.pathname.split('/').filter(Boolean).pop();
    if (!filename) {
      return '';
    }
    try {
      return decodeURIComponent(filename).replace(/\.(?:geojson|covjson|json)$/i, '').trim();
    } catch {
      return filename.replace(/\.(?:geojson|covjson|json)$/i, '').trim();
    }
  }

  private resolveExternalLayerName(automaticName: string): string {
    const explicitName = this.externalLayerName.trim();
    const usedNames = new Set<string>([
      ...this.externalLayerNames,
      ...this.orderedLayers.filter(layer => layer.id.startsWith('external-layer-')).map(layer => layer.name),
    ]);
    const baseName = explicitName || automaticName.trim();
    if (!baseName) {
      let fallbackIndex = 1;
      while (usedNames.has(`external service ${fallbackIndex}`)) {
        fallbackIndex++;
      }
      return `external service ${fallbackIndex}`;
    }
    if (!usedNames.has(baseName)) {
      return baseName;
    }

    let suffix = 2;
    while (usedNames.has(`${baseName} (${suffix})`)) {
      suffix++;
    }
    return `${baseName} (${suffix})`;
  }

  private getNextExternalLayerColor(): string {
    const palette = LayerControlComponent.EXTERNAL_LAYER_COLORS;
    const color = palette[this.externalVectorLayerColorIndex % palette.length];
    this.externalVectorLayerColorIndex++;
    return color;
  }

  private createExternalLayerId(): string {
    const uniqueId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `external-layer-${uniqueId}`;
  }

  private isGeoJsonObject(data: unknown): data is GeoJsonObject {
    if (!this.isRecord(data) || typeof data.type !== 'string') {
      return false;
    }
    return ['Feature', 'FeatureCollection', 'Point', 'MultiPoint', 'LineString', 'MultiLineString',
      'Polygon', 'MultiPolygon', 'GeometryCollection'].includes(data.type);
  }

  private toFeatureCollection(data: GeoJsonObject): FeatureCollection {
    if (data.type === 'FeatureCollection') {
      return data as FeatureCollection;
    }
    if (data.type === 'Feature') {
      return { type: 'FeatureCollection', features: [data as Feature] };
    }
    return {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: data as GeometryObject, properties: {} }],
    };
  }

  private getGeoJsonMarkerType(data: GeoJsonObject): string {
    const geoJsonData = data as unknown as {
      type: string;
      geometry?: { type?: string } | null;
      features?: Array<{ geometry?: { type?: string } | null }>;
    };
    const geometryType = geoJsonData.type === 'Feature'
      ? geoJsonData.geometry?.type
      : geoJsonData.type === 'FeatureCollection'
        ? geoJsonData.features?.find(feature => feature.geometry != null)?.geometry?.type
        : geoJsonData.type;

    switch (geometryType) {
      case 'Point':
      case 'MultiPoint':
        return MapLayer.MARKERTYPE_POINT;
      case 'LineString':
      case 'MultiLineString':
        return MapLayer.MARKERTYPE_LINE;
      default:
        return MapLayer.MARKERTYPE_POLYGON;
    }
  }

  private convertCovJsonToGeoJson(data: unknown): GeoJsonObject {
    if (!this.isRecord(data) || (data.type !== 'Coverage' && data.type !== 'CoverageCollection')) {
      throw new Error('The response is not a valid CovJSON Coverage or CoverageCollection.');
    }

    const coverages = data.type === 'CoverageCollection'
      ? Array.isArray(data.coverages) ? data.coverages : []
      : [data];
    const features = coverages
      .map((coverage, index) => this.createCovJsonPoint(coverage, index))
      .filter((feature): feature is Feature<Point> => feature != null);

    if (features.length === 0) {
      throw new Error('The CovJSON response does not contain valid x/y coordinates.');
    }

    return {
      type: 'FeatureCollection',
      features,
    } as unknown as GeoJsonObject;
  }

  private createCovJsonPoint(coverage: unknown, index: number): Feature<Point> | null {
    if (!this.isRecord(coverage)
      || !this.isRecord(coverage.domain)
      || !this.isRecord(coverage.domain.axes)
      || !this.isRecord(coverage.domain.axes.x)
      || !this.isRecord(coverage.domain.axes.y)
      || !Array.isArray(coverage.domain.axes.x.values)
      || !Array.isArray(coverage.domain.axes.y.values)) {
      return null;
    }

    const longitude = Number(coverage.domain.axes.x.values[0]);
    const latitude = Number(coverage.domain.axes.y.values[0]);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return null;
    }

    const title = typeof coverage.title === 'string'
      ? coverage.title
      : typeof coverage.id === 'string' ? coverage.id : `Coverage ${index + 1}`;
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [longitude, latitude] },
      properties: { name: title, Latitude: String(latitude), Longitude: String(longitude) },
    };
  }

  private isRecord(data: unknown): data is Record<string, unknown> {
    return data != null && typeof data === 'object' && !Array.isArray(data);
  }

  private getExternalLayerError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return error.status === 0
        ? 'The remote server could not be reached or does not allow cross-origin requests (CORS).'
        : `${fallback} HTTP ${error.status}.`;
    }
    return error instanceof Error && error.message ? error.message : fallback;
  }

  /**
   * The function orders map layers based on their visibility and sets their z-index.
   * @param layersArray - An array of MapLayer objects that need to be ordered.
   */
  private orderLayers(layersArray: Array<MapLayer>): void {
    const visibleLayers = this.checkVisible(layersArray);

    this.orderedLayers = visibleLayers.filter(
      (layer: MapLayer) => layer.options.pane.get() !== 'arcticOverlays'
    );

    this.arcticOverlays = visibleLayers.filter(
      (layer: MapLayer) => layer.options.pane.get() === 'arcticOverlays'
    );
  }

  /**
   * The function `checkVisible` filters an array of `MapLayer` objects based on their visibility and
   * other conditions, and returns the filtered array.
   * @param layers - An array of MapLayer objects.
   * @returns an array of MapLayer objects that meet certain conditions.
   */
  private checkVisible(layers: Array<MapLayer>) {

    const layersImageOverlayExtra: Array<string> = [];

    const layersChecked = layers.filter((layer: MapLayer) => {

      if (layer.options.customLayerOptionPaneType.get() === 'geoJsonPane' &&
        !layer.options.customLayerOptionHasMarker.get() ||
        layer.options.pane.get() === 'tilePane') {
        return false;
      }

      // if layer is imageOverlay
      if (layer.options.customLayerOptionPaneType.get() === MapLayer.IMAGE_OVERLAY_LAYER_TYPE) {
        // add realId of layerImageOverlay to remove from list layers
        layersImageOverlayExtra.push((layer as GeoJSONImageOverlayMapLayer).getRealId());
      }

      return layer.visibleOnLayerControl.get() && layer.addedToMap.get();

    });

    return layersChecked.filter((layer: MapLayer) => {
      // remove extra imageOverlay layer
      return !layersImageOverlayExtra.includes(layer.id);
    });
  }

  /**
   * This function sets the z-index of map layers in reverse order and updates the layer's custom option
   * value.
   * @param layers - An array of MapLayer objects.
   */
  private setZIndex(layers: Array<MapLayer>): void {
    const layersOrder = this.layersService.getLayersOrderStorage();
    layers.slice().reverse().forEach((layer: MapLayer, index) => {

      if (layer !== null) {
        ++index;
        const pane = this._map.getPane(layer.id);
        if (pane !== undefined && pane !== null) {

          const zIndex = (index + Number(Style.ZINDEX_TOP)).toString();

          pane!.style.zIndex = zIndex;

          // persist zIndex value
          this.layersService.setLayerOrder(layer.id, zIndex, layersOrder);
          layer.options.customLayerOptionZIndex.set(zIndex);
          this.layersService.layerChange(layer);

        }
      }
    });
  }

}
