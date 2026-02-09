// No types available for jquery ui
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/dot-notation */
import * as L from 'leaflet';
import { AbstractControl } from '../abstractControl/abstractControl';
import { Subscription } from 'rxjs';
import { MapLayer } from '../../layers/mapLayer.abstract';
import { LayerWithMarkers } from '../../layers/layerWithMarkers.interface';
import 'jquery';

export class LayerControl extends AbstractControl {
  protected contentWrapper: HTMLElement;

  protected paneNames = new Array<string>();

  protected subscriptions: Array<Subscription> = new Array<Subscription>();

  constructor(protected bottomLayerAtEnd = true) {
    super();
  }

  public onAdd(): HTMLElement {
    return this.getControlContainer();
  }

  protected init(): void {
    this.eposLeaflet.watchLayers().subscribe((mapLayers: Array<MapLayer>) => {
      if (mapLayers != null) {
        this.setLayers(mapLayers);
      }
    });
  }

  protected setLayers(layers: Array<MapLayer>): this {
    this.subscriptions.forEach((subs: Subscription) => {
      subs.unsubscribe();
    });
    while (this.contentWrapper.firstChild) {
      this.contentWrapper.removeChild(this.contentWrapper.firstChild);
    }
    const panes = this.leafletMapObj.getPanes();

    const orderedPaneNames = new Array<[string, number]>();
    Object.keys(this.leafletMapObj.getPanes()).forEach((key: string) => {
      orderedPaneNames.push([key, Number(this.getStyle(panes[key], 'z-index'))]);
    });

    orderedPaneNames
      .sort((a: [string, number], b: [string, number]) => (a[1] > b[1] ? 1 : -1))
      .forEach((orderedPaneName: [string, number]) => {
        const layersSection = this.createLayersSection(layers, orderedPaneName[0]);
        if (layersSection != null) {
          layersSection.classList.add(`layers-section-${this.getPaneRef(orderedPaneName[0])}`);
          this.contentWrapper.appendChild(layersSection);
        }
      });

    return this;
  }

  protected getPaneRef(paneName: string): number {
    let ref = this.paneNames.findIndex((thisPaneName: string) => thisPaneName === paneName);
    if (ref === -1) {
      ref = this.paneNames.length;
      this.paneNames.push(paneName);
    }
    return ref;
  }

  protected getPaneLayers(layers: Array<MapLayer>, paneName: string): Array<MapLayer> {
    // creates a copy with filter
    return layers.filter((layer: MapLayer) => {
      return layer.visibleOnLayerControl.get() && layer.options.pane.get() === paneName && layer.addedToMap.get();
    });
  }

  protected createLayersSection(layers: Array<MapLayer>, paneName: string): null | HTMLElement {
    const paneLayers = this.getPaneLayers(layers, paneName).slice();
    if (this.bottomLayerAtEnd) {
      paneLayers.reverse();
    }
    let returnList: null | HTMLElement = null;
    if (paneLayers.length > 0) {
      const sortable = paneLayers.length > 1;

      const list = document.createElement('ul');
      paneLayers.forEach((layer: MapLayer) => {
        const item = document.createElement('li');

        // start drag n drop handle
        const dragTrigger = this.createDragIcon(paneLayers.length > 1 && sortable);
        // if (!sortable) {
        //   item.classList.add('ui-state-disabled');
        // }
        item.appendChild(dragTrigger);
        // end drag n drop handle

        // hider toggle
        item.appendChild(this.createHiderToggle(layer));

        // start opacity slider
        const opacity = document.createElement('span');
        item.appendChild(opacity);
        const containerSelector = '.leaflet-container';
        const forceCursorClass = 'force-cursor-on-slide';
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const thisSlider = jQuery(opacity)['slider']({
          min: 0.1,
          max: 1,
          step: 0.01,
          value: layer.options.customLayerOptionOpacity.get(),
          slide: (event, ui) => {
            layer.options.customLayerOptionOpacity.set(ui.value as number);
          },
          start: () => {
            jQuery(thisSlider).closest(containerSelector).addClass(forceCursorClass);
          },
          stop: () => {
            jQuery(thisSlider).closest(containerSelector).removeClass(forceCursorClass);
          },
        });
        this.subscriptions.push(
          layer.options.customLayerOptionOpacity.watch().subscribe((value: number) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            if (value !== thisSlider.slider('value')) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call
              thisSlider.slider('value', value);
            }
          }),
        );
        // end opacity slider

        const title = document.createElement('span');
        title.classList.add('layer-name');
        title.innerText = `${layer.name}`;
        title.title = `${layer.name}`;
        item.appendChild(title);

        list.appendChild(item);

        // jquery drag n drop
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        jQuery(item)['disableSelection']();
      });

      // jquery drag n drop
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      jQuery(list)['sortable']({
        handle: '.handle',
        items: 'li:not(.ui-state-disabled)',
        start: (event, ui) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          jQuery(ui.item).data('startindex', ui.item.index() as string | number | boolean | symbol | object);

          // fix width of the container
          jQuery(list)
            .find('li')
            .css('min-width', String(ui.item[0].offsetWidth) + 'px');
        },
        stop: (event, ui) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          jQuery(list).find('li').css('min-width', '');
        },
      });
      returnList = list;
    }
    // ensure order consistent.  Marker layers ordered via z-index need this.
    paneLayers.forEach((layer: MapLayer, arrayIndex: number) => {
      if (typeof layer['setZOffset'] === 'function') {
        (layer as unknown as LayerWithMarkers).setZOffset(this.getLayerIndex(arrayIndex));
      }
    });
    return returnList;
  }

  protected getLayerIndex(arrayIndex: number): number {
    return (this.bottomLayerAtEnd)
      ? 0 - arrayIndex
      : arrayIndex;
  }

  protected createDragIcon(draggable: boolean): HTMLElement {
    const element = document.createElement('i');
    if (draggable) {
      element.classList.add('fas');
      element.classList.add('fa-grip-vertical');
      element.classList.add('handle');
    }
    return element;
  }

  protected createHiderToggle(layer: MapLayer): HTMLElement {
    const element = document.createElement('i');
    if (layer.toggleable.get()) {
      this.configureHiderToggle(element, layer.hidden.get()!);
      element.addEventListener('click', () => {
        layer.hidden.set(this.configureHiderToggle(element));
      });
    }
    return element;
  }

  protected configureHiderToggle(element: HTMLElement, hidden?: boolean): boolean {
    // toggle by default
    hidden = hidden == null ? !element.classList.contains('fa-square') : hidden;
    if (hidden) {
      element.classList.remove('fa-check-square');
      element.classList.add('fa-square');
    } else {
      element.classList.remove('fa-square');
      element.classList.add('fa-check-square');
    }
    // ensure has far
    if (!element.classList.contains('far')) {
      element.classList.add('far');
    }
    // ensure has hider-toggle
    if (!element.classList.contains('hider-toggle')) {
      element.classList.add('hider-toggle');
    }

    return hidden;
  }

  protected getControlContainer(): HTMLElement {
    this.contentWrapper = L.DomUtil.create('div');
    this.contentWrapper.classList.add('layers-section-wrapper');
    this.contentWrapper.classList.add('pretty-scroll');
    if (this.bottomLayerAtEnd) {
      this.contentWrapper.classList.add('order-reverse');
    }

    const wrapperDiv = super.getControlContainer(
      'layer-control',
      'fas fa-layer-group',
      'Layer Control',
      this.contentWrapper,
    );

    return wrapperDiv;
  }

  protected getStyle(el: HTMLElement, styleProp: string): string {
    let value = '';
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const docView = document.defaultView!;
    if (docView['getComputedStyle']) {
      value = docView.getComputedStyle(el, null).getPropertyValue(styleProp);
    } else if (el['currentStyle']) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      value = el['currentStyle'][styleProp];
    }

    return value;
  }
}
