/** The line `export abstract class LegendItem {` is defining an abstract class named `LegendItem` and
exporting it for use in other modules. */
export abstract class LegendItem {

  /** The line `protected cssClasses = ''; // can be space separated list` is declaring a protected
  property named `cssClasses` and initializing it with an empty string. This property can be used to
  store CSS classes that will be applied to an HTML element. The comment indicates that the
  `cssClasses` property can contain multiple class names separated by spaces. */
  protected cssClasses = ''; // can be space seperated list

  /**
   * The constructor function creates an instance of a class with a specified label.
   * @param {string} label - The label parameter is a string that represents the label of an object.
   */
  constructor(public label: string) { }

  /**
   * The function sets the CSS classes of an object and returns the object itself.
   * @param {string} cssClasses - The `cssClasses` parameter is a string that represents the CSS
   * classes to be applied to an element.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setCssClasses(cssClasses: string): this {
    this.cssClasses = cssClasses;
    return this;
  }

  /**
   * The function creates and returns an HTML span element with a label and CSS classes.
   * @returns an HTMLElement, specifically a span element with the label text and CSS classes applied.
   */
  public getLabelElement(): HTMLElement {
    const labelSpan = document.createElement('span');

    this.addCssClasses(labelSpan, this.cssClasses + ' legend-label');
    labelSpan.innerHTML = this.label;
    return labelSpan;
  }

  /**
   * The function returns an HTML element with added CSS classes.
   * @returns The method `getIconElement()` returns an HTMLElement.
   */
  public getIconElement(): HTMLElement {
    const element = this.getHtmlElement();
    this.addCssClasses(element, this.cssClasses + ' legend-icon');
    return element;
  }

  /**
   * The function adds CSS classes to an HTML element.
   * @param {HTMLElement} element - The `element` parameter is an instance of the `HTMLElement` class,
   * which represents an HTML element in the DOM (Document Object Model). It is the element to which
   * the CSS classes will be added.
   * @param {string} cssClasses - The `cssClasses` parameter is a string that contains one or more CSS
   * class names separated by spaces.
   */
  protected addCssClasses(element: HTMLElement, cssClasses: string): void {
    if (null != element) {
      const cssClassesArray = cssClasses.split(' ').filter((classy: string) => classy !== '');

      cssClassesArray.forEach((classy: string) => element.classList.add(classy));
    }
  }

  /** The `protected abstract getHtmlElement(): HTMLElement;` is a method declaration in the `LegendItem`
  class. It is marked as `abstract`, which means that it does not have an implementation in the
  `LegendItem` class itself, but it must be implemented in any concrete subclass that extends
  `LegendItem`. */
  protected abstract getHtmlElement(): HTMLElement;
}
