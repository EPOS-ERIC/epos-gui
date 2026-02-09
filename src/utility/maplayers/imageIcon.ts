import { Marker, AnchorLocation } from 'utility/eposLeaflet/eposLeaflet';

export class ImageIcon extends Marker {
  private url = '';
  private maxHeightPx = 20;
  private maxWidthPx = 20;

  public constructor() {
    super();
    this.setIconAnchor(AnchorLocation.CENTER);
    this.setTooltipAnchor(AnchorLocation.CENTER);
    this.setPopupAnchor(AnchorLocation.NORTH);
  }

  /**
   * The `configure` function sets the URL, maximum height, and maximum width of an object.
   * @param {string} url - The `url` parameter is a string that represents the URL of the image that you
   * want to configure.
   * @param {number} [maxHeightPx] - The `maxHeightPx` parameter is an optional parameter that specifies
   * the maximum height in pixels for the configuration. If a value is provided for `maxHeightPx`, it
   * will be assigned to the `maxHeightPx` property of the object. If no value is provided, the current
   * value of `
   * @param {number} [maxWidthPx] - The `maxWidthPx` parameter is an optional parameter that specifies
   * the maximum width in pixels for the configuration. If a value is provided for `maxWidthPx`, it will
   * be assigned to the `maxWidthPx` property of the object. If no value is provided, the current value
   * of `
   * @returns The method is returning the instance of the class itself (this).
   */
  public configure(url: string, maxHeightPx?: number, maxWidthPx?: number): this {
    this.url = url;
    this.maxHeightPx = (maxHeightPx != null) ? maxHeightPx : this.maxHeightPx;
    this.maxWidthPx = (maxWidthPx != null) ? maxWidthPx : this.maxWidthPx;
    return this;
  }


  /**
   * The function returns an HTML element (an image) with a specified maximum width and height, and a
   * source URL.
   * @returns The `getIcon()` method returns an `HTMLElement` object, specifically an `Image` element.
   */
  public getIcon(): HTMLElement {
    const img = new Image();

    this.setIconSize(this.maxWidthPx, this.maxHeightPx);
    img.style.setProperty('max-width', `${this.maxWidthPx}px`, 'important');
    img.style.setProperty('max-height', `${this.maxHeightPx}px`, 'important');

    img.src = this.url;

    return img;
  }

}
