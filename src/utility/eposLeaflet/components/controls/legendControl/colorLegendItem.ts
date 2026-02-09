import { LegendItem } from './legendItem.abstract';

export class ColorLegendItem extends LegendItem {
  constructor(
    label: string,
    public colorHex: string,
  ) {
    super(label);
  }

  getHtmlElement(): HTMLElement {
    const icon = document.createElement('span');
    icon.style.backgroundColor = this.colorHex;
    return icon;
  }
}
