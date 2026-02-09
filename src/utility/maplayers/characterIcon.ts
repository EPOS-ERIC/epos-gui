import { Marker, AnchorLocation } from 'utility/eposLeaflet/eposLeaflet';

export class CharacterIcon extends Marker {
  private character = 'C';
  private colorHex = '#d03f3f';
  private sizePx = 20;
  private widthGuidePx = 10;

  public constructor() {
    super();
    this.setIconAnchor(AnchorLocation.CENTER);
    this.setTooltipAnchor(AnchorLocation.CENTER);
    this.setPopupAnchor(AnchorLocation.NORTH);
  }

  public configure(character: string, sizePx?: number, colorHex?: string, widthGuidePx?: number): this {
    this.character = character.charAt(0) || 'C';
    this.sizePx = (sizePx != null) ? sizePx : this.sizePx;
    this.colorHex = (colorHex != null) ? colorHex : this.colorHex;
    this.widthGuidePx = (widthGuidePx != null) ? widthGuidePx : this.widthGuidePx;
    return this;
  }

  public getIcon(): HTMLElement {
    const wrapperDiv = document.createElement('div');

    const marker = document.createElement('span');
    marker.innerHTML = this.character.charAt(0);
    marker.style.fontSize = `${this.sizePx}px`;
    marker.style.lineHeight = `${this.sizePx}px`;
    marker.style.fontWeight = 'bold';
    marker.style.color = this.colorHex;
    wrapperDiv.appendChild(marker);

    this.setIconSize(this.widthGuidePx, this.sizePx);
    return wrapperDiv;
  }

}
