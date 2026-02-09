/** The `FaMarkerIcon` class represents a marker icon that can be configured with Font Awesome classes,
color, and size. */
export class FaMarkerIcon {
  /** The line `protected faClasses = ['fas', 'fa-circle'];` is declaring and initializing a protected
  property `faClasses` of the class `FaMarkerIcon`. The property is an array of strings containing
  Font Awesome classes. These classes are used to display icons in the UI. In this case, the
  `faClasses` property is initialized with the values `['fas', 'fa-circle']`, which represent the
  classes for a circle icon from the Font Awesome library. */
  protected faClasses = ['fas', 'fa-circle'];

  /** The line `protected colorHex = '#ffffff';` is declaring and initializing a protected property
  `colorHex` of the class `FaMarkerIcon`. The property is a string that represents a hexadecimal color
  value. In this case, the `colorHex` property is initialized with the value `'#ffffff'`, which
  represents the color white. This property is used to configure the color of an element when creating
  an HTML element with the `createElement()` method. */
  protected colorHex = '#ffffff';

  /** The line `protected sizePercent = 33;` is declaring and initializing a protected property
  `sizePercent` of the class `FaMarkerIcon`. The property is a number that represents the size of an
  element in percentage. In this case, the `sizePercent` property is initialized with the value `33`,
  which means the element will have a size of 33% of its parent element. This property is used to
  configure the size of an element when creating an HTML element with the `createElement()` method. */
  protected sizePercent = 33;

  /**
   * The configure function sets the values of faClasses, colorHex, and sizePercent properties, and
   * returns the instance of the class.
   * @param faClasses - An array of strings representing Font Awesome classes. These classes are used
   * to display icons in the UI.
   * @param {string} [colorHex] - The `colorHex` parameter is an optional parameter that represents a
   * hexadecimal color value. It is used to configure the color of an element. If a value is provided,
   * it will be assigned to the `colorHex` property. If no value is provided, the `colorHex` property
   * will remain
   * @param {number} [sizePercent] - The `sizePercent` parameter is an optional parameter of type
   * `number`. It represents the size of an element in percentage. If provided, it will be used to set
   * the size of the element. If not provided, the default value of `sizePercent` will be used.
   * @returns The method is returning the instance of the class itself (this).
   */
  public configure(
    faClasses: Array<string>,
    colorHex?: string,
    sizePercent?: number,
  ): this {
    this.faClasses = (faClasses != null) ? faClasses : this.faClasses;
    this.colorHex = (colorHex != null) ? colorHex : this.colorHex;
    this.sizePercent = (sizePercent != null) ? sizePercent : this.sizePercent;
    return this;
  }

  /**
   * The function creates an HTML element with specified font size, color, and CSS classes.
   * @returns an HTMLElement object, specifically an <i> element with the specified classes, font size,
   * and color.
   */
  public createElement(): HTMLElement {
    const icon = document.createElement('i');
    this.faClasses.forEach((cssClass: string) => icon.classList.add(cssClass));
    icon.classList.add('fa-marker-icon-icon');
    icon.classList.add('fa-marker-overlay');
    icon.style.fontSize = `${this.sizePercent}%`;
    icon.style.color = this.colorHex;

    return icon;
  }

}
