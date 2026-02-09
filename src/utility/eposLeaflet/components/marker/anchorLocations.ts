import { AnchorLocation } from './anchorLocation.enum';

/** The `AnchorLocations` class provides methods to retrieve arrays of anchor locations based on
different directions and center positions. */
export class AnchorLocations {

  /**
   * The function returns an array of AnchorLocation values representing the north and northeast and
   * northwest directions.
   * @returns An array of AnchorLocation objects representing the north, northeast, and northwest
   * anchor locations.
   */
  public static getNorth(): Array<AnchorLocation> {
    return [
      AnchorLocation.NORTH,
      AnchorLocation.NORTH_EAST,
      AnchorLocation.NORTH_WEST,
    ];
  }

  /**
   * The function returns an array of AnchorLocation values representing the south, southeast, and
   * southwest directions.
   * @returns An array of AnchorLocation objects representing the south, southeast, and southwest
   * anchor locations.
   */
  public static getSouth(): Array<AnchorLocation> {
    return [
      AnchorLocation.SOUTH,
      AnchorLocation.SOUTH_EAST,
      AnchorLocation.SOUTH_WEST,
    ];
  }

  /**
   * The function returns an array of AnchorLocation values representing the east, northeast, and
   * southeast directions.
   * @returns An array of AnchorLocation values representing the east direction.
   */
  public static getEast(): Array<AnchorLocation> {
    return [
      AnchorLocation.EAST,
      AnchorLocation.NORTH_EAST,
      AnchorLocation.SOUTH_EAST,
    ];
  }

  /**
   * The function returns an array of AnchorLocation values representing the west, northwest, and
   * southwest directions.
   * @returns An array of AnchorLocation values, specifically AnchorLocation.WEST,
   * AnchorLocation.NORTH_WEST, and AnchorLocation.SOUTH_WEST.
   */
  public static getWest(): Array<AnchorLocation> {
    return [
      AnchorLocation.WEST,
      AnchorLocation.NORTH_WEST,
      AnchorLocation.SOUTH_WEST,
    ];
  }

  /**
   * The function `getXCenter` returns an array of `AnchorLocation` values representing the north,
   * center, and south anchor locations.
   * @returns An array of AnchorLocation values, specifically [AnchorLocation.NORTH,
   * AnchorLocation.CENTER, AnchorLocation.SOUTH].
   */
  public static getXCenter(): Array<AnchorLocation> {
    return [
      AnchorLocation.NORTH,
      AnchorLocation.CENTER,
      AnchorLocation.SOUTH,
    ];
  }

  /**
   * The function `getYCenter` returns an array of three anchor locations: WEST, CENTER, and EAST.
   * @returns An array of AnchorLocation values, specifically [AnchorLocation.WEST,
   * AnchorLocation.CENTER, AnchorLocation.EAST].
   */
  public static getYCenter(): Array<AnchorLocation> {
    return [
      AnchorLocation.WEST,
      AnchorLocation.CENTER,
      AnchorLocation.EAST,
    ];
  }

  /**
   * The function returns an array of anchor locations based on the given xLocation.
   * @param {AnchorLocation} xLocation - The parameter `xLocation` is of type `AnchorLocation`.
   * @returns The method `getX` returns an array of `AnchorLocation` objects.
   */
  public static getX(xLocation: AnchorLocation): Array<AnchorLocation> {
    if (this.getEast().includes(xLocation)) {
      return this.getEast();
    } else if (this.getWest().includes(xLocation)) {
      return this.getWest();
    } else {
      return this.getXCenter();
    }
  }

  /**
   * The function returns an array of AnchorLocations based on the given location.
   * @param {AnchorLocation} location - The parameter "location" is of type "AnchorLocation".
   * @returns The method `getY` returns an array of `AnchorLocation` objects.
   */
  public static getY(location: AnchorLocation): Array<AnchorLocation> {
    if (this.getNorth().includes(location)) {
      return this.getNorth();
    } else if (this.getSouth().includes(location)) {
      return this.getSouth();
    } else {
      return this.getYCenter();
    }
  }
}
