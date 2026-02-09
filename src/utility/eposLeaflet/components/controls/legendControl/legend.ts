import { ImageLegendItem } from './imageLegendItem';
import { LegendItem } from './legendItem.abstract';

/** The `Legend` class represents a legend for a chart and provides methods for adding legend items,
customizing the display of the legend, and generating the HTML representation of the legend. */
export class Legend {

  /** The line `public legendItems = new Array<LegendItem>();` is declaring a public property
  `legendItems` and initializing it with an empty array of `LegendItem` objects. This property will
  hold the legend items for the `Legend` class. */
  public legendItems = new Array<LegendItem>();

  /** The line `protected displayFunction: (legend: Legend) => HTMLElement;` is declaring a protected
  property `displayFunction` of type function. This property is used to store a function that takes a
  `Legend` object as an argument and returns an `HTMLElement`. This function is used to customize the
  display of the legend content. By providing a custom display function, you can override the default
  display behavior of the `Legend` class and create a custom HTML structure for the legend items. */
  protected displayFunction: (legend: Legend) => HTMLElement;

  /**
   * The constructor function initializes the layerId and legendTitleHtml properties of an object.
   * @param {string} layerId - The layerId parameter is a string that represents the ID of a layer.
   * @param [legendTitleHtml] - The `legendTitleHtml` parameter is a string that represents the HTML
   * content for the legend title. It is optional and has a default value of an empty string.
   */
  constructor(
    public layerId: string,
    public legendTitleHtml = '',
  ) {
  }

  /**
   * The addLegendItem function adds a LegendItem to an array of legendItems and returns the updated
   * array.
   * @param {LegendItem} item - The `item` parameter is of type `LegendItem`. It represents a single
   * item in the legend.
   * @returns The updated instance of the object with the added legend item.
   */
  addLegendItem(item: LegendItem): this {
    this.legendItems.push(item);
    return this;
  }

  /**
   * The function sets the legend items for a chart and returns the updated object.
   * @param items - The `items` parameter is an array of `LegendItem` objects.
   * @returns The method is returning the instance of the class that the method is being called on.
   */
  setLegendItems(items: Array<LegendItem>): this {
    this.legendItems = items;
    return this;
  }

  /**
   * The `setDisplayFunction` function sets the display function for a Legend object.
   * @param displayFunction - The `displayFunction` parameter is a function that takes a `legend`
   * object as an argument and returns an `HTMLElement`. This function is used to generate the HTML
   * representation of the legend.
   * @returns The "this" keyword is being returned.
   */
  setDisplayFunction(
    displayFunction: (legend: Legend) => HTMLElement,
  ): this {
    this.displayFunction = displayFunction;
    return this;
  }

  /**
   * The function creates and returns an HTML element containing a title for a legend.
   * @returns an HTMLElement, specifically a div element that contains the legend title HTML content.
   */
  createDisplayTitle(): HTMLElement {
    const titleDiv = document.createElement('div');
    titleDiv.innerHTML = this.legendTitleHtml;
    return titleDiv;
  }

  /**
   * The function returns the result of either the displayFunction or the defaultDisplayFunction,
   * depending on whether the displayFunction is defined.
   * @returns The function `createDisplayContent()` returns an HTMLElement.
   */
  createDisplayContent(legendItemToHide: Array<string> = []): HTMLElement {
    return (this.displayFunction) ? this.displayFunction(this) : this.defaultDisplayFunction(this, legendItemToHide);
  }


  /**
   * This TypeScript function creates a HTML element containing legend items, with the option to hide
   * specific items.
   * @param {Legend} legend - The `legend` parameter is an object that contains information about a
   * legend, such as legend items and their properties.
   * @param legendItemToHide - The `legendItemToHide` parameter is an optional array of strings that
   * contains the IDs of legend items that should be hidden in the legend display. If a legend item's
   * ID matches any of the IDs in the `legendItemToHide` array, that particular legend item will not be
   * shown in
   * @returns An HTMLElement containing the legend details grid with legend items that are not in the
   * legendItemToHide array.
   */
  protected defaultDisplayFunction(legend: Legend, legendItemToHide: Array<string> = []): HTMLElement {
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('legend-details-grid');
    contentDiv.classList.add('nice-scrollbar');

    legend.legendItems.forEach((legendItem: LegendItem) => {
      let showLegend = true;

      if (null != legendItem) {

        if (legendItem instanceof ImageLegendItem && legendItemToHide.includes(legendItem.id)) {
          showLegend = false;
        }

        if (showLegend) {
          const contentRowDiv = document.createElement('div');
          contentRowDiv.classList.add('legend-details-row');

          contentRowDiv.appendChild(legendItem.getIconElement());
          contentRowDiv.appendChild(legendItem.getLabelElement());

          contentDiv.appendChild(contentRowDiv);
        }
      }
    });

    return contentDiv;
  }
}
