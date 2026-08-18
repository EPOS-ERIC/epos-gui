import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { Legend, ImageLegendItem } from '../controls/public_api';
import { FeatureDisplayItem } from '../featureDisplay/featureDisplayItem';
import { MapLayer } from './mapLayer.abstract';
import { WmsTileLayer } from './wmsTileLayer';
import { WMTSParameter, WmtsTileLayer } from './wmtsTileLayer';

export type ExternalTileServiceType = 'wms' | 'wmts';

export type ExternalTileServiceCatalogLayer = {
  identifier: string;
  title: string;
  style: string;
  format: string;
  matrixSet?: string;
  supportedCrs?: string;
  supportedCrsList?: Array<string>;
  legendUrl?: string;
  compatible: boolean;
  version?: string;
};

type ExternalTileServiceLayerConfig = {
  serviceType: ExternalTileServiceType;
  url: string;
  capabilitiesXml: JQuery<XMLDocument>;
  catalogLayers: Array<ExternalTileServiceCatalogLayer>;
  selectedLayerIdentifiers: Array<string>;
  additionalParameters: Record<string, string>;
};

type ExternalTileLayer = WmsTileLayer | WmtsTileLayer;

export class ExternalTileServiceLayer extends MapLayer {
  public crsCheckReady?: Promise<void>;
  public crsCompatibilityResults: Array<{ layerName: string; crs: string; status: boolean }> = [];
  public checkCrsCompatibility?: (crs: string) => Promise<Array<{ layerName: string; crs: string; status: boolean }>>;

  private readonly serviceType: ExternalTileServiceType;
  private readonly url: string;
  private readonly capabilitiesXml: JQuery<XMLDocument>;
  private readonly catalogLayers: Array<ExternalTileServiceCatalogLayer>;
  private readonly additionalParameters: Record<string, string>;
  private selectedLayerIdentifiers: Array<string>;
  private activeLayers: Array<ExternalTileLayer> = [];

  public constructor(id: string, name: string, config: ExternalTileServiceLayerConfig) {
    super(id, name);
    this.serviceType = config.serviceType;
    this.url = config.url;
    this.capabilitiesXml = config.capabilitiesXml;
    this.catalogLayers = config.catalogLayers.filter(layer => layer.compatible);
    this.additionalParameters = config.additionalParameters;
    this.setSelectedLayerIdentifiers(config.selectedLayerIdentifiers);
    this.options.setOptions({ pane: id });
    this.options.customLayerOptionMarkerType.set(null);
    this.checkCrsCompatibility = (crs: string) => Promise.resolve(
      this.getSelectedCatalogLayers().map(layer => ({
        layerName: layer.identifier,
        crs,
        status: this.isLayerCompatibleWithCrs(layer, crs),
      })),
    );
    this.setLegendCreatorFunction((_layer, http) => this.getActiveLegends(http));
  }

  public getCompatibleCatalogLayers(): Array<ExternalTileServiceCatalogLayer> {
    return this.catalogLayers;
  }

  public getSelectedLayerIdentifiers(): Array<string> {
    return [...this.selectedLayerIdentifiers];
  }

  public setSelectedLayerIdentifiers(identifiers: Array<string>): this {
    const selected = new Set(identifiers);
    this.selectedLayerIdentifiers = this.catalogLayers
      .filter(layer => selected.has(layer.identifier))
      .map(layer => layer.identifier);
    this.crsCheckReady = undefined;
    this.crsCompatibilityResults = [];
    return this;
  }

  public getLayerClickFeatureItem(
    clickEvent: L.LeafletMouseEvent,
    http: HttpClient,
  ): Promise<Array<FeatureDisplayItem>> {
    return Promise.all(
      this.activeLayers.map(layer => layer.getLayerClickFeatureItem(clickEvent, http).catch(() => [])),
    ).then(featureItems => new Array<FeatureDisplayItem>().concat(...featureItems));
  }

  protected getLeafletLayer(http: HttpClient): Promise<null | L.Layer> {
    this.activeLayers = this.getSelectedCatalogLayers().map((catalogLayer, index) =>
      this.createTileLayer(catalogLayer, index),
    );
    return Promise.all(this.activeLayers.map(layer => layer.toLeafletLayer(http)))
      .then(layers => new L.LayerGroup(layers));
  }

  protected updateLeafletLayerOpacity(): void {
    const opacity = this.options.customLayerOptionOpacity.get();
    if (this.leafletMapLayer instanceof L.LayerGroup && opacity != null) {
      this.leafletMapLayer.eachLayer(layer => {
        const opacityLayer = layer as L.Layer & { setOpacity?: (value: number) => L.Layer };
        opacityLayer.setOpacity?.(opacity);
      });
    }
  }

  private getSelectedCatalogLayers(): Array<ExternalTileServiceCatalogLayer> {
    const selected = new Set(this.selectedLayerIdentifiers);
    return this.catalogLayers.filter(layer => selected.has(layer.identifier));
  }

  private createTileLayer(catalogLayer: ExternalTileServiceCatalogLayer, index: number): ExternalTileLayer {
    const id = `${this.id}-${this.serviceType}-${index}`;
    const layer = this.serviceType === 'wms'
      ? new WmsTileLayer(id, catalogLayer.title).setUrl(this.url)
      : new WmtsTileLayer(id, catalogLayer.title).setUrl(this.url);

    layer.setGetCapabilitiesXml(this.capabilitiesXml);
    layer.setEposLeaflet(this.getEposLeaflet());
    Object.entries(this.additionalParameters).forEach(([key, value]) => layer.options.set(key, value));

    if (layer instanceof WmsTileLayer) {
      layer.options.setOptions({
        layers: catalogLayer.identifier,
        styles: catalogLayer.style,
        format: catalogLayer.format,
        version: catalogLayer.version,
        transparent: true,
        pane: this.id,
      });
    } else {
      layer.options.setOptions({
        [WMTSParameter.LAYER]: catalogLayer.identifier,
        [WMTSParameter.STYLE]: catalogLayer.style,
        [WMTSParameter.FORMAT]: catalogLayer.format,
        [WMTSParameter.TILEMATRIXSET]: catalogLayer.matrixSet,
        pane: this.id,
      });
    }
    layer.options.customLayerOptionOpacity.set(this.options.customLayerOptionOpacity.get());
    layer.setFeatureIdentifiable();

    if (catalogLayer.legendUrl) {
      layer.setLegendCreatorFunction(() => Promise.resolve([
        new Legend(layer.id, catalogLayer.title).setLegendItems([
          new ImageLegendItem(catalogLayer.title, catalogLayer.legendUrl!, layer.id),
        ]),
      ]));
    }
    return layer;
  }

  private getActiveLegends(http: HttpClient): Promise<null | Array<Legend>> {
    return Promise.all(this.activeLayers.map(layer => layer.getLegendData(http)))
      .then(legendArrays => {
        const legends = legendArrays
          .filter((legendArray): legendArray is Array<Legend> => legendArray != null)
          .reduce((result, legendArray) => result.concat(legendArray), new Array<Legend>());
        return legends.length > 0 ? legends : null;
      });
  }

  private isLayerCompatibleWithCrs(layer: ExternalTileServiceCatalogLayer, crs: string): boolean {
    const normalizedCrs = crs.toUpperCase();
    return this.serviceType === 'wms'
      ? layer.supportedCrsList?.length === 0 || layer.supportedCrsList?.includes(normalizedCrs) === true
      : layer.supportedCrs === normalizedCrs;
  }
}
