import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSliderChange } from '@angular/material/slider';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { EposLeafletComponent } from '../../eposLeaflet.component';
import { WmsTileLayer } from '../../layers/wmsTileLayer';
import { WmsFeatureDisplayItemGenerator, WmsFeatureFormat } from '../../layers/wmsFeatureDisplayItemGenerator';
import { euroGeographicsMapOptions, EuroGeographicsMapOption } from '../../controls/basemapSelectorControl/euroGeographicsMapOptions';
import { LayersService } from 'utility/eposLeaflet/services/layers.service';
import { baseLayerOptions } from '../../controls/baseLayerControl/baseLayerOptions';
import { Style } from 'utility/styler/style';

@Component({
  selector: 'app-basemap-selector-options',
  templateUrl: './basemapSelectorOptions.component.html',
  styleUrls: ['./basemapSelectorOptions.component.scss']
})
export class BasemapSelectorOptionsComponent implements OnChanges {

  private static readonly BASE_ZINDEX = Number(Style.ZINDEX_TOP);

  @Input() crsCode = 'EPSG:3857';
  @Input() eposLeaflet!: EposLeafletComponent;

  public options: EuroGeographicsMapOption[] = euroGeographicsMapOptions;
  public opacityByOptionId = new Map<string, number>();
  public selectedOriginalBasemapVal = '';
  public basemapToggled = true;

  constructor(private readonly layersService: LayersService) { }

  public ngOnChanges(changes: SimpleChanges): void {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    if (changes['crsCode']) {
      this.applyOriginalBasemapState();
      this.syncSelectionFromMap();
    }
  }

  public selectedOriginalBasemap(selectedBaseLayer: string): void {
    this.selectedOriginalBasemapVal = selectedBaseLayer;
    this.basemapToggled = selectedBaseLayer !== 'None';
  }

  public updateOriginalBasemapEnable(event: MatSlideToggleChange): void {
    if (event.checked) {
      this.layersService.baseLayerChange(this.layersService.lastActiveBaseLayer, this.crsCode);
      this.selectedOriginalBasemap(this.layersService.lastActiveBaseLayer.name);
    } else {
      const noneLayer = baseLayerOptions.find(b => b.name === 'None');
      if (noneLayer != null) {
        this.layersService.baseLayerChange(noneLayer, this.crsCode);
      }
      this.selectedOriginalBasemap('None');
    }
  }

  public isSelected(option: EuroGeographicsMapOption): boolean {
    if (!this.eposLeaflet) {
      return false;
    }
    return this.eposLeaflet.getLayers().some(layer => layer.id === this.getLayerId(option));
  }

  public isCrsSupported(option: EuroGeographicsMapOption): boolean {
    return option.supportedCRS.includes(this.crsCode);
  }

  public updateSelection(event: MatCheckboxChange, option: EuroGeographicsMapOption): void {
    if (!this.eposLeaflet || !this.isCrsSupported(option)) {
      return;
    }

    if (event.checked) {
      this.addLayer(option);
    } else {
      this.removeLayer(option);
    }
  }

  public updateOpacity(event: MatSliderChange, option: EuroGeographicsMapOption): void {
    const opacity = event.value ?? 1;
    this.opacityByOptionId.set(option.id, opacity);

    const layer = this.getLayer(option);
    if (layer != null) {
      layer.options.customLayerOptionOpacity.set(opacity);
    }
  }

  public getOpacity(option: EuroGeographicsMapOption): number {
    return this.opacityByOptionId.get(option.id) ?? 1;
  }

  public dropEuroGeographicsOptions(event: CdkDragDrop<EuroGeographicsMapOption[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    moveItemInArray(this.options, event.previousIndex, event.currentIndex);
    this.applyEuroGeographicsOrder();
  }

  private syncSelectionFromMap(): void {
    if (!this.eposLeaflet) {
      return;
    }

    if (!this.options.some(option => this.isCrsSupported(option))) {
      this.options.forEach(option => this.removeLayer(option));
    }
  }

  private applyOriginalBasemapState(): void {
    const basemap = this.layersService.getBaseLayerFromStorage(this.crsCode);
    this.selectedOriginalBasemap(basemap.name);
  }

  private addLayer(option: EuroGeographicsMapOption): void {
    if (this.isSelected(option)) {
      return;
    }

    const layer = this.createLayer(option);
    layer.options.customLayerOptionOpacity.set(this.getOpacity(option));
    this.eposLeaflet.addLayer(layer);

    setTimeout(() => {
      this.applyEuroGeographicsOrder();
    }, 0);
  }

  private removeLayer(option: EuroGeographicsMapOption): void {
    this.eposLeaflet.removeLayerById(this.getLayerId(option));
  }

  private createLayer(option: EuroGeographicsMapOption): WmsTileLayer {
    const parsedUrl = new URL(option.wmsUrl);
    const serviceUrl = `${parsedUrl.origin}${parsedUrl.pathname}`;

    const layer = new WmsTileLayer(this.getLayerId(option), option.name)
      .setUrl(serviceUrl)
      .visibleOnLayerControl.set(false)
      .toggleable.set(true);

    layer.setFeatureIdentifiable(
      new WmsFeatureDisplayItemGenerator(layer).setPreferredFormats([
        WmsFeatureFormat.PLAIN_TEXT,
        WmsFeatureFormat.HTML_TEXT,
        WmsFeatureFormat.JSON,
        WmsFeatureFormat.GEO_JSON,
      ])
    );

    const queryOptions = ['layers', 'styles', 'version', 'format'];
    queryOptions.forEach((optionName: string) => {
      const value = parsedUrl.searchParams.get(optionName);
      if (value != null && value !== '') {
        layer.options.set(optionName, value);
      }
    });

    const request = parsedUrl.searchParams.get('request');
    if (request != null && request !== '') {
      layer.options.set('request', request);
    }

    const service = parsedUrl.searchParams.get('service');
    if (service != null && service !== '') {
      layer.options.set('service', service);
    }

    const requestCrs = parsedUrl.searchParams.get('crs');
    if (requestCrs != null && requestCrs !== '') {
      layer.options.set('customRequestCRS', requestCrs);
    }

    layer.options.set('token', option.token);

    layer.options.set('transparent', true);

    return layer;
  }

  private getLayerId(option: EuroGeographicsMapOption): string {
    return `eurogeographics-${option.id}`;
  }

  private getLayer(option: EuroGeographicsMapOption): WmsTileLayer | null {
    if (!this.eposLeaflet) {
      return null;
    }

    const layer = this.eposLeaflet.getLayers().find(l => l.id === this.getLayerId(option));
    return (layer as WmsTileLayer) ?? null;
  }

  private applyEuroGeographicsOrder(): void {
    if (!this.eposLeaflet) {
      return;
    }

    const map = this.eposLeaflet.getLeafletObject();
    const layersOrder = this.layersService.getLayersOrderStorage();
    const selectedLayers = this.options
      .map(option => this.getLayer(option))
      .filter((layer): layer is WmsTileLayer => layer != null);

    selectedLayers.slice().reverse().forEach((layer: WmsTileLayer, index: number) => {
      const zIndex = String(BasemapSelectorOptionsComponent.BASE_ZINDEX + index + 1);
      const pane = map.getPane(layer.id);
      if (pane != null) {
        pane.style.zIndex = zIndex;
      }
      this.layersService.setLayerOrder(layer.id, zIndex, layersOrder);
      layer.options.customLayerOptionZIndex.set(zIndex);
      this.layersService.layerChange(layer);
    });

    this.eposLeaflet.orderLayerOnMap();
  }
}
