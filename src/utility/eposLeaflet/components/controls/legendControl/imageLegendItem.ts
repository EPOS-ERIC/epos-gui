import { LegendItem } from './legendItem.abstract';

export class ImageLegendItem extends LegendItem {
  constructor(
    label: string,
    public imgSrc: string,
    public id: string,
  ) {
    super(label);
  }

  getHtmlElement(): HTMLElement {
    const icon = document.createElement('img');
    icon.setAttribute('src', this.imgSrc);
    return icon;
  }
}
