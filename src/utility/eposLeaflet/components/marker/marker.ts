import * as L from 'leaflet';
import { AnchorLocation } from './anchorLocation.enum';
import { AnchorLocations } from './anchorLocations';

/** The line `export abstract class Marker extends L.DivIcon {` is declaring a TypeScript class named
`Marker` that extends the `L.DivIcon` class from the Leaflet library. This means that the `Marker`
class inherits all the properties and methods from the `L.DivIcon` class and can also have its own
additional properties and methods. */
export abstract class Marker extends L.DivIcon {

  /** The line `protected wrapperCssClass = '';` is declaring a protected property named
  `wrapperCssClass` and initializing it with an empty string. This property is used to store the CSS
  class that will be applied to the wrapper element of the marker icon. */
  protected wrapperCssClass = '';

  /** The line `protected widthPx = 0;` is declaring a protected property named `widthPx` and
  initializing it with a value of 0. This property is used to store the width of the marker icon in
  pixels. By default, it is set to 0, but it can be modified using the `setIconSize` method. */
  protected widthPx = 0;

  /** The line `protected heightPx = 0;` is declaring a protected property named `heightPx` and
  initializing it with a value of 0. This property is used to store the height of the marker icon in
  pixels. By default, it is set to 0, but it can be modified using the `setIconSize` method. */
  protected heightPx = 0;

  /** The line `protected iconAnchor = AnchorLocation.CENTER;` is declaring a protected property named
  `iconAnchor` and initializing it with the value `AnchorLocation.CENTER`. This property is used to
  store the anchor location for the marker icon. By default, it is set to `AnchorLocation.CENTER`,
  but it can be modified using the `setIconAnchor` method. */
  protected iconAnchor = AnchorLocation.CENTER;

  /** The line `protected popupAnchor = AnchorLocation.CENTER;` is declaring a protected property named
  `popupAnchor` and initializing it with the value `AnchorLocation.CENTER`. This property is used to
  store the anchor location for the popup associated with the marker icon. By default, it is set to
  `AnchorLocation.CENTER`, but it can be modified using the `setPopupAnchor` method. */
  protected popupAnchor = AnchorLocation.CENTER;

  /** The line `protected tooltipAnchor = AnchorLocation.CENTER;` is declaring a protected property
  named `tooltipAnchor` and initializing it with the value `AnchorLocation.CENTER`. This property is
  used to store the anchor location for the tooltip associated with the marker icon. By default, it
  is set to `AnchorLocation.CENTER`, but it can be modified using the `setTooltipAnchor` method. */
  protected tooltipAnchor = AnchorLocation.CENTER;

  /**
   * The constructor function initializes an object with an empty configuration.
   */
  constructor() {
    super({
    });
  }

  /**
   * The function sets the CSS class for the wrapper element and returns the instance of the class.
   * @param {string} cssClass - The `cssClass` parameter is a string that represents the CSS class to
   * be applied to the wrapper element.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setWrapperClass(cssClass: string): this {
    this.wrapperCssClass = cssClass;
    return this;
  }

  /**
   * The function sets the width and height of an icon and returns the instance of the class.
   * @param {number} width - The width parameter is a number that represents the desired width of the
   * icon in pixels.
   * @param {number} height - The `height` parameter is a number that represents the desired height of
   * the icon in pixels.
   * @returns The method is returning the instance of the class that the method is being called on.
   */
  public setIconSize(width: number, height: number): this {
    this.widthPx = width;
    this.heightPx = height;
    return this;
  }

  /**
   * The function sets the anchor location for an icon and returns the object it was called on.
   * @param {AnchorLocation} iconAnchor - The `iconAnchor` parameter is of type `AnchorLocation`. It
   * represents the location of the anchor point for an icon.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setIconAnchor(iconAnchor: AnchorLocation): this {
    this.iconAnchor = iconAnchor;
    return this;
  }

  /**
   * The function sets the tooltip anchor location and returns the instance of the class.
   * @param {AnchorLocation} tooltipAnchor - The `tooltipAnchor` parameter is of type `AnchorLocation`.
   * It represents the location where the tooltip should be anchored to.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setTooltipAnchor(tooltipAnchor: AnchorLocation): this {
    this.tooltipAnchor = tooltipAnchor;
    return this;
  }

  /**
   * The function sets the popup anchor location and returns the instance of the class.
   * @param {AnchorLocation} popupAnchor - The `popupAnchor` parameter is of type `AnchorLocation`. It
   * is used to set the anchor location for a popup.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setPopupAnchor(popupAnchor: AnchorLocation): this {
    this.popupAnchor = popupAnchor;
    return this;
  }

  /**
   * The function `processAnchorLocation` takes in a full value, an anchor location, and arrays of half
   * value locations and full value locations, and returns a value based on the given location.
   * @param {number} fullValue - The fullValue parameter is a number that represents the full value of
   * something.
   * @param {AnchorLocation} thisLocation - The current location for which we want to determine the
   * anchor value.
   * @param halfValueLocations - An array of AnchorLocation objects that represent locations where the
   * value should be divided by 2.
   * @param fullValueLocations - An array of AnchorLocation objects that represent the locations where
   * the full value should be applied.
   * @returns The value that is being returned is a number.
   */
  public processAnchorLocation(
    fullValue: number,
    thisLocation: AnchorLocation,
    halfValueLocations: Array<AnchorLocation>,
    fullValueLocations: Array<AnchorLocation>,
  ): number {
    let value = 0;
    if (halfValueLocations.includes(thisLocation)) {
      value = fullValue / 2;
    } else if (fullValueLocations.includes(thisLocation)) {
      value = fullValue;
    }
    return value;
  }

  /**
   * The function `getMarker` returns a Leaflet marker object with a specified icon at the given
   * latitude and longitude.
   * @param latlng - The `latlng` parameter is a `L.LatLng` object that represents the latitude and
   * longitude coordinates of a location.
   * @returns a Leaflet marker object.
   */
  public getMarker(latlng: L.LatLng, setBubblingMouseEvents = true): L.Marker {
    return L.marker(latlng, { icon: this, bubblingMouseEvents: setBubblingMouseEvents } as L.MarkerOptions);
  }


  /**
   * The function creates an icon element and returns it.
   * @param {HTMLElement} [oldIcon] - The `oldIcon` parameter is an optional parameter of type
   * `HTMLElement`. It represents the existing icon element that you want to replace or modify. If no
   * `oldIcon` is provided, the function will create a new icon element from scratch.
   * @returns The `createIcon` method is returning an `HTMLElement`.
   */
  public createIcon(oldIcon?: HTMLElement): HTMLElement {
    this.create();
    return super.createIcon();
  }

  /**
   * The function creates an icon element and sets various options for the icon.
   */
  protected create(): void {
    const iconElement = this.getIcon();

    if (this.wrapperCssClass != null && this.wrapperCssClass !== '') {
      this.wrapperCssClass.split(' ').forEach((cssClass: string) => {
        iconElement.classList.add(cssClass);
      });
    }

    this.options.html = iconElement.outerHTML;

    this.options.iconSize = L.point(this.widthPx, this.heightPx);
    this.options.iconAnchor = this.getIconAnchorPoint();

    this.options.tooltipAnchor = this.getTooltipAnchorPoint(this.options.iconAnchor);
    this.options.popupAnchor = this.getPopupAnchorPoint(this.options.iconAnchor);
  }

  /**
   * The function returns the anchor point of an icon based on its width, height, and anchor location.
   * @returns an L.Point object.
   */
  protected getIconAnchorPoint(): L.Point {
    return L.point(
      this.processAnchorLocation(
        this.widthPx,
        this.iconAnchor,
        AnchorLocations.getX(AnchorLocation.CENTER),
        AnchorLocations.getX(AnchorLocation.EAST),
      ),
      this.processAnchorLocation(
        this.heightPx,
        this.iconAnchor,
        AnchorLocations.getY(AnchorLocation.CENTER),
        AnchorLocations.getY(AnchorLocation.SOUTH),
      ),
    );
  }

  /**
   * The function returns the anchor point for a tooltip, taking into account the tooltip's width,
   * height, and anchor location.
   * @param offset - The `offset` parameter is an optional parameter that represents the x and y
   * coordinates to offset the tooltip anchor point by. It is a `L.Point` object with two properties:
   * `x` and `y`. By default, it is set to `L.point(0, 0)`,
   * @returns an instance of the L.Point class.
   */
  protected getTooltipAnchorPoint(offset = L.point(0, 0)): L.Point {
    return L.point(
      this.processAnchorLocation(
        this.widthPx,
        this.tooltipAnchor,
        AnchorLocations.getX(AnchorLocation.CENTER),
        AnchorLocations.getX(AnchorLocation.EAST),
      ) - offset.x,
      this.processAnchorLocation(
        this.heightPx,
        this.tooltipAnchor,
        AnchorLocations.getY(AnchorLocation.CENTER),
        AnchorLocations.getY(AnchorLocation.SOUTH),
      ) - offset.y,
    );
  }

  /**
   * The function `getPopupAnchorPoint` returns the anchor point for a popup, taking into account the
   * offset and anchor location.
   * @param offset - The `offset` parameter is an optional parameter that represents the distance to
   * offset the popup anchor point from its original position. It is a `L.Point` object with `x` and
   * `y` properties representing the horizontal and vertical offset respectively. By default, it is set
   * to `L.point(
   * @returns a `L.Point` object.
   */
  protected getPopupAnchorPoint(offset = L.point(0, 0)): L.Point {
    return L.point(
      this.processAnchorLocation(
        this.widthPx,
        this.popupAnchor,
        AnchorLocations.getX(AnchorLocation.CENTER),
        AnchorLocations.getX(AnchorLocation.EAST),
      ) - offset.x,
      this.processAnchorLocation(
        this.heightPx,
        this.popupAnchor,
        AnchorLocations.getY(AnchorLocation.CENTER),
        AnchorLocations.getY(AnchorLocation.SOUTH),
      ) - offset.y,
    );
  }

  /** The `public abstract getIcon(): HTMLElement;` is a method declaration in the abstract class
  `Marker`. It declares a method named `getIcon` that returns an `HTMLElement`. */
  public abstract getIcon(): HTMLElement;
}
