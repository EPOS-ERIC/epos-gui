import {
  GeoJsonLayer, EposLeafletComponent, MarkerClusterOptions, FaMarker, MapLayer, Legend,
  LegendItem, AnchorLocation, ElementLegendItem, Marker as MapMarker
} from 'utility/eposLeaflet/eposLeaflet';
import * as L from 'leaflet';
import { ObjectHelper } from './objectHelper';
import { HttpClient } from '@angular/common/http';
import { CharacterIcon } from './characterIcon';
import { ImageIcon } from './imageIcon';
import { Stylable } from 'utility/styler/stylable.interface';
import { Injector } from '@angular/core';
import { ExecutionService } from 'services/execution.service';
import { AuthenticatedClickService } from 'services/authenticatedClick.service';
import { defaultStyles } from 'utility/styler/styler';
import { Style } from 'utility/styler/style';
import { GeoJSONHelper } from './geoJSONHelper';
import { RawIcon } from './rawIcon';


export class JsonMapLayer extends GeoJsonLayer {

  /** The above code is declaring a protected property called `stylesMasterMap` which is of type
  `Map<number, PointStyle>`. It is initializing this property with a new instance of the `Map`
  class. */
  protected stylesMasterMap: Map<number, PointStyle> = new Map();

  /** The above code is defining a constant variable `CIRCLE_MARKER_RADIUS_PX` with a value of 8. The
  `protected` keyword indicates that the variable can only be accessed within the class or its
  subclasses. The `readonly` keyword indicates that the variable cannot be reassigned a new value
  once it is initialized. */
  protected readonly CIRCLE_MARKER_RADIUS_PX = 8;

  /** The above code is declaring a protected readonly variable named SIZE_MARKER and assigning it a
  value of 20. The protected keyword means that the variable can only be accessed within the class
  and its subclasses. The readonly keyword means that the variable cannot be modified once it is
  assigned a value. */
  protected readonly SIZE_MARKER = 20;

  /** The above code is declaring a protected readonly property called "executionService" of type
  "ExecutionService". */
  protected readonly executionService: ExecutionService;

  /** The above code is declaring a protected and read-only property called `authenticatedClickService`
  of type `AuthenticatedClickService`. */
  protected readonly authenticatedClickService: AuthenticatedClickService;

  /** The above code is declaring a protected property called "layerName" of type string in a TypeScript
  class. */
  protected layerName: string;

  /**
   * The constructor initializes the properties of the class and injects the required services.
   * @param {Injector} injector - The `injector` parameter is an instance of the `Injector` class. It
   * is used to retrieve instances of other services or dependencies.
   * @param {string} id - The `id` parameter is a string that represents the unique identifier for the
   * object being constructed. It is used to differentiate between different instances of the same
   * class.
   * @param {string} name - The `name` parameter is a string that represents the name of the object
   * being constructed.
   * @param {Stylable} stylable - The `stylable` parameter is of type `Stylable` and is a protected
   * property of the class. It is used to store and manipulate style-related information for the
   * component.
   */
  constructor(
    injector: Injector,
    id: string,
    name: string,
    protected stylable: Stylable,
  ) {
    super(id, name);
    this.executionService = injector.get<ExecutionService>(ExecutionService);
    this.authenticatedClickService = injector.get<AuthenticatedClickService>(AuthenticatedClickService);
    this.layerName = name;
  }

  /**
   * Return the stylable object.
   * @returns The stylable object.
   */
  public getStylable(): Stylable {
    return this.stylable;
  }

  /**
   * It updates the legend with the new stylable.
   * @param {Stylable} newstylable - The new Stylable object that will be used to create the legend.
   * @returns An array of legends.
   */
  public updateLegend(newstylable: Stylable): Promise<Array<Legend>> {
    this.stylable = newstylable;
    return this.createLegend(this, null);
  }

  /**
   * It creates a legend for the layer
   * @param {MapLayer} mapLayer - MapLayer - the map layer that is being rendered.
   * @param {HttpClient | null} http - HttpClient | null - this is the Angular HttpClient object.  It is
   * used to make HTTP requests.  It is null if the layer is being loaded from a local file.
   * @returns An array of Legend objects.
   */
  public createLegend(mapLayer: MapLayer, http: HttpClient | null): Promise<Array<Legend>> {
    const legend: Legend = new Legend(this.id, this.name);

    const isMarkerTypeRaw = this.options.customLayerOptionMarkerType.get() === 'raw' ? true : false;
    // if markerType is 'raw' (multistyle marker), consider only the first element in the array to create the legend
    if(isMarkerTypeRaw){
      const stylesArray = Array.from(this.stylesMasterMap.keys());
      const firstElement = stylesArray[0];
      const pointStyle: PointStyle = this.stylesMasterMap.get(firstElement)!;
      const legendItem = this.createLegendMarkerItem(this.stylable, pointStyle.label, pointStyle.getMarker());
      if (null != legendItem) {
        legend.addLegendItem(legendItem);
      }
    }
    else{
      Array.from(this.stylesMasterMap.keys())
        .sort((a, b) => a - b)
        .forEach(key => {
          const pointStyle: PointStyle = this.stylesMasterMap.get(key)!;
          const legendItem = this.createLegendMarkerItem(this.stylable, pointStyle.label, pointStyle.getMarker());
          if (null != legendItem) {
            legend.addLegendItem(legendItem);
          }
        });
    }
    const layerType = this.options.customLayerOptionMarkerType.get();
    const label = MapLayer.DEFAULT_LAYER_LEGEND_LABEL.find(i => i.type === layerType);

    if (label !== undefined) {
      legend.addLegendItem(this.createLegendOtherItem(this.stylable, label.value, layerType as 'point' | 'poly' | 'line'));
    }

    return Promise.resolve([legend]);
  }

  /**
   * "If the GeoJSON feature has a property called 'styleId' then use the style with that ID, otherwise
   * use the default style."
   *
   * The function starts by creating a variable called pointStyle and assigning it the default style
   * @param geoJsonPoint - GeoJSON.Feature<GeoJSON.Point, Record<string, unknown>>
   * @param latlng - L.LatLng
   * @returns A Leaflet marker
   */
  protected pointToLayer(geoJsonPoint: GeoJSON.Feature<GeoJSON.Point, Record<string, unknown>>, latlng: L.LatLng): L.Layer {

    // Default point style
    let pointStyle: PointStyle = PointStyle.DEFAULT_POINT;

    // Try to get the point style from the properties
    const styleId = geoJsonPoint.properties[GeoJSONHelper.STYLE_ID_ATTR] as number;
    if (ObjectHelper.isValidNumber(styleId)) {
      const found = this.stylesMasterMap.get(styleId);
      if (found != null) {
        pointStyle = found;
      }
    }
    return this.createLeafletMarker(this.stylable, pointStyle.getMarker(), latlng, true);
  }

  /**
   * If the stylable has a style, return the opacity of the first color, otherwise return 0.5.
   * @param {Stylable} stylable - The stylable object that is being drawn.
   * @returns The opacity of the stylable.
   */
  protected getStylableOpacity(stylable: Stylable): number {
    const style = stylable.getStyle();
    return (null != style) ?
      style.getOpacityColor1() : 0.5;
  }

  /**
   * "Get the color1 value from the stylable object, and return it as a CSS hex string."
   *
   * The function is protected, so it can only be called from within the class
   * @param {Stylable} stylable - The object that has the style.
   * @param [asCssHexString=true] - If true, the color will be returned as a CSS hex string (e.g.
   * #ffffff). If false, it will be returned as a hex number (e.g. 0xffffff).
   * @returns The color of the stylable object.
   */
  protected getStylableColor1(stylable: Stylable, asCssHexString = true): string {
    const style = stylable.getStyle();
    return (null != style)
      ? style.getColor1String(asCssHexString)
      : (asCssHexString) ? '#' : '' + this.getRandomicStyle().getColor1String();
  }

  /**
   * "If the stylable has a style, return the color2 as a string, otherwise return black."
   *
   * The function is a little more complicated than that, but not much. The first line is a comment. The
   * second line is a TypeScript type annotation. The third line is the function declaration. The fourth
   * line is a comment. The fifth line is a function call. The sixth line is a ternary operator. The
   * seventh line is a function call. The eighth line is a string literal. The ninth line is a closing
   * brace
   * @param {Stylable} stylable - The object that has the style.
   * @param [asCssHexString=true] - If true, the color will be returned as a CSS hex string (e.g.
   * #000000). If false, it will be returned as a hex number (e.g. 0x000000).
   * @returns The color of the stylable object.
   */
  protected getStylableColor2(stylable: Stylable, asCssHexString = true): string {
    const style = stylable.getStyle();
    return (null != style)
      ? style.getColor2String(asCssHexString)
      : (asCssHexString) ? '#' : '' + this.getRandomicStyle().getColor1String();
  }

  /**
   * If the stylable has a style, return the opacity of the second color, otherwise return 0.5.
   * @param {Stylable} stylable - The object that is being styled.
   * @returns The opacity of the fill color.
   */
  protected getStylableFillOpacity(stylable: Stylable): number {
    const style = stylable.getStyle();
    return (null != style) ?
      style.getOpacityColor2() : 0.5;
  }

  /**
   * "If the stylable has a style, return the weight of the style, otherwise return 3."
   *
   * The above function is a good example of how to use the `getStyle()` function
   * @param {Stylable} stylable - The object that is being styled.
   * @returns The weight of the stylable.
   */
  protected getWeight(stylable: Stylable): number {
    const style = stylable.getStyle();
    return (null != style) ?
      style.getWeight() : 3;
  }

  /**
   * If the stylable has a style, return the marker icon size from the style, otherwise return 20.
   * @param {Stylable} stylable - The object that is being styled.
   * @returns The size of the marker icon.
   */
  protected getStylableSize(stylable: Stylable): number {
    const style = stylable.getStyle();
    return (null != style) ?
      style.getMarkerIconSize() : 20;
  }

  /**
   * If the stylable has a style, return the style's clustering property, otherwise return null
   * @param {Stylable} stylable - The object that is being styled.
   * @returns A boolean or null.
   */
  protected getStylableClustering(stylable: Stylable): boolean | null {
    const style = stylable.getStyle();
    return (null != style) ?
      style.clustering : null;
  }

  /**
   * It takes a JSON object with a bunch of keys, and for each key, it creates a PointStyle object, and
   * adds it to a Map
   * @param externalStyles - This is the JSON object that contains the styles.
   * @returns A map of styles.
   */
  protected createStyles(externalStyles: Record<string, unknown>): Map<string, PointStyle> {
    const styles = new Map<string, PointStyle>();
    Object.keys(externalStyles).forEach(type => {
      const style = PointStyle.makeFromJSON(type, ObjectHelper.getObjectValue<Record<string, unknown>>(externalStyles, type)!);
      styles.set(type, style);
    });
    return styles;
  }

  /**
   * The function `setStyleFromPayload` sets styles based on external payload data and returns a map of
   * style types to their corresponding IDs.
   * @param externalStyles - The `externalStyles` parameter is a record object that contains style
   * information. It is of type `Record<string, unknown>`, which means it can have any number of
   * properties with string keys and unknown values. Each property represents a different style type.
   * @param [styleIdCounter=0] - The `styleIdCounter` parameter is a number that represents the current
   * count of style IDs. It is used to assign a unique ID to each style created in the `createStyles`
   * function. The default value is 0, but it can be overridden with a different number if needed.
   * @returns The function `setStyleFromPayload` returns a `Map` object that maps `null` or string
   * values to numbers.
   */
  protected setStyleFromPayload(externalStyles: Record<string, unknown>, styleIdCounter = 0): Map<null | string, number> {
    const styleTypeToId = new Map<null | string, number>();
    const stylesTypeToPointStyle = this.createStyles(externalStyles);
    stylesTypeToPointStyle.forEach((pointStyle, type) => {
      styleIdCounter++;
      this.stylesMasterMap.set(styleIdCounter, pointStyle);
      styleTypeToId.set(type, styleIdCounter);

      // set clustering on layer style by payload (if never saved on layer style)
      const style = this.stylable.getStyle();
      if (null != style && this.getStylableClustering(this.stylable) === null && pointStyle.getMarker() !== null) {
        style.setClustering(pointStyle?.getMarker()!.getClustering());
      }
    });
    return styleTypeToId;
  }

  /**
   * If the map is configured to use clustering, then create a cluster marker for each cluster of markers
   * @param {EposLeafletComponent} mapConfig - EposLeafletComponent - the map component
   * @param {Stylable} [stylable] - the Stylable object that contains the styling information for the
   * markers
   * @param [clustering=true] - boolean - whether or not to cluster the markers
   */
  protected tryAddClustering(mapConfig: EposLeafletComponent, stylable?: Stylable, clustering = true): void {

    const clusterOptions = new MarkerClusterOptions();
    if (stylable != null) {
      clusterOptions.iconCreateFunction = (cluster) => this.setClusterMarker(cluster, stylable);
    }
    clusterOptions.disableClusteringAtZoom = mapConfig.maxZoom;
    this.setClusteredMarkers(clustering, clusterOptions, clustering); // cluster everything!

  }

  /**
 * It creates a Leaflet marker from a payload marker
 * @param {Stylable} stylable - The object that contains the styling information.
 * @param {null | Marker} marker - null | Marker
 * @param latlng - L.LatLng
 * @returns A layer
 */
  protected createLeafletMarker(stylable: Stylable, marker: null | Marker, latlng: L.LatLng, bubblingMouseEvents: boolean): L.Layer {
    latlng = (null == latlng) ? L.latLng(0, 0) : latlng;

    // create custom marker from payload
    const mapMarker = this.createCustomMarker(stylable, marker);

    let layer: L.Layer;

    // if marker created
    if ((null != marker) && (mapMarker != null)) {
      const anchorLocation = this.convertAnchor(marker.getAnchor());
      mapMarker.setIconAnchor(anchorLocation);
      mapMarker.setTooltipAnchor(anchorLocation);

      // create marker layer
      layer = mapMarker.getMarker(latlng, bubblingMouseEvents);

    } else {

      layer = L.circleMarker(latlng, {
        radius: this.CIRCLE_MARKER_RADIUS_PX,
        weight: 1,
      });
    }

    // set custom pane to layer
    (layer as L.Marker).options.pane = this.id;

    return layer;
  }

  private getRandomicStyle(): Style {
    return defaultStyles[Math.floor(Math.random() * defaultStyles.length)];
  }

  /**
   * It returns the marker value of the marker, or the marker value of the stylable, or the marker value
   * of the options
   * @param {Marker | null} marker - Marker | null - the marker object
   * @param {Stylable} stylable - Stylable - the object that has the style
   * @returns The marker value.
   */
  private getMarkerValue(marker: Marker | null, stylable: Stylable): string {

    let markerValue = 'far fa-circle';
    if (marker !== null) {
      markerValue = marker.getMarkerValue();

      if (this.options.customLayerOptionMarkerOriginValue.get() === null) {
        // save payload marker value
        this.options.customLayerOptionMarkerOriginValue.set(marker.getMarkerValue());
      }
    }

    // marker value from stylable
    if (stylable.getStyle()?.getMarkerValue() && stylable.getStyle()?.getMarkerValue() !== '') {
      markerValue = stylable.getStyle()?.getMarkerValue() ?? '';
    }

    // to avoid many writes to localStorage
    if (this.options.customLayerOptionMarkerValue.get() === null) {
      this.options.customLayerOptionMarkerValue.set(markerValue);
    }

    return markerValue;
  }

  /**
   * It creates a legend item for a marker
   * @param {Stylable} stylable - The Stylable object that is being rendered.
   * @param {string} label - The label of the legend item.
   * @param {null | Marker} marker - null | Marker
   * @returns A legend item.
   */
  private createLegendMarkerItem(stylable: Stylable, label: string, marker: null | Marker): null | LegendItem {
    const mapMarker = this.createCustomMarker(stylable, marker, true);

    let legendItem: null | ElementLegendItem = null;
    if (mapMarker != null) {
      const icon = mapMarker.getIcon();
      icon.style.fontSize = '20px';
      const wrapper = document.createElement('span');
      wrapper.appendChild(icon);
      legendItem = new ElementLegendItem(label, wrapper);
    }

    return legendItem;
  }

  /**
   * It converts a value of type Anchor to a value of type AnchorLocation
   * @param {Anchor} anchor - The anchor location of the text.
   * @returns The AnchorLocation enum.
   */
  private convertAnchor(anchor: Anchor): AnchorLocation {
    switch (anchor) {
      case (Anchor.C): return AnchorLocation.CENTER;
      case (Anchor.N): return AnchorLocation.NORTH;
      case (Anchor.NE): return AnchorLocation.NORTH_EAST;
      case (Anchor.E): return AnchorLocation.EAST;
      case (Anchor.SE): return AnchorLocation.SOUTH_EAST;
      case (Anchor.S): return AnchorLocation.SOUTH;
      case (Anchor.SW): return AnchorLocation.SOUTH_WEST;
      case (Anchor.W): return AnchorLocation.WEST;
      case (Anchor.NW): return AnchorLocation.NORTH_WEST;
    }
  }

  /**
   * It takes a cluster and a stylable, and returns a Leaflet DivIcon that is styled according to the
   * stylable
   * @param cluster - L.MarkerCluster - the cluster to style
   * @param {Stylable} stylable - The object that contains the color information.
   * @returns A new L.DivIcon object.
   */
  private setClusterMarker(cluster: L.MarkerCluster, stylable: Stylable) {
    const childCount = cluster.getChildCount();

    let backColorHex = this.getStylableColor1(stylable, false);
    if (backColorHex.length === 6) {
      // 60% opacity
      backColorHex = backColorHex + '99';
    }

    return new L.DivIcon({
      html: `
            <span class="cluster-outer" style="background-color:#${backColorHex};">
              <div class="cluster-inner" style="background-color:#${backColorHex};">
                <span style="color:${this.getStylableColor2(stylable)};">${childCount}</span>
              </div>
            </span>
          `,
      className: 'marker-cluster',
      iconSize: new L.Point(40, 40)
    });
  }

  /**
   * It creates a custom marker for a given stylable object
   * @param {Stylable} stylable - Stylable, marker: null | Marker, legendMarker = false
   * @param {null | Marker} marker - null | Marker
   * @param [legendMarker=false] - boolean - if true, the marker will be used for the legend.
   * @returns A map marker
   */
  private createCustomMarker(stylable: Stylable, marker: null | Marker, legendMarker = false): null | MapMarker {
    let mapMarker: null | MapMarker = null;

    // size
    let size = this.SIZE_MARKER;
    if (stylable.getStyle()?.getMarkerIconSize() !== null && !legendMarker) {
      size = stylable.getStyle()?.getMarkerIconSize() ?? this.SIZE_MARKER;
    }

    const defaultMarker = new FaMarker()
      .configure(['fas', 'fa-map-marker'], this.getStylableColor1(stylable), size, size, 70);

    if (marker != null) {

      // marker value
      const markerValue = this.getMarkerValue(marker, stylable);

      if (marker.getPin()) {
        switch (marker.getMarkerType()) {
          case (MarkerType.FONT_AWESOME): {

            this.options.customLayerOptionMarkerType.set(MapLayer.MARKERTYPE_PIN_FA);

            mapMarker = defaultMarker
              .configureIcon(markerValue.split(' '), this.getStylableColor2(stylable));
            defaultMarker.setSize(size);

            break;
          }
          case (MarkerType.CHARACTER): {

            this.options.customLayerOptionMarkerType.set(MapLayer.MARKERTYPE_CHARACTER);

            mapMarker = defaultMarker
              .setIcon(() => {
                const element = document.createElement('span');
                element.innerHTML = markerValue;
                element.style.color = this.getStylableColor2(stylable);
                element.style.fontWeight = 'bold';
                element.style.fontSize = '50%';
                return element;
              });
            break;
          }
          case (MarkerType.IMAGE): {
            mapMarker = defaultMarker.setIcon(() => {
              const element = document.createElement('span');
              element.innerHTML = `<img src="${marker.getMarkerValue()}" style="max-width: 60%!important; max-height: 50%px!important;"/>`;
              return element;
            });
            break;
          }
          case (MarkerType.RAW): {

            const rawBase64Img = marker.getMarkerValue();
            const withMIME = `data:image/png;base64,${rawBase64Img}`;

            mapMarker = new RawIcon().configure(withMIME, size, size);

            this.options.customLayerOptionMarkerType.set(MapLayer.MARKERTYPE_RAW);

            break;
          }
        }
      } else {

        switch (marker.getMarkerType()) {
          case (MarkerType.FONT_AWESOME): {
            this.options.customLayerOptionMarkerType.set(MapLayer.MARKERTYPE_FA);

            mapMarker = new FaMarker()
              .configure(markerValue.split(' '), this.getStylableColor1(stylable), size, size, 70);

            break;
          }
          case (MarkerType.CHARACTER): {
            mapMarker = new CharacterIcon().configure(
              marker.getMarkerValue(),
              size,
              this.getStylableColor1(stylable),
            );
            break;
          }
          case (MarkerType.IMAGE): {

            mapMarker = new ImageIcon().configure(
              markerValue,
              size,
              size,
            );

            if (this.options.customLayerOptionColor.get() === null) {
              this.options.customLayerOptionColor.set('');
            }

            this.options.customLayerOptionMarkerType.set(MapLayer.MARKERTYPE_IMAGE);

            break;
          }
          case (MarkerType.RAW): {

            const rawBase64Img = marker.getMarkerValue();
            const withMIME = `data:image/png;base64,${rawBase64Img}`;

            mapMarker = new RawIcon().configure(withMIME, size, size);

            this.options.customLayerOptionMarkerType.set(MapLayer.MARKERTYPE_RAW);

            break;
          }
        }
      }
    }
    return mapMarker;
  }

  /**
   * It creates a legend item for a map layer
   * @param {Stylable} stylable - The Stylable object that contains the styling information for the
   * layer.
   * @param {string} label - The text that will be displayed in the legend
   * @param {'point' | 'line' | 'poly'} type - 'point' | 'line' | 'poly'
   * @returns A new ElementLegendItem
   */
  private createLegendOtherItem(stylable: Stylable, label: string, type: 'point' | 'line' | 'poly'): LegendItem {
    const icon = document.createElement('span');
    switch (type) {
      case (MapLayer.MARKERTYPE_POINT):
        // approximates the L.circleMarker created in createLeafletMarker method
        icon.style.backgroundColor = `#${this.getStylableColor2(stylable, false)}${FaMarker.percentToHex(this.getStylableFillOpacity(stylable) * 99)}`;
        icon.style.border = `1px solid #${this.getStylableColor1(stylable, false)}${FaMarker.percentToHex(this.getStylableOpacity(stylable) * 99)}`;
        icon.style.borderRadius = '50%';
        icon.style.width = '16px';
        icon.style.height = '16px';
        break;

      case (MapLayer.MARKERTYPE_LINE):
        icon.style.border = `1px solid #${this.getStylableColor1(stylable, false)}${FaMarker.percentToHex(this.getStylableOpacity(stylable) * 99)}`;
        icon.style.width = '0';
        icon.style.height = '16px';
        icon.style.transform = 'rotate(45deg)';
        break;
      case (MapLayer.MARKERTYPE_POLYGON):
        icon.style.backgroundColor = `#${this.getStylableColor2(stylable, false)}${FaMarker.percentToHex(this.getStylableFillOpacity(stylable) * 99)}`;
        icon.style.border = `2px solid #${this.getStylableColor1(stylable, false)}${FaMarker.percentToHex(this.getStylableOpacity(stylable) * 99)}`;
        icon.style.width = '14px';
        icon.style.height = '14px';
        icon.style.transform = 'rotate(45deg)';
        break;
    }
    const wrapper = document.createElement('span');
    wrapper.appendChild(icon);
    return new ElementLegendItem(label, wrapper);
  }


}

/** The above code is defining an enum called `MarkerType` in TypeScript. This enum has four possible
values: `IMAGE`, `FONT_AWESOME`, `CHARACTER` and 'RAW'. Enums are used to define a set of named constants,
in this case representing different types of markers. */
enum MarkerType {
  IMAGE,
  FONT_AWESOME,
  CHARACTER,
  RAW
}

/** The above code is defining an enum called "Anchor" in TypeScript. An enum is a way to define a set
of named constants. In this case, the enum "Anchor" has constants for different anchor positions,
such as "C" for center, "N" for north, "S" for south, "E" for east, "W" for west, and so on. These
constants can be used to represent anchor positions in a program. */
enum Anchor {
  C, N, S, E, W, NE, NW, SE, SW,
}


/** The `Marker` class represents a marker used for clustering and pinning on a map, with various
properties such as marker type, value, and anchor. */
export class Marker {

  /** The above code is defining a public static constant variable called DEFAULT_MARKER_PIN. It is of
  type Marker and is assigned a new instance of the Marker class. The Marker class constructor is
  called with the arguments true, true, Anchor.S, MarkerType.FONT_AWESOME, and 'fas fa-circle'. */
  public static DEFAULT_MARKER_PIN: Marker = new Marker(true, true, Anchor.S, MarkerType.FONT_AWESOME, 'fas fa-circle');

  /**
   * The constructor function takes in several parameters and assigns them to corresponding properties
   * of the class.
   * @param {boolean} clustering - A boolean value indicating whether clustering is enabled or not.
   * @param {boolean} pin - A boolean value indicating whether the marker should be pinned or not.
   * @param {Anchor} anchor - The `anchor` parameter is of type `Anchor` and represents the position of
   * the marker relative to its location.
   * @param {MarkerType} markerType - The `markerType` parameter is of type `MarkerType`. It represents
   * the type of marker to be used.
   * @param {string} markerValue - The `markerValue` parameter is a string that represents the value of
   * the marker.
   */
  constructor(   //
    private readonly clustering: boolean, //
    private readonly pin: boolean, //
    private readonly anchor: Anchor, //
    private readonly markerType: MarkerType, //
    private readonly markerValue: string) {
  }

  /**
   * The function takes a JSON object and creates a Marker object with properties based on the values
   * in the JSON.
   * @param json - The `json` parameter is an object that contains the properties needed to create a
   * `Marker` object.
   * @returns an instance of the `Marker` class.
   */
  public static makeFromJSON(json: Record<string, unknown>): Marker {

    // PIN
    let pin = ObjectHelper.getObjectValue<boolean>(json, 'pin');
    if (!ObjectHelper.isValidBoolean(pin)) {
      pin = Marker.DEFAULT_MARKER_PIN.pin;
    }

    // CLUSTERING
    let clustering = ObjectHelper.getObjectValue<boolean>(json, 'clustering');

    // if clustering is string ("true" | "True" | "false" | "False")
    if (typeof clustering === 'string') {
      clustering = ObjectHelper.booleanify(clustering);
    }

    if (!ObjectHelper.isValidBoolean(clustering)) {
      clustering = Marker.DEFAULT_MARKER_PIN.clustering;
    }

    // TYPE & VALUE
    let type: MarkerType = MarkerType.FONT_AWESOME;
    let value = ObjectHelper.getObjectValue<string>(json, 'fontawesome_class');
    if (!ObjectHelper.isValidString(value)) {
      type = MarkerType.CHARACTER;
      value = ObjectHelper.getObjectValue<string>(json, 'character');
      if (!ObjectHelper.isValidString(value)) {
        type = MarkerType.IMAGE;
        value = ObjectHelper.getObjectValue<string>(json, 'href');
        if(!ObjectHelper.isValidString(value)){
          type = MarkerType.RAW;
          value = ObjectHelper.getObjectValue<string>(json, 'raw');
          // DEFAULT TYPE AND VALUE
          if (!ObjectHelper.isValidString(value)) {
            value = Marker.DEFAULT_MARKER_PIN.markerValue;
            type = Marker.DEFAULT_MARKER_PIN.markerType;
          }
        }
      }
    }

    // ANCHOR (if pin == true, anchor always S)
    let anchor: Anchor = pin ? Anchor.S : Anchor.C;
    if (!pin) {
      const anchorAbbreviation = ObjectHelper.getObjectValue<string>(json, 'anchor');
      if (ObjectHelper.isValidString(value)) {
        anchor = Marker.anchorFromString(anchorAbbreviation, Anchor.C);
      }
    }

    return new Marker(Boolean(clustering), Boolean(pin), anchor, type, String(value));
  }

  private static anchorFromString(stringy: null | string, defaultAnchor: Anchor): Anchor {
    const temp = (stringy ?? '').toUpperCase().trim();
    const selectedAnchor = Anchor[temp] as Anchor;
    return selectedAnchor ?? defaultAnchor;
  }


  /**
   * The function returns a boolean value indicating whether clustering is enabled or not.
   * @returns The method is returning a boolean value, specifically the value of the variable
   * "clustering".
   */
  public getClustering(): boolean {
    return this.clustering;
  }

  /**
   * The function returns the value of the pin property.
   * @returns The method is returning the value of the variable "pin", which is a boolean.
   */
  public getPin(): boolean {
    return this.pin;
  }

  /**
   * The function returns the marker type.
   * @returns The method is returning the value of the variable `markerType`, which is of type
   * `MarkerType`.
   */
  public getMarkerType(): MarkerType {
    return this.markerType;
  }

  /**
   * The function returns the value of the marker.
   * @returns The method is returning a string value.
   */
  public getMarkerValue(): string {
    return this.markerValue;
  }

  /**
   * The function returns the anchor.
   * @returns The method is returning the value of the "anchor" property.
   */
  public getAnchor(): Anchor {
    return this.anchor;
  }
}


/** The PointStyle class represents the style of a point, including a label and an optional marker. */
class PointStyle {

  public static DEFAULT_POINT = new PointStyle('', null);

  /**
   * The constructor function takes a label string and an optional marker object and assigns them to
   * the corresponding properties of the class instance.
   * @param {string} label - The `label` parameter is a string that represents the label of an object.
   * @param {null | Marker} [marker=null] - The `marker` parameter is a nullable parameter of type
   * `Marker`. It is optional and can be assigned a value of `null` or an instance of the `Marker`
   * class.
   */
  constructor(
    public readonly label: string,
    private readonly marker: null | Marker = null,
  ) {
  }

  /**
   * The function `makeFromJSON` creates a `PointStyle` object from a JSON representation, including a
   * label and a marker.
   * @param {string} type - The `type` parameter is a string that represents the type of the point
   * style. It is used to set the label of the point style if no label is provided in the JSON object.
   * @param json - The `json` parameter is an object that contains the data needed to create a
   * `PointStyle` object. It is of type `Record<string, unknown>`, which means it can have any number
   * of properties with string keys and values of unknown type.
   * @returns an instance of the `PointStyle` class.
   */
  public static makeFromJSON(type: string, json: Record<string, unknown>): PointStyle {

    const labelJSON = ObjectHelper.getObjectValue<string>(json, 'label') === null ? ObjectHelper.getObjectValue<string>(json, 'Label') : ObjectHelper.getObjectValue<string>(json, 'label');
    let label = '';
    if (ObjectHelper.isValidString(labelJSON)) {
      label = labelJSON!;
    } else if (ObjectHelper.isValidString(type)) {
      label = type;
    }
    label = label.trim();

    const markerJSON = ObjectHelper.getObjectValue<Record<string, unknown>>(json, 'marker') === null ? ObjectHelper.getObjectValue<Record<string, unknown>>(json, 'Marker') : ObjectHelper.getObjectValue<Record<string, unknown>>(json, 'marker');
    let marker: null | Marker = null;
    if (markerJSON != null) {
      marker = Marker.makeFromJSON(markerJSON);
    }

    return new PointStyle(label, marker);
  }


  /**
   * The function "getMarker" returns either null or a Marker object.
   * @returns The method is returning either null or an instance of the Marker class.
   */
  public getMarker(): null | Marker {
    return this.marker;
  }
}



