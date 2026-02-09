import { Legend } from './legend';
import { LegendDisplay } from './legendDisplay.interface';

type PageClickFuncType = null | (() => void);
/** The `PagedLegendDisplay` class is a TypeScript class that implements the `LegendDisplay` interface
and provides functionality for displaying legends in a paged format with navigation controls. */
export class PagedLegendDisplay implements LegendDisplay {

  /** The line `public cssClassName = 'legend-display-paged';` is declaring a public property
  `cssClassName` and assigning it the value `'legend-display-paged'`. This property is used to store
  the CSS class name that will be applied to the HTML element representing the paged legend display. */
  public cssClassName = 'legend-display-paged';

  /** The line `protected selectedLegend: Legend;` is declaring a protected property `selectedLegend` of
  type `Legend`. This property is used to store the currently selected legend in the paged legend
  display. It is accessible within the class and its subclasses, but not outside of them. */
  protected selectedLegend: Legend;

  /**
   * The `displayLegend` function takes an array of legends, a function to set the content of a legend
   * element, and an optional index parameter, and displays the selected legend along with its content
   * and header elements.
   * @param {number} newIndex - The `newIndex` parameter is the index of the legend that should be
   * displayed. It is used to update the selected legend and call the `setContentFunction` with the
   * updated content and header elements.
   */
  public displayLegend(
    legends: Array<Legend>,
    setContentFunction: (contentElement: HTMLElement, headerElements?: Array<HTMLElement>) => void,
    index: null | number = null,
  ): void {
    if (index == null) {
      index = legends.findIndex((legend: Legend) => legend === this.selectedLegend);
      // previously selected legend is no longer available.
      if (index < 0) {
        index = 0;
      }
    }
    const selectedIndex = index;
    this.selectedLegend = legends[index];

    const changeDisplayFunc = (newIndex: number) => {
      this.displayLegend(legends, setContentFunction, newIndex);
    };

    setContentFunction(
      this.getLegendContent(this.selectedLegend),
      this.getLegendHeader(
        this.selectedLegend,
        (selectedIndex > 0) ? () => changeDisplayFunc(selectedIndex - 1) : null,
        ((selectedIndex + 1) < legends.length) ? () => changeDisplayFunc(selectedIndex + 1) : null,
      ),

    );
  }

  /**
   * The function `getLegendHeader` returns an array of HTML elements that make up the header of a
   * legend, including a title and pagination controls.
   * @param {Legend} legend - The `legend` parameter is an object of type `Legend`. It represents the
   * legend that will be displayed.
   * @param {PageClickFuncType} [previousClickFunc=null] - The `previousClickFunc` parameter is a
   * function that will be called when the user clicks on the previous button in the legend navigation.
   * It is of type `PageClickFuncType`, which is a custom type that represents a function that takes no
   * arguments and returns void.
   * @param {PageClickFuncType} [nextClickFunc=null] - The `nextClickFunc` parameter is a function that
   * will be called when the user clicks on the next page button in the legend navigation. It is of
   * type `PageClickFuncType`, which is a custom type that represents a function that takes no
   * arguments and returns void.
   * @returns an array of HTMLElements.
   */
  protected getLegendHeader(
    legend: Legend,
    previousClickFunc: PageClickFuncType = null,
    nextClickFunc: PageClickFuncType = null,
  ): Array<HTMLElement> {

    const content = new Array<HTMLElement>();

    const navDiv = document.createElement('div');
    navDiv.classList.add('legend-nav');

    // title
    if (legend != null) {
      const titleDisplay = legend.createDisplayTitle();
      titleDisplay.classList.add('legend-title');
      content.push(titleDisplay);
    }

    const paginationDiv = this.createPagination(
      previousClickFunc,
      nextClickFunc,
    );
    content.push(paginationDiv);

    return content;
  }

  /**
   * The function creates and returns an HTML element containing the legend content.
   * @param {Legend} legend - The `legend` parameter is of type `Legend`.
   * @returns an HTMLElement.
   */
  protected getLegendContent(
    legend: Legend,
  ): HTMLElement {

    const contentDiv = document.createElement('div');

    if (legend != null) {
      const legendDetailsDiv = document.createElement('div');
      legendDetailsDiv.classList.add('legend-details');
      legendDetailsDiv.appendChild(legend.createDisplayContent());
      contentDiv.appendChild(legendDetailsDiv);
    }

    return contentDiv;
  }

  /**
   * The function creates a pagination element with previous and next buttons, based on the provided
   * click functions.
   * @param {null | (() => void)} previousClickFunc - A function that will be called when the previous
   * button is clicked. It can be null if there is no previous button functionality.
   * @param {null | (() => void)} nextClickFunc - A function that will be called when the next button
   * is clicked.
   * @returns an HTMLElement, specifically a div element with the class "legend-pagination".
   */
  protected createPagination(
    previousClickFunc: null | (() => void),
    nextClickFunc: null | (() => void),
  ): HTMLElement {
    const headerDiv = document.createElement('div');
    headerDiv.classList.add('legend-pagination');

    // Show pagination if there is more than one legend
    if ((null != previousClickFunc) || (null != nextClickFunc)) {

      // previous butt
      const previousButt = this.createButton(
        '<i class="fas fa-caret-left"></i>',
        previousClickFunc,
        ['pagination-prev'],
      );
      headerDiv.appendChild(previousButt);
      // next butt
      const nextButt = this.createButton(
        '<i class="fas fa-caret-right"></i>',
        nextClickFunc,
        ['pagination-next'],
      );
      headerDiv.appendChild(nextButt);
    }
    return headerDiv;
  }

  /**
   * The function creates a button element with specified content, click function, and optional
   * classes, and returns the button element.
   * @param {string} content - The content parameter is a string that represents the text or HTML
   * content that will be displayed on the button.
   * @param {PageClickFuncType} clickFunc - The `clickFunc` parameter is a function that will be
   * executed when the button is clicked. It is of type `PageClickFuncType`, which is a custom type
   * that represents a function with no parameters and no return value.
   * @param classes - An array of strings representing additional CSS classes to be added to the button
   * element.
   * @returns an HTMLElement, specifically a button element.
   */
  protected createButton(
    content: string,
    clickFunc: PageClickFuncType,
    classes = new Array<string>(),
  ): HTMLElement {
    const butt = document.createElement('button');
    butt.setAttribute('type', 'button');
    butt.classList.add('btn');
    butt.classList.add('btn-xs');
    classes.forEach((classy: string) => {
      butt.classList.add(classy);
    });
    butt.addEventListener('click', (event: Event) => {
      event.stopPropagation();
      if (clickFunc != null) {
        clickFunc();
      }
    });

    if (clickFunc == null) {
      butt.classList.add('disabled');
    }
    butt.innerHTML = content;
    return butt;
  }

}
