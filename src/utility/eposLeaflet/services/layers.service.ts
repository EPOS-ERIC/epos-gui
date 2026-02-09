import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { baseLayerOptions } from '../components/controls/baseLayerControl/baseLayerOptions';
import { BaseLayerOption, MapLayer } from '../eposLeaflet';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { Tracker } from 'utility/tracker/tracker.service';
import { TrackerAction, TrackerCategory } from 'utility/tracker/tracker.enum';

@Injectable()
export class LayersService {

  public static readonly INDEX_DEFAULT_BASEMAP = 1;

  public lastActiveBaseLayer = baseLayerOptions[LayersService.INDEX_DEFAULT_BASEMAP];

  private layersChangeSource = new BehaviorSubject<Array<MapLayer>>(new Array<MapLayer>());
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public layersChangeSourceObs = this.layersChangeSource.asObservable();

  private layerChangeSource = new BehaviorSubject<MapLayer | null>(null);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public layerChangeSourceObs = this.layerChangeSource.asObservable();

  private baseLayerChangeSource = new BehaviorSubject<BaseLayerOption | null>(null);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public baseLayerChangeSourceObs = this.baseLayerChangeSource.asObservable();

  private crsChangeSubject = new BehaviorSubject<string>('EPSG:3857');
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public crsChange$ = this.crsChangeSubject.asObservable();


  constructor(
    private readonly localStoragePersister: LocalStoragePersister,
    private readonly tracker: Tracker,
  ) { }

  public layersChange(layers: Array<MapLayer>): void {
    this.layersChangeSource.next(layers);
  }

  public layerChange(layer: MapLayer): void {
    this.layerChangeSource.next(layer);
  }

  /**
   * Updates the currently active base layer and persists the selection in local storage.
   *
   * This method performs the following actions:
   * 1. Emits the selected base layer via `baseLayerChangeSource` to notify subscribers (e.g., UI components or map controller).
   * 2. Resolves the CRS to be used for storage, based on:
   *    - the provided `crsCode` parameter (if defined),
   *    - a previously stored CRS in local storage,
   *    - or defaults to `'EPSG:3857'`.
   * 3. Persists the selected base layer name into local storage under the appropriate key,
   *    differentiating between arctic and default CRS modes.
   * 4. Tracks the selection event using the analytics tracker for telemetry or user behavior logging.
   * 5. Stores the selection as the `lastActiveBaseLayer` if the layer is valid and not `'None'`.
   *
   * @param {BaseLayerOption} layer - The base layer that was selected.
   * @param {string} [crsCode] - Optional CRS code (e.g., 'EPSG:3857', 'EPSG:3995') used to determine storage key.
   */
  public baseLayerChange(layer: BaseLayerOption, crsCode?: string): void {
    this.baseLayerChangeSource.next(layer);

    if (!crsCode) {
      const storedCRS = this.getStoredCRS();
      crsCode = storedCRS ?? 'EPSG:3857';
    }

    const storageKey = (crsCode === 'EPSG:3995')
      ? LocalStorageVariables.LS_BASEMAP_ARTIC_POLAR
      : LocalStorageVariables.LS_BASEMAP;

    this.localStoragePersister.set(
      LocalStorageVariables.LS_CONFIGURABLES,
      layer.name,
      false,
      storageKey
    );

    this.tracker.trackEvent(TrackerCategory.MAP, TrackerAction.BASEMAP, layer.name);

    if (layer != null && layer.name !== 'None') {
      this.lastActiveBaseLayer = layer;
    }
  }

  /**
   * Retrieves the most appropriate base layer for a given CRS, optionally using a stored preference.
   *
   * This method determines the active Coordinate Reference System (CRS) based on:
   * 1. The explicit `crsCode` parameter (if provided),
   * 2. A previously stored CRS value in local storage (`LS_MAP_CRS`),
   * 3. A default fallback of `'EPSG:3857'` if neither is available.
   *
   * Once the CRS is determined, the function attempts to retrieve the user’s
   * previously selected base layer from local storage (either `LS_BASEMAP` or `LS_BASEMAP_ARTIC_POLAR`).
   *
   * - If a valid and CRS-compatible base layer is found in storage, it is returned.
   * - If the stored layer is invalid or missing, a fallback base layer that supports
   *   the current CRS is returned.
   * - If no compatible fallback is found, it defaults to the globally defined
   *   base layer at `INDEX_DEFAULT_BASEMAP`.
   *
   * Warning messages are logged if the stored base layer is incompatible or missing.
   *
   * @param {string} [crsCode] - Optional CRS code (e.g., 'EPSG:3857', 'EPSG:3995').
   * @returns {BaseLayerOption} - The resolved base layer option for the given CRS.
   */
  public getBaseLayerFromStorage(crsCode?: string): BaseLayerOption {
    if (!crsCode) {
      const storedCRS = this.getStoredCRS();
      crsCode = storedCRS ?? 'EPSG:3857';
    }

    const storageKey =
      crsCode === 'EPSG:3995'
        ? LocalStorageVariables.LS_BASEMAP_ARTIC_POLAR
        : LocalStorageVariables.LS_BASEMAP;

    const storedLayerName = this.localStoragePersister.getValue(
      LocalStorageVariables.LS_CONFIGURABLES,
      storageKey
    ) as string | null;

    if (storedLayerName) {
      const selected = baseLayerOptions.find(
        o => o.name === storedLayerName && o.supportedCRS?.includes(crsCode!)
      );
      if (selected) {
        return selected;
      }
    }

    const fallback = baseLayerOptions.find(
      o => o.name !== 'None' && o.supportedCRS?.includes(crsCode!)
    );

    if (fallback) {
      return fallback;
    }

    return baseLayerOptions[LayersService.INDEX_DEFAULT_BASEMAP];
  }



  /**
   * The function `setLayerOrder` updates the order of layers in a map and stores the updated map in
   * local storage.
   * @param {string} layerId - The `layerId` parameter is a string that represents the unique identifier
   * of a layer.
   * @param {string | undefined} zIndex - The `zIndex` parameter is a string or undefined. It represents
   * the z-index value of the layer. If it is undefined, it means that the layer should be removed from
   * the layers map.
   * @param {Map<string, string> | null} [layers=null] - The `layers` parameter is a `Map` object that
   * represents the order of layers. Each key-value pair in the `Map` represents a layer, where the key
   * is the layer ID and the value is the layer's zIndex. The `layers` parameter is optional and can be
   * `null`.
   */
  public setLayerOrder(layerId: string, zIndex: string | undefined, layers: Map<string, string> | null = null): void {

    if (layers === null) {
      layers = this.getLayersOrderStorage();
    }

    if (zIndex !== undefined) {
      layers.set(layerId, zIndex);
    } else {
      layers.delete(layerId);
    }

    this.localStoragePersister.set(
      LocalStorageVariables.LS_CONFIGURABLES,
      JSON.stringify(Array.from(layers.entries())),
      false,
      LocalStorageVariables.LS_LAYERS_ORDER
    );

  }

  /**
   * This function retrieves the order of a layer by its ID from a storage.
   * @param {string} layerId - A string representing the ID of a layer.
   * @returns a string value or undefined. The string value is the layer order associated with the
   * given layerId, which is retrieved from the layers map using the get() method. If the layerId is
   * not found in the map, the function returns undefined.
   */
  public getLayerOrderById(layerId: string): string | undefined {
    const layers = this.getLayersOrderStorage();
    return layers.get(layerId);
  }

  /**
   * This function retrieves and returns a Map of layers order from local storage in TypeScript.
   * @returns a Map object that contains the layers order stored in the localStorage. The keys of the Map
   * are strings representing the layer IDs, and the values are also strings representing the order of
   * the layers.
   */
  public getLayersOrderStorage(): Map<string, string> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const layersJSon = JSON.parse(
      this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_LAYERS_ORDER) as string ?? '[]'
    );

    let layers: Map<string, string> = new Map();
    if (layersJSon !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      layers = new Map(layersJSon.map((obj: Map<string, string>) => [obj[0] as string, obj[1] as string]) as Map<string, string>);
    }

    return layers;
  }

  /**
   * Saves the visibility state (on/off) of a single layer in localStorage.
   * @param {string} layerId - The unique ID of the layer.
   * @param {boolean} isVisible - The visibility state (true for on, false for off).
   */
  public setArticOverlayLayerVisibility(layerId: string, isVisible: boolean): void {
    const visibilityMap = this.getArticOverlayLayersVisibilityStorage();
    visibilityMap.set(layerId, isVisible);

    this.localStoragePersister.set(
      LocalStorageVariables.LS_CONFIGURABLES,
      JSON.stringify(Array.from(visibilityMap.entries())),
      false,
      LocalStorageVariables.LS_OVERLAY_ARCTIC_LAYERS_VISIBILITY
    );
  }

  /**
   * Retrieves the map of all saved layer visibilities from localStorage.
   * @returns {Map<string, boolean>} A map with the layer ID as the key and the visibility state as the value.
   */
  public getArticOverlayLayersVisibilityStorage(): Map<string, boolean> {
    const visibilityJson = this.localStoragePersister.getValue(
      LocalStorageVariables.LS_CONFIGURABLES,
      LocalStorageVariables.LS_OVERLAY_ARCTIC_LAYERS_VISIBILITY
    ) as string | null;

    if (!visibilityJson) {
      return new Map<string, boolean>();
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsedData = JSON.parse(visibilityJson);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return new Map<string, boolean>(parsedData);
    } catch (e) {
      console.error('Error parsing layer visibility from storage', e);
      return new Map<string, boolean>();
    }
  }

  /**
   * The function `pruneLayersOrderStorage` removes any layers from local storage that are not present in
   * the `layersActive` array.
   * @param layersActive - An array of MapLayer objects representing the currently active layers.
   */
  public pruneLayersOrderStorage(layersActive: Array<MapLayer>): void {
    const layersLocalStorage = this.getLayersOrderStorage();
    layersLocalStorage.forEach((value, key) => {
      const layerFound = layersActive.find((layer: MapLayer) => {
        return layer.id === key;
      });
      if (layerFound === undefined) {
        this.setLayerOrder(key, undefined);
      }
    });
  }

  /**
   * Sets the current map CRS and updates the local storage and observable.
   * @param {string} crsCode - The CRS code to set (e.g., 'EPSG:3857').
   */
  public setCurrentMapCRS(crsCode: string): void {
    this.localStoragePersister.set(
      LocalStorageVariables.LS_CONFIGURABLES,
      crsCode,
      false,
      LocalStorageVariables.LS_MAP_CRS
    );
    this.crsChangeSubject.next(crsCode); // Notify CRS change
  }

  /**
   * Retrieves the stored CRS from local storage.
   * @returns {string | null} - The stored CRS code or null if not found.
   */
  public getStoredCRS(): string | null {
    return this.localStoragePersister.getValue(
      LocalStorageVariables.LS_CONFIGURABLES,
      LocalStorageVariables.LS_MAP_CRS
    ) as string | null;
  }

  /**
   * Notifies observers of a CRS change.
   * @param {string} crsCode - The CRS code to notify about.
   */
  public notifyCrsChange(crsCode: string): void {
    this.crsChangeSubject.next(crsCode);
  }


}
