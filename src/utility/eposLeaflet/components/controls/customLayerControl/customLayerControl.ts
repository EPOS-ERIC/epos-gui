// No types available for jquery ui
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/dot-notation */
import * as L from 'leaflet';
import { AbstractControl } from '../abstractControl/abstractControl';
import { Subscription } from 'rxjs';
import 'jquery';
import { Injectable, Injector, ViewChild, ViewContainerRef } from '@angular/core';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';

@Injectable()
export class CustomLayerControl extends AbstractControl {

  @ViewChild('container', { read: ViewContainerRef }) container!: ViewContainerRef;

  protected contentWrapper: HTMLElement;

  protected paneNames = new Array<string>();

  protected subscriptions: Array<Subscription> = new Array<Subscription>();

  private panelsEvent: PanelsEmitterService;


  constructor(
    private injector: Injector,
  ) {
    super();
    this.panelsEvent = this.injector.get<PanelsEmitterService>(PanelsEmitterService);
  }

  public onAdd(): HTMLElement {

    this.contentWrapper = L.DomUtil.create('div', 'custom-layer-control');

    return this.getControlContainer(
      'custom-layer-control',
      'fas fa-layer-group',
      'Legend and layer control',
      this.contentWrapper,
    );

  }

  protected getControlContainer(
    controlId: string,
    faIconClasses: string,
    title: string,
    content: HTMLElement,
  ): HTMLElement {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.id = controlId;
    wrapperDiv.classList.add('control-wrapper');
    wrapperDiv.classList.add('leaflet-bar');
    wrapperDiv.addEventListener('wheel', (event: Event) => {
      event.stopPropagation();
    });
    L.DomEvent.disableClickPropagation(wrapperDiv);

    wrapperDiv.appendChild(this.createExpander(faIconClasses, title));

    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('control-content');
    contentWrapper.classList.add('bordered');
    contentWrapper.appendChild(content);
    wrapperDiv.appendChild(contentWrapper);

    return wrapperDiv;
  }

  protected createExpander(faIconClasses: string, title: string): HTMLElement {
    const expanderWrapper = document.createElement('div');
    expanderWrapper.classList.add('control-expander-wrapper');

    const expander = document.createElement('span');
    expander.classList.add('control-expander');

    const expanderIcon = document.createElement('i');
    faIconClasses.split(' ').forEach((cssClass: string) => {
      cssClass = cssClass.trim();
      if (cssClass !== '') {
        expanderIcon.classList.add(cssClass);
      }
    });

    const iconWrapper = document.createElement('span');
    iconWrapper.setAttribute('data-cy', 'layer-control-content');
    iconWrapper.classList.add('icon-wrapper');
    iconWrapper.classList.add('bordered');
    iconWrapper.title = title;
    iconWrapper.addEventListener('click', (event: Event) => {
      event.stopPropagation();
      const wasOpen = this.getContainer()!.classList.contains('control-expanded');
      this.closeExpanders(event.target as HTMLElement);
      if (!wasOpen) {
        this.getContainer()!.querySelector('.icon-wrapper')!.dispatchEvent(new CustomEvent('open'));
      }
    });
    iconWrapper.addEventListener('open', (event: Event) => {
      this.eposLeaflet.openLayerControl();
      event.stopPropagation();
      this.getContainer()!.classList.add('control-expanded');
      this.panelsEvent.layerControlPanel();
    });
    iconWrapper.addEventListener('close', (event: Event) => {
      this.eposLeaflet.closeLayerControl();
      event.stopPropagation();
      this.getContainer()!.classList.remove('control-expanded');
    });
    iconWrapper.appendChild(expanderIcon);

    expander.appendChild(iconWrapper);
    expanderWrapper.appendChild(expander);
    return expanderWrapper;
  }
}
