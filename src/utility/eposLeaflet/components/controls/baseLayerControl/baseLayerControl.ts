import * as L from 'leaflet';
import { AbstractControl } from '../abstractControl/abstractControl';
import { BaseLayerOption } from './baseLayerOption';
import { MapLayer } from '../../layers/mapLayer.abstract';
import { baseLayerOptions } from './baseLayerOptions';

export class BaseLayerControl extends AbstractControl {
  protected selector: HTMLSelectElement;

  protected baseLayerOptions = baseLayerOptions;

  protected selectedIndex = 0;
  protected currentLayers = new Array<MapLayer>();

  public onAdd(): HTMLElement {
    const content = this.getControlContainer();
    this.selectIndex(this.selectedIndex);
    return content;
  }

  public selectIndex(optionIndex: number): this {
    if (optionIndex >= this.baseLayerOptions.length) {
      console.warn(`BaseLayerSelector selectLayer: invalid index "${optionIndex}"`);
    } else {
      this.selectedIndex = optionIndex;
      // if intialised
      if (this.selector != null) {
        if (this.selector.selectedIndex !== optionIndex) {
          // select value in selector
          this.selector.selectedIndex = optionIndex;
        }
      }
      this.updateLayers(this.baseLayerOptions[optionIndex]);
    }
    return this;
  }

  public getOptions(): Array<BaseLayerOption> {
    return this.baseLayerOptions;
  }
  public setOptions(options: Array<BaseLayerOption>): this {
    this.baseLayerOptions = options;
    return this;
  }
  public clearOptions(): this {
    while (this.baseLayerOptions.shift() != null) { }
    return this;
  }
  public addOption(option: BaseLayerOption): this {
    this.baseLayerOptions.push(option);
    return this;
  }
  public getCurrentLayers(): Array<MapLayer> {
    return this.currentLayers;
  }

  protected getControlContainer(): HTMLElement {
    this.selector = L.DomUtil.create('select') as HTMLSelectElement;
    this.selector.classList.add('basemap-selector-content');
    this.selector.innerHTML = this.getOptionsHtml();
    this.selector.addEventListener('change', (event: Event) => {
      const layerIndex = Number((event.target as HTMLOptionElement).value).valueOf();
      this.selectIndex(layerIndex);
    });

    const wrapperDiv = super.getControlContainer(
      'basemap-selector-control',
      'fas fa-map',
      'Base Layer Selector',
      this.selector,
    );

    return wrapperDiv;
  }

  protected getOptionsHtml(): string {
    let returnString = '';
    this.baseLayerOptions.forEach((option: BaseLayerOption, index: number) => {
      // default to Imagery
      const selectedString = index === this.selectedIndex ? ' selected' : '';
      returnString += `
      <option value="${index}"${selectedString}>${option.name}</option>`;
    });
    return returnString;
  }

  protected updateLayers(option: BaseLayerOption): void {
    const newLayers = option.getLayers().slice();

    if (this.eposLeaflet != null) {
      // remove old base layers
      this.currentLayers.forEach((layer: MapLayer) => {
        this.eposLeaflet.removeLayerById(layer.id);
      });

      // add newly selected layers
      newLayers.forEach((layer: MapLayer, index: number) => {
        this.eposLeaflet.addLayer(layer);
      });
    }

    this.currentLayers = newLayers;
  }
}
