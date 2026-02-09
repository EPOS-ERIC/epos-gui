import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { Map as LMap } from 'leaflet';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MapLayer } from '../layers/mapLayer.abstract';
import { Subscription } from 'rxjs';
import { LayersService } from 'utility/eposLeaflet/services/layers.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { BaseLayerOption } from '../controls/public_api';
import { baseLayerOptions } from '../controls/baseLayerControl/baseLayerOptions';
import { Style } from 'utility/styler/style';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { GeoJSONImageOverlayMapLayer } from 'utility/maplayers/geoJSONImageOverlayMapLayer';

type WmsCrsRow = { layerName: string; crs: string; status: boolean };

@Unsubscriber('subscriptions')
@Component({
  selector: 'app-layer-control',
  templateUrl: './layerControl.component.html',
  styleUrls: ['./layerControl.component.scss']
})
export class LayerControlComponent implements OnInit {

  public selectedBaseLayerVal = '';

  public currentCRS: string = 'EPSG:3857';

  public orderedLayers: Array<MapLayer> = [];

  public arcticOverlays: Array<MapLayer> = [];

  public filteredBaseLayers: BaseLayerOption[] = [];

  public basemapToggled = true;

  protected subscriptions: Array<Subscription> = new Array<Subscription>();

  private _map: LMap;

  constructor(
    private layersService: LayersService,
    private cdr: ChangeDetectorRef
  ) {}

  get activeArcticOverlaysCount(): number {
    if (!this.arcticOverlays) {
      return 0;
    }
    // Counts the layers that are NOT hidden.
    return this.arcticOverlays.filter(layer => !layer.hidden.get()).length;
  }

  @Input() set map(map: LMap) {
    if (map) {
      this._map = map;
    }
  }

  ngOnInit(): void {
    // Retrieve stored CRS or use default
    this.currentCRS = this.layersService.getStoredCRS() ?? 'EPSG:3857';

    // Load and apply base layer for current CRS
    const baseMapStorage = this.layersService.getBaseLayerFromStorage(this.currentCRS);
    this.applyBaseLayerState(baseMapStorage);

    // Reactive subscriptions
    this.subscriptions.push(

      // CRS change → update current CRS and base layer
      this.layersService.crsChange$.subscribe((newCRS: string) => {
        this.currentCRS = newCRS;
        const updatedBaseMap = this.layersService.getBaseLayerFromStorage(newCRS);
        this.applyBaseLayerState(updatedBaseMap);

        // Re-trigger compatibility checks for current layers (new CRS)
        for (const layer of this.orderedLayers) {
          // reset pending promise to allow a fresh run for the new CRS
          if (this.isTileCrsCheckCapable(layer)) {
            layer.crsCheckReady = undefined;
          }
          // trigger (lazy) check; UI will update when the async finishes
          this.checkLayerCompatibility(layer);
        }
      }),

      // Layer changes → reorder visible layers
      this.layersService.layersChangeSourceObs.subscribe((layers: Array<MapLayer>) => {
        this.orderLayers(layers);

        // Trigger (lazy) compatibility checks for any new/updated layer
        for (const layer of this.orderedLayers) {
          this.checkLayerCompatibility(layer);
        }
      }),

      // Base layer change (e.g. via radio or toggle) → update state and options
      this.layersService.baseLayerChangeSourceObs.subscribe((basemap: BaseLayerOption) => {
        if (basemap) {
          this.applyBaseLayerState(basemap);
        }
      })
    );
  }

  public applyBaseLayerState(basemap: BaseLayerOption): void {
    this.selectedBaseLayer(basemap.name);
    this.basemapToggled = basemap.name !== 'None';

    this.filteredBaseLayers = baseLayerOptions.filter(
      b =>
        b.supportedCRS?.includes(this.currentCRS) ||
        b.name === basemap.name
    );
  }

  public drop(event: CdkDragDrop<MapLayer[]>): void {
    if (event.previousContainer === event.container) {
      this.changeOrder(event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  public selectedBaseLayer(selectedBaseLayer: string): void {
    this.selectedBaseLayerVal = selectedBaseLayer;
  }

  public updateEnable(event: MatSlideToggleChange): void {
    if (event.checked) {
      this.layersService.baseLayerChange(this.layersService.lastActiveBaseLayer, this.currentCRS);
      this.selectedBaseLayer((this.layersService.lastActiveBaseLayer as BaseLayerOption).name);

      if (this.arcticOverlays && this.arcticOverlays.length > 0) {
        this.arcticOverlays.forEach(layer => {
          layer.hidden.set(false);
          this.layersService.setArticOverlayLayerVisibility(layer.id, true);
        });
      }

    } else {
      const noneLayer = baseLayerOptions.find(b => b.name === 'None')!;
      this.layersService.baseLayerChange(noneLayer, this.currentCRS);
      this.selectedBaseLayer('None');

      if (this.arcticOverlays && this.arcticOverlays.length > 0) {
        this.arcticOverlays.forEach(layer => {
          layer.hidden.set(true);
          this.layersService.setArticOverlayLayerVisibility(layer.id, false);
        });
      }
    }
  }

  /**
   * Returns true if the layer is compatible with the current CRS.
   * Uses layer-internal check (WMS/WMTS) when available; otherwise falls back to supportsCRS if provided.
   * Triggers an async CRS check on first call for a given CRS.
   */
  public checkLayerCompatibility(layer: MapLayer): boolean {
    const targetCrs = (this.currentCRS ?? 'EPSG:3857').toUpperCase();

    // Fast path: default projection considered OK
    if (targetCrs === 'EPSG:3857') {
      return true;
    }

    // Tile-layer path (WMS or WMTS via duck-typing)
    if (this.isTileCrsCheckCapable(layer)) {
      const rowsForCrs: WmsCrsRow[] =
        layer.crsCompatibilityResults?.filter(r => (r.crs || '').toUpperCase() === targetCrs) ?? [];

      // If we already have results for this CRS, use them
      if (rowsForCrs.length > 0) {
        return rowsForCrs.every(r => r.status === true);
      }

      // Otherwise, trigger the async check once
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      if (!layer.crsCheckReady && typeof layer.checkCrsCompatibility === 'function') {
        layer.crsCheckReady = layer.checkCrsCompatibility(targetCrs)
          .then((rows: WmsCrsRow[]) => {
            // Merge results: keep other CRS rows, add/replace this CRS rows
            const others = (layer.crsCompatibilityResults ?? []).filter(
              r => (r.crs || '').toUpperCase() !== targetCrs
            );
            layer.crsCompatibilityResults = [...others, ...rows];
            // Refresh UI (especially with OnPush)
            this.cdr.markForCheck();
          })
          .catch(() => {
            // Swallow errors; stay optimistic to avoid blocking UI
          });
      }

      // Optimistic until results come back
      return true;
    }

    // Fallback for non tile layers: call supportsCRS if present
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const anyLayer = layer as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (typeof anyLayer.supportsCRS === 'function') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        return !!anyLayer.supportsCRS(targetCrs);
      } catch {
        return true;
      }
    }

    // Default: consider compatible
    return true;
  }

  /**
   * This function changes the order of layers in an array and updates their z-index on a map.
   * @param layers - An array of MapLayer objects representing the layers to be reordered.
   * @param {number} oldIndex - The index of the layer that needs to be moved from its current position.
   * @param {number} newIndex - The index where the moved layer should be placed in the array after it
   * has been moved.
   */
  protected changeOrder(layers: Array<MapLayer>, oldIndex: number, newIndex: number): void {
    if (layers.length > 0 && (oldIndex !== newIndex)) {
      const movedLayer = layers.splice(oldIndex, 1)[0];
      layers.splice(newIndex, 0, movedLayer);

      // order on map and persist order
      this.setZIndex(layers);

    }
  }

  /**
   * Type guard via duck-typing for tile layers (WMS/WMTS) exposing CRS-check fields.
   */
  private isTileCrsCheckCapable(layer: MapLayer): layer is MapLayer & {
    crsCheckReady?: Promise<void>;
    crsCompatibilityResults: WmsCrsRow[];
    checkCrsCompatibility?: (crs: string) => Promise<WmsCrsRow[]>;
  } {
    return !!layer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      && 'crsCompatibilityResults' in (layer as any)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      && Array.isArray((layer as any).crsCompatibilityResults);
  }

  /**
   * The function orders map layers based on their visibility and sets their z-index.
   * @param layersArray - An array of MapLayer objects that need to be ordered.
   */
  private orderLayers(layersArray: Array<MapLayer>): void {
    const visibleLayers = this.checkVisible(layersArray);

    this.orderedLayers = visibleLayers.filter(
      (layer: MapLayer) => layer.options.pane.get() !== 'arcticOverlays'
    );

    this.arcticOverlays = visibleLayers.filter(
      (layer: MapLayer) => layer.options.pane.get() === 'arcticOverlays'
    );
  }

  /**
   * The function `checkVisible` filters an array of `MapLayer` objects based on their visibility and
   * other conditions, and returns the filtered array.
   * @param layers - An array of MapLayer objects.
   * @returns an array of MapLayer objects that meet certain conditions.
   */
  private checkVisible(layers: Array<MapLayer>) {

    const layersImageOverlayExtra: Array<string> = [];

    const layersChecked = layers.filter((layer: MapLayer) => {

      if (layer.options.customLayerOptionPaneType.get() === 'geoJsonPane' &&
        !layer.options.customLayerOptionHasMarker.get() ||
        layer.options.pane.get() === 'tilePane') {
        return false;
      }

      // if layer is imageOverlay
      if (layer.options.customLayerOptionPaneType.get() === MapLayer.IMAGE_OVERLAY_LAYER_TYPE) {
        // add realId of layerImageOverlay to remove from list layers
        layersImageOverlayExtra.push((layer as GeoJSONImageOverlayMapLayer).getRealId());
      }

      return layer.visibleOnLayerControl.get() && layer.addedToMap.get();

    });

    return layersChecked.filter((layer: MapLayer) => {
      // remove extra imageOverlay layer
      return !layersImageOverlayExtra.includes(layer.id);
    });
  }

  /**
   * This function sets the z-index of map layers in reverse order and updates the layer's custom option
   * value.
   * @param layers - An array of MapLayer objects.
   */
  private setZIndex(layers: Array<MapLayer>): void {
    const layersOrder = this.layersService.getLayersOrderStorage();
    layers.slice().reverse().forEach((layer: MapLayer, index) => {

      if (layer !== null) {
        ++index;
        const pane = this._map.getPane(layer.id);
        if (pane !== undefined && pane !== null) {

          const zIndex = (index + Number(Style.ZINDEX_TOP)).toString();

          pane!.style.zIndex = zIndex;

          // persist zIndex value
          this.layersService.setLayerOrder(layer.id, zIndex, layersOrder);
          layer.options.customLayerOptionZIndex.set(zIndex);
          this.layersService.layerChange(layer);

        }
      }
    });
  }

}
