/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/dot-notation */
import * as L from 'leaflet';
import { AbstractControl } from '../abstractControl/abstractControl';

export class BasemapSelectorControl extends AbstractControl {

  protected contentWrapper: HTMLElement;

  public onAdd(): HTMLElement {

    this.contentWrapper = L.DomUtil.create('div', 'basemap-selector-control');

    return this.getControlContainer(
      'basemap-selector-control',
      'fas fa-map-marked-alt',
      'Basemap selector',
      this.contentWrapper,
    );

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
    iconWrapper.setAttribute('data-cy', 'basemap-selector-control-content');
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
      this.eposLeaflet.openBasemapSelectorControl();
      event.stopPropagation();
      this.getContainer()!.classList.add('control-expanded');
    });
    iconWrapper.addEventListener('close', (event: Event) => {
      this.eposLeaflet.closeBasemapSelectorControl();
      event.stopPropagation();
      this.getContainer()!.classList.remove('control-expanded');
    });
    iconWrapper.appendChild(expanderIcon);

    expander.appendChild(iconWrapper);
    expanderWrapper.appendChild(expander);
    return expanderWrapper;
  }
}
