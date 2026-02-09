import { FaMarkerIcon } from './faMarkerIcon';
import { Marker } from '../marker';
import { AnchorLocation } from '../anchorLocation.enum';

export class FaMarker extends Marker {
  // protected showShadow = true;
  public icon: HTMLElement;
  protected faClasses = ['fas', 'fa-map-marker'];
  protected colorHex = '#d03f3f';
  protected sizePx = 40;
  protected widthGuidePx = 30;
  protected transparencyPercent = 50;
  protected iconXOffsetPercent = 0;
  protected iconYOffsetPercent = -15;

  public constructor() {
    super();
    this.setIconAnchor(AnchorLocation.SOUTH);
    this.setTooltipAnchor(AnchorLocation.SOUTH);
    this.setPopupAnchor(AnchorLocation.NORTH);
  }

  public static percentToHex(num: number): string {
    switch (true) {
      case num == null:
        num = 50;
        break;
      case num < 0:
        num = 0;
        break;
      case num > 100:
        num = 100;
        break;
    }

    return Math.floor((num / 100) * 256)
      .toString(16)
      .padStart(2, '0');
  }

  public configure(
    faClasses: null | Array<string>,
    colorHex: null | string = null,
    sizePx: null | number = null,
    widthGuidePx: null | number = null,
    transparencyPercent: null | number = null,
    iconXOffsetPercent: null | number = null,
    iconYOffsetPercent: null | number = null,
  ): this {
    this.faClasses = faClasses != null ? faClasses : this.faClasses;
    this.colorHex = colorHex != null ? colorHex : this.colorHex;
    this.sizePx = sizePx != null ? sizePx : this.sizePx;
    this.widthGuidePx = widthGuidePx != null ? widthGuidePx : this.widthGuidePx;
    this.transparencyPercent = transparencyPercent != null ? transparencyPercent : this.transparencyPercent;
    this.iconXOffsetPercent = iconXOffsetPercent != null ? iconXOffsetPercent : this.iconXOffsetPercent;
    this.iconYOffsetPercent = iconYOffsetPercent != null ? iconYOffsetPercent : this.iconYOffsetPercent;
    return this;
  }

  public setIcon(icon: HTMLElement | (() => HTMLElement)): this {
    this.icon = typeof icon === 'function' ? icon() : icon;
    return this;
  }
  public configureIcon(iconFaClasses: Array<string>, iconColorHex?: string, sizePercent?: number): this {
    this.icon = new FaMarkerIcon().configure(iconFaClasses, iconColorHex, sizePercent).createElement();
    return this;
  }

  public getFaClasses(): Array<string> {
    return this.faClasses;
  }

  // public setShowShadow(show: boolean): this {
  //   this.showShadow = show;
  //   return this;
  // }

  public getIcon(): HTMLElement {
    const wrapperDiv = this.createElement();

    if (this.icon != null) {
      this.icon.classList.add('fa-marker-icon-icon');
      this.icon.classList.add('fa-marker-overlay');
      this.icon.style.marginLeft = `${this.iconXOffsetPercent}%`;
      this.icon.style.marginTop = `${this.iconYOffsetPercent}%`;
      wrapperDiv.appendChild(this.icon);
    }
    this.setIconSize(this.widthGuidePx, this.sizePx);
    return wrapperDiv;
  }

  public createElement(): HTMLElement {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.classList.add('fa-marker-wrapper');
    wrapperDiv.style.position = 'relative';
    wrapperDiv.style.fontSize = `${this.sizePx}px`;

    const markerGradient = document.createElement('i');
    markerGradient.style.zIndex = '-1';
    this.faClasses.forEach((cssClass: string) => markerGradient.classList.add(cssClass));
    markerGradient.classList.add('fa-marker-icon-marker');
    markerGradient.classList.add('fa-marker-overlay');
    markerGradient.classList.add('marker-gradient-back');
    wrapperDiv.appendChild(markerGradient);

    const gradientTransparencyPercent = FaMarker.percentToHex(this.transparencyPercent);
    const marker = document.createElement('i');
    this.faClasses.forEach((cssClass: string) => marker.classList.add(cssClass));
    marker.classList.add('fa-marker-icon-marker');
    marker.classList.add('marker-gradient');
    // marker.style.fontSize = `${this.sizePx}px`;
    marker.style.color = this.colorHex;
    marker.style.background = `linear-gradient(${this.colorHex}, ${this.colorHex}${gradientTransparencyPercent})`;
    wrapperDiv.appendChild(marker);

    return wrapperDiv;
  }

  public setFaClasses(faClasses: Array<string>): void {
    this.faClasses = faClasses;
  }

  public setColor(color: string): void {
    this.colorHex = color;
  }

  public setSize(size: number): void {
    this.sizePx = size;
    this.widthGuidePx = size;
  }

  // // overrides L.DivIcon func
  // public createShadow(oldIcon?: HTMLElement): HTMLElement {
  //   return (this.showShadow) ? this.marker.createShadow() : null;
  // }
}
