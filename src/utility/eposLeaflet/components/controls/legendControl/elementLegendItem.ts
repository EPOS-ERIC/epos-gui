import { LegendItem } from './legendItem.abstract';

export class ElementLegendItem extends LegendItem {
  constructor(
    label: string,
    public element: HTMLElement,
  ) {
    super(label);
  }

  getHtmlElement(): HTMLElement {
    return this.element;
  }
}
