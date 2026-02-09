import * as L from 'leaflet';
import 'leaflet.markercluster';

import { MapLayer } from './mapLayer.abstract';
import { FaMarker } from '../marker/faMarker/faMarker';
import { MoveMethod } from '../moveMethod.enum';
import { FeatureDisplayItem } from '../featureDisplay/featureDisplayItem';
import { LayerWithMarkers } from './layerWithMarkers.interface';
import { ImageIcon } from 'utility/maplayers/imageIcon';


// https://github.com/Leaflet/Leaflet.markercluster
/** The class `MarkerClusterOptions` defines options for marker clustering in TypeScript. */
export class MarkerClusterOptions {

  /** The above code is setting the value of the variable `chunkedLoading` to `true`. */
  chunkedLoading = true;

  /** The above code is setting the value of the variable "showCoverageOnHover" to true in TypeScript. */
  showCoverageOnHover = true;

  /** The above code is defining a TypeScript variable called `disableClusteringAtZoom` with a type of
  `number` or `undefined`. */
  disableClusteringAtZoom: number | undefined;

  /** The above code is written in TypeScript and it sets the value of the variable "spiderfyOnMaxZoom" to
  true. */
  spiderfyOnMaxZoom = true;

  /** The above code is defining a variable `zoomToBoundsOnClick` and setting its value to `true`. */
  zoomToBoundsOnClick = true;

  /** The above code is defining a function called `iconCreateFunction` that takes a parameter `cluster`
  of type `L.MarkerCluster`. The function is expected to return either a `L.DivIcon` or a `L.Icon`
  object with options of type `L.IconOptions`. */
  iconCreateFunction: (cluster: L.MarkerCluster) => L.DivIcon | L.Icon<L.IconOptions>;
}

type customClusterClickFuncType = null | ((markers: Array<L.Marker>, clickEvent: L.LeafletMouseEvent) => void);

export class MarkerLayer extends MapLayer implements LayerWithMarkers {

  /** The above code is declaring a protected property called "markers" which is a Map object in
  TypeScript. The Map is used to store key-value pairs, where the keys are strings and the values are
  either L.Marker or L.CircleMarker objects. */
  protected markers = new Map<string, L.Marker | L.CircleMarker>();

  /** The above code is declaring a protected variable called "clusterLayer" of type L.MarkerClusterGroup. */
  protected clusterLayer: L.MarkerClusterGroup;

  /** The above code is declaring a protected property called `zOffset` of type `number` in a TypeScript
  class. */
  protected zOffset: number;

  /** The above code is written in TypeScript and declares a protected property called
  `zOffsetApplyTimeout` of type `NodeJS.Timeout`. */
  protected zOffsetApplyTimeout: NodeJS.Timeout;

  /** The above code is declaring a protected boolean variable named "isClustered" and initializing it
  with the value of false. */
  protected isClustered = false;

  /** The above code is declaring a protected variable named "clusterClickEnabled" and initializing it
  with the value of false. */
  protected clusterClickEnabled = false;

  /** The above code is declaring a protected property called `customClusterClickFunc` of type
  `customClusterClickFuncType`. */
  protected customClusterClickFunc: customClusterClickFuncType;

  /** The above code is declaring a protected property called "clusterOptions" of type
  "MarkerClusterOptions". */
  protected clusterOptions: MarkerClusterOptions;

  /** The above code is defining a protected property called "markerGroup" of type "L.LayerGroup" in a
  TypeScript class. */
  protected markerGroup: L.LayerGroup;

  /** The above code is defining a protected property called "defaultIcon" in a TypeScript class. The
  property can hold an object of type L.Icon or L.DivIcon. */
  protected defaultIcon: L.Icon | L.DivIcon;

  /**
   * The constructor function sets default options for a marker pane in TypeScript.
   * @param {string} id - The `id` parameter is a required string that represents the identifier for
   * the object being constructed. It is used to uniquely identify the object.
   * @param {string} [name] - The `name` parameter is an optional parameter of type string. It
   * represents the name of the object being constructed.
   */
  constructor(id: string, name?: string) {
    super(id, name);
    // Default options
    this.options.setOptions({
      pane: id,
      paneType: 'markerPane',
    });
  }

  /**
   * The function sets the default icon for a Leaflet map.
   * @param {L.Icon | L.DivIcon} icon - The `icon` parameter can be either an instance of `L.Icon` or
   * `L.DivIcon`.
   * @returns The method is returning the instance of the class on which it is called.
   */
  public setDefaultIcon(icon: L.Icon | L.DivIcon): this {
    this.defaultIcon = icon;
    return this;
  }

  /**
   * The `addMarker` function adds a marker to a map with specified coordinates, icon, tooltip, popup,
   * and event handlers.
   * @param {string} id - The `id` parameter is a string that represents the unique identifier for the
   * marker.
   * @param {number} lat - The `lat` parameter is the latitude coordinate of the marker's position. It
   * is a number value representing the latitude in decimal degrees.
   * @param {number} lon - The `lon` parameter represents the longitude coordinate of the marker's
   * position on the map.
   * @param {null | L.Icon | L.DivIcon} [icon=null] - The `icon` parameter is used to specify the icon
   * for the marker. It can be one of the following types:
   * @param {null | string | HTMLElement} [tooltip=null] - The `tooltip` parameter is used to specify
   * the tooltip content for the marker. It can be either a string or an HTMLElement. The tooltip is a
   * small pop-up that appears when the user hovers over the marker, providing additional information
   * or context.
   * @param {null | string | HTMLElement} [popup=null] - The `popup` parameter is used to specify the
   * content of the popup that appears when the marker is clicked. It can be a string or an
   * HTMLElement. If it is a string, it will be treated as plain text. If it is an HTMLElement, it can
   * contain any valid HTML content.
   * @param popupClick - The `popupClick` parameter is a function that will be called when the popup
   * associated with the marker is clicked. It takes an `event` parameter, which represents the click
   * event. This function can be used to perform any desired actions when the popup is clicked, such as
   * displaying additional information or triggering
   * @param markerClick - The `markerClick` parameter is a function that will be called when the marker
   * is clicked. It takes an `event` parameter which represents the click event. This function can be
   * used to perform any desired actions when the marker is clicked, such as displaying additional
   * information or triggering other events.
   * @returns The `addMarker` function returns the instance of the object on which it is called
   * (`this`).
   */
  public addMarker(
    id: string,
    lat: number,
    lon: number,
    icon: null | L.Icon | L.DivIcon = null,
    tooltip: null | string | HTMLElement = null,
    popup: null | string | HTMLElement = null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    popupClick = (event) => { },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    markerClick = (event) => { },
  ): this {
    const locObj = L.latLng(lat, lon);
    const marker = L.marker(locObj, { icon: this.getIcon(icon), bubblingMouseEvents: true } as L.MarkerOptions);

    return this.addLeafletMarker(id, marker, tooltip, popup, popupClick, markerClick);
  }

  /**
   * The `addLeafletMarker` function adds a marker to a Leaflet map with optional tooltip and popup
   * functionality.
   * @param {string} id - A unique identifier for the marker.
   * @param {L.Marker | L.CircleMarker} marker - The `marker` parameter is an instance of either
   * `L.Marker` or `L.CircleMarker` class from the Leaflet library. It represents a marker or circle
   * marker on the map.
   * @param {null | string | HTMLElement} [tooltip=null] - The `tooltip` parameter is used to specify
   * the tooltip content for the marker. It can be a string or an HTML element. If a tooltip is
   * provided and the marker does not already have a tooltip, the `marker.bindTooltip()` method is
   * called to bind the tooltip to the marker.
   * @param {null | string | HTMLElement} [popup=null] - The `popup` parameter is used to specify the
   * content of the popup that will be displayed when the marker is clicked. It can be a string or an
   * HTMLElement. If no popup content is provided, the popup will not be displayed.
   * @param popupClick - The `popupClick` parameter is a function that will be called when the popup
   * associated with the marker is clicked. It takes an event object as its parameter, which contains
   * information about the click event.
   * @param markerClick - The `markerClick` parameter is a function that will be called when the marker
   * is clicked. It takes an event object as its parameter, which contains information about the click
   * event.
   * @returns the instance of the class that it belongs to (`this`).
   */
  public addLeafletMarker(
    id: string,
    marker: L.Marker | L.CircleMarker,
    tooltip: null | string | HTMLElement = null,
    popup: null | string | HTMLElement = null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    popupClick = (event) => { },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    markerClick = (event) => { },
  ): this {
    // only bind if not already bound.
    if (tooltip != null && marker.getTooltip() == null) {
      marker.bindTooltip(tooltip);
    }

    const displayItem = new FeatureDisplayItem(null, () => popup, popupClick);
    // add a reference so that it can be used on cluster click
    // eslint-disable-next-line @typescript-eslint/dot-notation
    marker['featureDisplayItem'] = displayItem;

    // marker.bindPopup(popupElement);
    marker.on('click', (clickEvent: L.LeafletMouseEvent) => {
      const clickLatLng = [clickEvent.latlng.lat, clickEvent.latlng.lng] as [number, number];
      this.eposLeaflet.getLayerClickManager()?.displayFeatures(Promise.resolve([displayItem]), clickLatLng);
    });

    marker.addEventListener('click', markerClick);

    this.markers.set(id, marker);
    return this;
  }

  /**
   * The function returns an array of L.Marker or L.CircleMarker objects.
   * @returns An array of L.Marker or L.CircleMarker objects.
   */
  public getMarkers(): Array<L.Marker | L.CircleMarker> {
    return Array.from(this.markers.values());
  }

  /**
   * The clearMarkers function clears all markers and returns the instance of the class.
   * @returns The method is returning the instance of the class itself (this).
   */
  public clearMarkers(): this {
    this.markers.clear();
    return this;
  }

  /**
   * The function sets the clustering options for a marker, including enabling/disabling clustering,
   * customizing cluster click functionality, and setting cluster options.
   * @param [clustered=true] - The "clustered" parameter is a boolean value that determines whether
   * clustering should be enabled or not. If set to true, clustering will be enabled. If set to false,
   * clustering will be disabled.
   * @param clusterOptions - The `clusterOptions` parameter is an object that contains options for
   * configuring the behavior of the marker clustering feature. It is an optional parameter and if not
   * provided, a default `MarkerClusterOptions` object will be used.
   * @param [enableClusterClickFeatureIdentify=false] - This parameter determines whether the feature
   * identification is enabled when clicking on a cluster. If set to true, the feature identification
   * will be disabled. If set to false, the feature identification will be enabled.
   * @param {customClusterClickFuncType} [customClusterClickFunc=null] - The parameter
   * "customClusterClickFunc" is a function that can be passed as an argument to customize the behavior
   * when a cluster is clicked. It is of type "customClusterClickFuncType".
   * @returns the instance of the class that the method belongs to.
   */
  public setClustered(
    clustered = true,
    clusterOptions = new MarkerClusterOptions(),
    enableClusterClickFeatureIdentify = false,
    customClusterClickFunc: customClusterClickFuncType = null,
  ): this {
    this.isClustered = clustered;
    this.clusterClickEnabled = enableClusterClickFeatureIdentify;
    this.customClusterClickFunc = customClusterClickFunc;
    this.clusterOptions = {
      ...clusterOptions,
      zoomToBoundsOnClick: enableClusterClickFeatureIdentify ? false : clusterOptions.zoomToBoundsOnClick,
    };
    return this;
  }

  /**
   * The function `getClusterLayer` returns a Leaflet MarkerClusterGroup with a click event handler
   * that retrieves all the marker layers within the clicked cluster.
   * @returns an instance of the `L.MarkerClusterGroup` class.
   */
  public getClusterLayer(): L.MarkerClusterGroup {
    const clusterLayer = L.markerClusterGroup(this.clusterOptions);
    // Cluster Layer click returns all the marker layers
    // let currentPopup;
    clusterLayer.on('clusterclick', (clickEvent: L.LeafletMouseEvent) => {
      if (this.clusterClickEnabled) {
        const targetLayer = (clickEvent as unknown as L.LayerEvent).layer as L.MarkerClusterGroup;
        const markers = targetLayer.getAllChildMarkers();
        if (null != this.customClusterClickFunc) {
          this.customClusterClickFunc(markers, clickEvent);
        } else {
          const clickLatLng = [clickEvent.latlng.lat, clickEvent.latlng.lng] as [number, number];
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/dot-notation
          const displayItems = markers.map((marker) => marker['featureDisplayItem']);

          this.eposLeaflet.getLayerClickManager()?.displayFeatures(Promise.resolve(displayItems) as Promise<Array<FeatureDisplayItem>>, clickLatLng);
        }
      }
    });
    return clusterLayer;
  }

  /**
   * The function `getLeafletLayer` returns a Promise that resolves to a Leaflet Layer, which is a
   * layer containing markers or clusters of markers on a Leaflet map.
   * @returns a Promise that resolves to a Leaflet Layer.
   */
  public getLeafletLayer(): Promise<L.Layer> {
    this.markerGroup = L.layerGroup([], this.options.getAll());
    this.markers.forEach((marker: L.Marker | L.CircleMarker) => {
      // marker.on('click', () => this.setZOffset())
      this.markerGroup.addLayer(marker);
    });

    let leafletMapLayer: L.Layer;
    if (this.isClustered) {
      this.clusterLayer = this.getClusterLayer();
      leafletMapLayer = this.clusterLayer;
    } else {
      leafletMapLayer = L.layerGroup();
    }

    // set up event handlers to keep z indexes in check
    const map = this.eposLeaflet.getLeafletObject();
    map.on('zoomend', () => this.setZOffset());
    map.on('moveeend', () => this.setZOffset());

    (leafletMapLayer as L.LayerGroup).addLayer(this.markerGroup);
    return Promise.resolve(leafletMapLayer);
  }

  /**
   * The `goToMarker` function moves the view to a specified marker on a map and optionally opens a
   * popup after a delay.
   * @param {string} markerId - A string representing the ID of the marker to go to.
   * @param moveMethod - The `moveMethod` parameter is an optional parameter that specifies how the map
   * should move to the marker. It has a default value of `MoveMethod.ZOOM`, which means the map will
   * zoom to the marker's location. Other possible values for `moveMethod` could be `MoveMethod.PAN
   * @param {number} [zoom] - The `zoom` parameter is an optional parameter that specifies the zoom
   * level to be set when moving to the marker. If no value is provided, the zoom level remains
   * unchanged.
   * @param [popupDelay=50] - The `popupDelay` parameter is the delay in milliseconds before opening
   * the marker's popup after the map has finished moving. It is optional and defaults to 50
   * milliseconds.
   * @returns the instance of the class (`this`) to allow for method chaining.
   */
  public goToMarker(markerId: string, moveMethod = MoveMethod.ZOOM, zoom?: number, popupDelay = 50): this {
    const marker = this.markers.get(markerId);
    if (marker != null) {
      this.eposLeaflet.moveView(marker.getLatLng().lat, marker.getLatLng().lng, moveMethod, zoom);

      if (popupDelay != null && this.eposLeaflet != null) {
        let timer;
        const leafletMap = this.eposLeaflet.getLeafletObject();
        const moveEndOpenMarkerFunc = () => {
          // use of timeout and cleartimeout makes the timeout function inactive
          // for popupDelay, in case moveend is triggered multiple times
          // in quick succession.
          if (timer != null) {
            clearTimeout(timer as string | number | NodeJS.Timeout);
          }
          timer = setTimeout(() => {
            leafletMap.off('moveend', moveEndOpenMarkerFunc);
            marker.openPopup();
          }, popupDelay);
        };
        leafletMap.on('moveend', moveEndOpenMarkerFunc);
      }
    }
    return this;
  }

  /**
   * The `setZOffset` function sets the z-index offset for markers on a map, taking into account
   * clustering and applying the offset after a delay.
   * @param {number} [index] - The `index` parameter is an optional number that represents the index
   * value for setting the `zOffset`. If the `index` is provided, the `zOffset` will be set to `index *
   * 100000`. If the `index` is not provided or is `null`, the `
   */
  public setZOffset(index?: number): void {
    if (null != index) {
      this.zOffset = index * 100000;
    }

    clearTimeout(this.zOffsetApplyTimeout);

    this.zOffsetApplyTimeout = setTimeout(() => {
      if (null != this.zOffset && null != this.markers) {
        const markers = Array.from(this.markers.values());

        const displayedMarkers =
          null == this.clusterLayer
            ? markers
            : markers
              .map((marker) => { if (marker instanceof L.Marker) { this.clusterLayer.getVisibleParent(marker); } })
              .filter((marker) => null != marker) // not null
              .filter((marker, thisIndex: number, array) => thisIndex === array.indexOf(marker)); // unique

        displayedMarkers.forEach((marker) => { if (marker instanceof L.Marker) { marker.setZIndexOffset(this.zOffset); } });
      }
    }, 100);
  }

  /**
   * The function `getIcon` returns an icon object based on the provided `iconOverride` or the default
   * icon if no override is provided.
   * @param {null | L.Icon | L.DivIcon} iconOverride - The `iconOverride` parameter is an optional
   * parameter that can be either `null`, an instance of `L.Icon`, or an instance of `L.DivIcon`. It is
   * used to override the default icon for a marker.
   * @returns The method is returning an instance of either `L.Icon` or `L.DivIcon`.
   */
  protected getIcon(iconOverride: null | L.Icon | L.DivIcon): L.Icon | L.DivIcon {
    if (iconOverride != null) {
      return iconOverride;
    } else if (this.defaultIcon != null) {
      return this.defaultIcon;
    } else {
      return new FaMarker().configureIcon(['fas', 'fa-circle'], '#ffffff');
    }
  }

  /**
   * The function updates the opacity of Leaflet markers based on a custom layer option.
   */
  protected updateLeafletLayerOpacity(): void {
    if (this.markers) {
      this.markers.forEach((marker: L.Marker | L.CircleMarker) => {
        if (marker instanceof L.Marker) {
          marker.setOpacity(this.options.customLayerOptionOpacity.get()!);
        }
      });
    }
  }

  /**
   * The function `updateLeafletLayerMarker` updates the markers of a Leaflet layer based on various
   * options and configurations.
   */
  protected updateLeafletLayerMarker(): this {
    if (this.markers) {
      this.markers.forEach((marker: L.Marker | L.CircleMarker) => {

        const type = this.options.customLayerOptionMarkerType.get()!;
        const value = this.options.customLayerOptionMarkerValue.get()!;
        const size = this.options.customLayerOptionMarkerIconSize.get()!;
        const color = this.options.customLayerOptionColor.get()!;
        const fillColor = this.options.customLayerOptionFillColor.get()!;

        if (type !== null && marker instanceof L.Marker) {
          if (type === MapLayer.MARKERTYPE_CHARACTER) {
            const icon = marker.options?.icon as FaMarker;

            icon.setColor(color);
            icon
              .setIcon(() => {
                const element = document.createElement('span');
                element.innerHTML = this.options.customLayerOptionMarkerValue.get()!;
                element.style.color = fillColor;
                element.style.fontWeight = 'bold';
                element.style.fontSize = '50%';
                return element;
              });

            icon.setSize(size);

            marker.setIcon(icon);

          } else if (type === MapLayer.MARKERTYPE_FA) {

            const icon = marker.options?.icon as FaMarker;
            icon.setFaClasses(value.split(' '));
            icon.setColor(color);
            if (size !== null) {
              icon.setSize(size);
            }

            marker.setIcon(icon);
          } else if (type === MapLayer.MARKERTYPE_PIN_FA) {
            const icon = marker.options?.icon as FaMarker;
            icon.configureIcon(value.split(' '), fillColor!);
            icon.setColor(color);
            if (size !== null) {
              icon.setSize(size);
            }
            marker.setIcon(icon);

          } else if (type === MapLayer.MARKERTYPE_IMAGE) {

            const icon = marker.options?.icon as ImageIcon;
            icon.configure(value, size, size);
            marker.setIcon(icon);

          } else {
            const icon = marker.options?.icon as FaMarker;

            const subIcon = icon.icon;
            if (subIcon !== undefined) {

              icon.configureIcon(subIcon.className.split(' '), fillColor!);
              marker.setIcon(icon);
            }
          }
        } else if (type !== null && marker instanceof L.CircleMarker) {
          if (type === MapLayer.MARKERTYPE_POINT) {

            const style = {
              color: color,
              opacity: this.options.customLayerOptionOpacity.get()!,
              fillColor: fillColor,
              fillOpacity: this.options.customLayerOptionFillColorOpacity.get()!,
              weight: this.options.customLayerOptionWeight.get()!,
            } as L.PathOptions;

            marker.setStyle(style);
          }
        }

      });
    }
    return this;
  }

  /**
   * The function brings a layer to the front by setting its z-offset.
   * @param {number} refIndex - The refIndex parameter is a number that represents the index of the
   * layer that you want to bring to the front.
   */
  protected bringLayerToFront(refIndex: number): void {
    this.setZOffset(refIndex);
  }
  /**
   * The function brings a layer to the back by setting its z-offset.
   * @param {number} refIndex - The refIndex parameter is a number that represents the reference index
   * of the layer that needs to be brought to the back.
   */
  protected bringLayerToBack(refIndex: number): void {
    this.setZOffset(refIndex);
  }

  /**
   * The function returns an array of HTMLElements by mapping over the values of a Map and filtering
   * out any null values.
   * @returns The method `getMarkerElements` returns an array of `HTMLElement` objects.
   */
  protected getMarkerElements(): Array<HTMLElement> {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    return Array.from(this.markers.values())
      .map((item) => item.getElement())
      .filter(item => null != item) as Array<HTMLElement>;
  }
}
