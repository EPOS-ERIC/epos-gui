import { Component, Injector, OnInit, ComponentFactoryResolver, ViewContainerRef } from '@angular/core';
import {
  MapLayer,
  BoundingBox as EposLeafletBoundingBox,
  EposLeafletComponent,
  DrawBBoxControl,
  SearchControl,
  CustomLayerControl,
  MoveMethod,
  FeatureDisplayItem,
  CrsPreset,
  WmtsTileLayer,
} from 'utility/eposLeaflet/eposLeaflet';
import { OnAttachDetach } from 'decorators/onAttachDetach.decorator';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MapLayerGenerator } from 'utility/maplayers/mapLayerGenerator';

import * as L from 'leaflet';
import 'leaflet-mouse-position';
import { SimpleBoundingBox } from 'api/webApi/data/impl/simpleBoundingBox';
import { DataConfigurable } from 'utility/configurables/dataConfigurable.abstract';
import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { Style } from 'utility/styler/style';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { DataConfigurableI } from 'utility/configurables/dataConfigurableI.interface';
import { MapInteractionService } from '../../../../utility/eposLeaflet/services/mapInteraction.service';
import { LayersService } from 'utility/eposLeaflet/services/layers.service';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';
import { GeoJSONMapLayer } from 'utility/maplayers/geoJSONMapLayer';
import { Stylable } from 'utility/styler/stylable.interface';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { GeoJSONImageOverlayMapLayer } from 'utility/maplayers/geoJSONImageOverlayMapLayer';
import { GeoJSONHelper } from 'utility/maplayers/geoJSONHelper';
import { Feature } from 'geojson';
import { PopupProperty } from 'utility/maplayers/popupProperty';
import { DataSearchConfigurablesServiceRegistry } from '../registryPanel/services/dataSearchConfigurables.service';
import { CONTEXT_FACILITY, CONTEXT_RESOURCE, CONTEXT_SOFTWARE } from 'api/api.service.factory';
import { DataSearchConfigurablesServiceResource } from '../dataPanel/services/dataSearchConfigurables.service';
import { ArcticSwitchControls } from 'utility/eposLeaflet/components/controls/ArcticSwitchControls/arcticSwitchControls';
import { EPSG_3995, RES_3995 } from 'utility/eposLeaflet/projections/custom-crs';
import { ExportMapAsImage } from 'utility/eposLeaflet/components/controls/exportMapAsImage/ExportMapAsImage';
import { ResetZoomControl } from 'utility/eposLeaflet/components/controls/resetZoomControl/ResetZoomControl';
import { ExportMapAsImageService } from 'utility/eposLeaflet/services/exportMapAsImageService.service';
import { DialogService } from 'components/dialog/dialog.service';
// map.component.ts (excerpt)
import { WmsCrsCheckService } from 'utility/eposLeaflet/services/wms-crs-check.service';
import { WmsCrsNotifierService } from 'utility/eposLeaflet/services/wms-crs-notifier.service';
import { DataSearchConfigurablesServiceSoftware } from '../softwarePanel/services/dataSearchConfigurables.service';
import { MeasureDistanceControl } from 'utility/eposLeaflet/components/controls/measureDistanceControl/measureDistanceControl';
import { HttpClient } from '@angular/common/http';
import { WmtsTileJSON as TileJSON } from 'api/webApi/data/wmtsTileJSON.interface';
import { WMTSFeatureIdentifier } from 'utility/maplayers/wmtsFeatureIdentifier';

import {
  ArcticContoursLayer,
  ArcticReferenceLayer,
  SmartGraticuleLayer,
} from 'utility/maplayers/arctic-layers';

@OnAttachDetach('onAttachComponents')
@Unsubscriber('subscriptions')
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit {
  public eposLeaflet: EposLeafletComponent;
  public bboxControl = new DrawBBoxControl(false);
  public crs = L.CRS.EPSG3857;
  public initialLatLng: [number, number];
  public initialZoom: number;
  public minZoom: number;
  public maxZoom: number;
  public currentDataConfigurables = new Array<DataConfigurableI>();
  public currentDataConfigurablesStyleSubs = new Map<string, Subscription>();
  public currentIdToMapLayerIdMap = new Map<string, Array<string>>();
  public previousCoverageLayerIdsString = '';
  public readonly maxZoom3995 = RES_3995.length - 1; // use full resolution range of RES_3995
  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();
  private measureControlInstance: MeasureDistanceControl | null = null;

  private readonly mapLayerGenerator: MapLayerGenerator;

  private readonly defaultEditBboxStyle = { color: '#007c41', weight: 3, opacity: 1, fillOpacity: 0.2, enable: true };
  private readonly defaultBboxStyle = { color: '#3388ff', fillColor: '#3388ff', weight: 3, opacity: 1, fillOpacity: 0.2, enable: true };
  private readonly defaultBboxStyleSecond = { color: '#ffff00', fillColor: '#ffff00', weight: 3, opacity: 1, fillOpacity: 0.2, enable: true };

  private bboxContext: string | null = null;
  private controls: L.Control[] = [];

  private readonly crsPresets = new Map<string, CrsPreset>([
    ['EPSG:3857', {
      initialLatLng: MapInteractionService.initialLatLng,
      initialZoom: MapInteractionService.initialZoom,
      minZoom: 2.5,
      maxZoom: 18,
      crs: L.CRS.EPSG3857,
    }],
    ['EPSG:3995', {
      initialLatLng: [90, 0],
      initialZoom: 3,
      minZoom: 2,
      maxZoom: RES_3995.length - 1,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      crs: EPSG_3995,
    }],
  ]);

  constructor(
    private injector: Injector,
    private readonly configurables: DataSearchConfigurablesServiceResource,
    private readonly configurablesRegistry: DataSearchConfigurablesServiceRegistry,
    private readonly configurablesSoftware: DataSearchConfigurablesServiceSoftware,
    private readonly mapInteractionService: MapInteractionService,
    private readonly layersService: LayersService,
    private readonly panelsEvent: PanelsEmitterService,
    private readonly localStoragePersister: LocalStoragePersister,
    private readonly wmsCheck: WmsCrsCheckService,
    private readonly wmsNotify: WmsCrsNotifierService,
    private componentFactoryResolver: ComponentFactoryResolver,
    private viewContainerRef: ViewContainerRef,
    private exportMapAsImageService: ExportMapAsImageService,
    private dialogService: DialogService,
    private http: HttpClient
  ) {
    this.mapLayerGenerator = MapLayerGenerator.make(injector);
    this.initialLatLng = MapInteractionService.initialLatLng;
    this.initialZoom = MapInteractionService.initialZoom;
  }

  /**
   * Returns true if the view (center/zoom) should be restored from storage for
   * the currently active CRS.
   */
  public get shouldRestoreView(): boolean {
    return this.layersService.getStoredCRS() === this.crs?.code;
  }


  ngOnInit(): void {
    const storedCRSCode = this.layersService.getStoredCRS() ?? 'EPSG:3857';
    const preset = this.crsPresets.get(storedCRSCode)!;
    this.crs = preset.crs;
    this.minZoom = preset.minZoom;
    this.maxZoom = preset.maxZoom;

    if (this.crs.code === 'EPSG:3995') {
      this.layersService.notifyCrsChange(this.crs.code);
    }
  }


  public onAttach(): void {
    if (this.eposLeaflet) {
      this.eposLeaflet.resized();
    }
  }

  /**
   * Entry-point invoked by the child EposLeafletComponent when the underlying
   * Leaflet map is ready. This is where we:
   *  - initialize UI controls,
   *  - configure CRS-dependent defaults (center/zoom/min-max zoom),
   *  - decide whether to restore the view from storage,
   *  - add base layers, and
   *  - set up subscriptions.
   */
  public leafletMapObjReady(eposLeaflet: EposLeafletComponent): void {
    this.eposLeaflet = eposLeaflet;

    // Apply the preset to the child component
    const preset = this.crsPresets.get(this.crs.code!)!;
    this.eposLeaflet.applyPreset(preset);

    // Decide whether to restore the view from storage
    this.eposLeaflet.restoreViewFromStorage = (this.layersService.getStoredCRS() === this.crs.code);

    // Add controls and layers
    this.initControls();
    const baseLayerFromStorage = this.layersService.getBaseLayerFromStorage(this.crs.code);
    this.eposLeaflet.addLayers(baseLayerFromStorage.getLayers());
    this.layersService.lastActiveBaseLayer = baseLayerFromStorage;

    // Initialize subscriptions
    this.initSubscriptions();
    // Call `removeAllControls` to remove all controls if needed
    this.exportMapAsImageService.removeControlsObservable.subscribe(() => {
      console.warn('Removing all controls');
      this.removeAllControls();
      document.querySelector('.geocoder-control')?.remove();
      document.querySelector('.search-clear')?.remove();
    });
    this.exportMapAsImageService.addControlsObservable.subscribe(() => {
      this.addAllControls();
    });
  }

  public removeAllControls(): void {
    const geocoderControl = document.querySelector('.geocoder-control') as HTMLElement | null;
    const searchClear = document.querySelector('.search-clear') as HTMLElement | null;
    const leafletRuller = document.querySelector('.leaflet-ruler') as HTMLElement | null;

    if (geocoderControl) {
      geocoderControl.style.visibility = 'hidden';
    }
    if (searchClear) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      searchClear.style.visibility = 'hidden';
    }
    if (leafletRuller) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      leafletRuller.style.visibility = 'hidden';
    }
    // Assuming this.controls is an array of Leaflet control objects
    this.controls.forEach(control => {
      if (control.getContainer()) {
        control.getContainer()!.style.visibility = 'hidden';
      }
    });
  }

  public addAllControls(): void {
    this.controls.forEach(control => {
      if (control.getContainer()) {
        control.getContainer()!.style.visibility = 'visible';
      }
    });
    const geocoderControl = document.querySelector('.geocoder-control') as HTMLElement | null;
    const searchClear = document.querySelector('.search-clear') as HTMLElement | null;
    const leafletRuller = document.querySelector('.leaflet-ruler') as HTMLElement | null;
    if (geocoderControl) {
      geocoderControl.style.visibility = 'visible';
    }
    if (searchClear) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      searchClear.style.visibility = 'visible';
    }
    if (leafletRuller) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      leafletRuller.style.visibility = 'visible';
    }
  }



  /**
   * (Re)creates and adds all Leaflet controls for the current map instance.
   * Also adds non-controllable, default layers based on the current CRS.
   */
  public initControls(): void {
    const controls: L.Control[] = [];

    this.manageArcticLayers();

    // Recreate every control to avoid stale references when the map is destroyed and rebuilt
    const bboxControl = new DrawBBoxControl(false);

    const arcticSwitchControl = new ArcticSwitchControls(
      this.eposLeaflet.crs.code === 'EPSG:3995',
      (useArctic: boolean) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        void this.switchToCRS(useArctic ? EPSG_3995 : L.CRS.EPSG3857);
      }
    );

    const mousePositionControl = L.control.mousePosition({ emptyString: 'Position' }).setPosition('topright');
    const searchControl = new SearchControl(false).setPosition('topright');
    const bboxcontrol = bboxControl.setPosition('topright');
    const zoomControl = L.control.zoom().setPosition('topright');
    const customLayerControl = new CustomLayerControl(this.injector).setPosition('topright');
    const exportMapAsImage = new ExportMapAsImage(this.injector, this.componentFactoryResolver, this.viewContainerRef, this.exportMapAsImageService, this.dialogService);
    this.measureControlInstance = new MeasureDistanceControl(this.dialogService);
    const scaleControl = L.control.scale({ metric: true, imperial: false, maxWidth: 200 }).setPosition('bottomright');
    const resetZoomControl = new ResetZoomControl(this.layersService).setPosition('topright');

    // Add all controls to the current map instance
    controls.push(
      mousePositionControl,
      searchControl,
      arcticSwitchControl,
      zoomControl,
      resetZoomControl,
      customLayerControl,
      scaleControl,
      bboxcontrol,
      exportMapAsImage,
      this.measureControlInstance
    );

    this.eposLeaflet.enableLayerClickManager();

    controls.forEach(c => this.eposLeaflet.addControl(c));

    this.controls = controls;

    // Update internal reference to bboxControl for other features
    this.bboxControl = bboxControl;
  }


  /**
   * Re-add or refresh layers originating from a given DataConfigurable when its
   * style changes, so the rendered appearance stays in sync with the model.
   */
  public refreshMapLayersOnStyleChange(dataConfigurable: DataConfigurable): void {
    this.eposLeaflet.getLayers().forEach((mapLayer: MapLayer) => {
      if (mapLayer.id.startsWith(dataConfigurable.id)) {
        this.addLayer(mapLayer);
      }
    });
  }

  public isArctic(): boolean {
    return this.crs?.code === 'EPSG:3995';
  }

  /**
   * The function `configurablesExecute` manages a list of data configurables by adding, removing, and
   * updating items based on certain conditions.
   * @param dataConfigurables - The `dataConfigurables` parameter is an array of objects that implement
   * the `DataConfigurableI` interface. These objects represent configurable data items with properties
   * such as `id`, `isMappable`, and `context`.
   * @param {string} context - The `context` parameter in the `configurablesExecute` function is a
   * string that is used to set the context for the data configurables. It is passed as an argument to
   * the function and is used to filter and manipulate the data configurables based on their context.
   */
  private configurablesExecute(dataConfigurables: Array<DataConfigurableI>, context: string) {

    // set context. TODO: move it on dataConfigurables creation logic
    dataConfigurables.map(conf => {
      conf.context = context;
    });

    // select only mappable configs
    const mappableConfigurables = dataConfigurables.filter((thisConfig: DataConfigurableI) => thisConfig.isMappable);

    // add items who are not in the current list
    const configsToAdd = mappableConfigurables.filter((thisConfig: DataConfigurableI) => {
      // find id in current configs
      const currentItem = this.currentDataConfigurables.find((testConfig: DataConfigurableI) => {
        return (testConfig === thisConfig && testConfig.context === context);
      });
      return (currentItem == null);
    });

    configsToAdd.forEach((thisConfig: DataConfigurable) => {
      this.addConfigDisplayItem(thisConfig);
    });

    // remove items who are not in the new list
    const configsToRemove = this.currentDataConfigurables.filter((thisConfig: DataConfigurableI) => {
      // find id in current configs
      const thisItem = (mappableConfigurables.find((testConfig: DataConfigurableI) => {
        return (testConfig.id === thisConfig.id && thisConfig.context === context);
      }));
      return (thisItem == null);
    });

    if (configsToRemove.length > 0) {
      this.removeConfigDisplayItems(configsToRemove, context);
    }

    const newDataArray = this.currentDataConfigurables.filter((conf) => {
      return conf.context !== context;
    });

    this.currentDataConfigurables = [...newDataArray, ...mappableConfigurables];

  }


  private initSubscriptions(): void {

    let previousBbox: EposLeafletBoundingBox;

    this.subscriptions.push(

      this.configurablesRegistry.watchAll().subscribe((dataConfigurables: Array<DataConfigurableI>) => {
        if (dataConfigurables !== null) {
          this.configurablesExecute(dataConfigurables, CONTEXT_FACILITY);
        }
      }),

      this.configurables.watchAll().subscribe((dataConfigurables: Array<DataConfigurableI>) => {
        if (dataConfigurables != null) {
          this.configurablesExecute(dataConfigurables, CONTEXT_RESOURCE);
        }
      }),

      this.configurablesSoftware.watchAll().subscribe((dataConfigurables: Array<DataConfigurableI>) => {
        if (dataConfigurables != null) {
          this.configurablesExecute(dataConfigurables, CONTEXT_SOFTWARE);
        }
      }),

      this.mapInteractionService.bboxContext.observable.subscribe((context: string | null) => {
        if (context !== null) {
          this.bboxContext = context;
        }
      }),

      this.mapInteractionService.centerMapBBox.observable.subscribe((bbox: BoundingBox) => {
        if (bbox.isBounded()) {
          // current zoomSnap and zoomDelta values (needed to reset to these after zoom)
          const originalZoomSnap = this.eposLeaflet.leafletMapObj.options.zoomSnap;
          const originalZoomDelta = this.eposLeaflet.leafletMapObj.options.zoomDelta;
          // setting more discrete steps when zooming on a service data
          this.eposLeaflet.leafletMapObj.options.zoomSnap = 0.6;
          this.eposLeaflet.leafletMapObj.options.zoomDelta = 0.9;

          this.eposLeaflet.leafletMapObj.fitBounds(
            [[bbox.getMinLat(), bbox.getMinLon()], [bbox.getMaxLat(), bbox.getMaxLon()]]);

          // resetting zoomSnap and zoomDelta
          this.eposLeaflet.leafletMapObj.options.zoomSnap = originalZoomSnap;
          this.eposLeaflet.leafletMapObj.options.zoomDelta = originalZoomDelta;
        }
      }),

      // for now, only used to reset zoom level to initial value (triggered from mapIntSer)
      this.mapInteractionService.zoomLevel.observable.subscribe((zoomLevel: null | number) => {
        if (zoomLevel !== null) {
          this.eposLeaflet.leafletMapObj.setZoom(zoomLevel);
        }
      }),

      this.mapInteractionService.startBBox.observable.subscribe((val: boolean) => {
        if (val) {
          this.bboxControl.startDraw();
          this.eposLeaflet.showPaneById('overlayPane');
        } else {
          this.bboxControl.stopDraw();
        }
      })
      ,
      this.bboxControl.watchBoundingBox().subscribe((newBounds: EposLeafletBoundingBox) => {

        if (this.bboxContext !== null) {
          newBounds.setId(this.bboxContext);

          // only if changed
          if (previousBbox !== newBounds) {
            previousBbox = newBounds;
            const newBox = this.normalizeBbox(newBounds);
            this.mapInteractionService.mapBBox.set(newBox);

            // check for WMTS layers: using this subscription in order to filter WMTS correctly (removing and readding the main Container WmtsTileLayer)
            const wmtsLayerStorage = this.mapInteractionService.wmtsLayerStorage.value;
            if (wmtsLayerStorage) {
              // check the active WMTS layers from map
              const activeLayers = this.eposLeaflet.getLayers().filter(l => l instanceof WmtsTileLayer) as Array<WmtsTileLayer>;

              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              let dataSearchToggleOnMap: Array<string> = JSON.parse(this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_TOGGLE_ON_MAP) as string || '[]');
              // then, first remove 'properties'(/WMTS sub-layers) from LocalStorage
              for (const value of wmtsLayerStorage.values()) {
                const toggleOnMapItem = dataSearchToggleOnMap.find(i => i === value.tableRowPropertyId);
                if (toggleOnMapItem != null) {
                  // remove from LS
                  dataSearchToggleOnMap = dataSearchToggleOnMap.filter(_v => _v !== value.tableRowPropertyId);
                }
              }
              // set localStorage
              this.localStoragePersister.set(
                LocalStorageVariables.LS_CONFIGURABLES,
                JSON.stringify(dataSearchToggleOnMap),
                false,
                LocalStorageVariables.LS_TOGGLE_ON_MAP
              );
              // empty legendsMap so that no overlapping with new legends when the layer gets readded
              const defaultLayer = this.eposLeaflet.getLayers().find(l => wmtsLayerStorage.get(l.id)?.isDefaultLayer);
              if (defaultLayer != null) {
                (defaultLayer as WmtsTileLayer).legendsMap.clear();
              }
              // then, remove all of them, except the default one which gets removed and readded
              activeLayers.forEach(wmtsLayer => {
                if (wmtsLayerStorage.has(wmtsLayer.id) && !wmtsLayerStorage.get(wmtsLayer.id)?.isDefaultLayer) {
                  this.eposLeaflet.removeLayerById(wmtsLayer.id);
                }
                else {
                  this.eposLeaflet.removeLayerById(wmtsLayer.id);
                  this.eposLeaflet.addLayer(wmtsLayer);
                }
              });
            }
          }
        }
      }),

      this.mapInteractionService.spatialRange.observable.subscribe((bbox: BoundingBox) => {

        if (!bbox.isBounded()) {
          if (this.bboxControl) {
            this.bboxControl.clearBoundingBox();
          }
        }

        void this.localStoragePersister.get(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_BBOX_STYLE).then((styleMapString: string) => {

          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const styleMap = styleMapString !== null ? new Map(Object.entries(JSON.parse(styleMapString))) : new Map();
          let style = JSON.stringify(this.defaultBboxStyle) as string;
          if (bbox.getId() === CONTEXT_FACILITY) {
            style = JSON.stringify(this.defaultBboxStyleSecond) as string;
          }
          if (styleMap.has(bbox.getId() + MapLayer.BBOX_LAYER_ID)) {
            style = JSON.stringify(styleMap.get(bbox.getId() + MapLayer.BBOX_LAYER_ID));
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          this.addBox(bbox, MapLayer.BBOX_LAYER_ID, JSON.parse(style));

          // hide overlayPane (leaflet interactive)
          this.eposLeaflet.hidePaneById('overlayPane');
          const overlayPanes = document.getElementsByClassName('leaflet-overlay-pane') as HTMLCollection;
          Array.from(overlayPanes).forEach((overlayPane: HTMLElement) => {
            const leafletInteractives = overlayPane.getElementsByClassName('leaflet-interactive');
            Array.from(leafletInteractives).forEach((_v: HTMLElement) => {
              _v.outerHTML = '';
            });
          });
        });

        // for filtering WMTS layers: if bbox is unbounded, which is i've removed the spatial filter, retrigger load of the layer (specifically needed to filter out layers again according to new spatialrange of the map)
        const wmtsLayerStorage = this.mapInteractionService.wmtsLayerStorage.value;
        if (wmtsLayerStorage) {

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          let dataSearchToggleOnMap: Array<string> = JSON.parse(this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_TOGGLE_ON_MAP) as string || '[]');
          for (const value of wmtsLayerStorage.values()) {
            const toggleOnMapItem = dataSearchToggleOnMap.find(i => i === value.tableRowPropertyId);
            if (toggleOnMapItem != null) {
              // remove from LS
              dataSearchToggleOnMap = dataSearchToggleOnMap.filter(_v => _v !== value.tableRowPropertyId);
            }
          }
          // set localStorage
          this.localStoragePersister.set(
            LocalStorageVariables.LS_CONFIGURABLES,
            JSON.stringify(dataSearchToggleOnMap),
            false,
            LocalStorageVariables.LS_TOGGLE_ON_MAP
          );
          // empty legendsMap so that no overlapping with new legends when the layer gets readded
          const defaultLayer = this.eposLeaflet.getLayers().find(l => wmtsLayerStorage.get(l.id)?.isDefaultLayer);
          if (defaultLayer != null) {
            (defaultLayer as WmtsTileLayer).legendsMap.clear();
          }

          const wmtsActiveLayers = this.eposLeaflet.getLayers().filter((mapLayer) => {
            return mapLayer instanceof WmtsTileLayer;
          });
          if (wmtsActiveLayers.length > 0) {
            wmtsActiveLayers.forEach((layer) => {
              // if not the default layer
              if (wmtsLayerStorage.has(layer.id) && !wmtsLayerStorage.get(layer.id)?.isDefaultLayer) {
                this.eposLeaflet.removeLayerById(layer.id);
              }
              // default
              else {
                this.eposLeaflet.removeLayerById(layer.id);
                this.eposLeaflet.addLayer(layer);
              }
            });
          }
        }
      }),

      /* Editing spatial bounding box. */
      this.mapInteractionService.editableSpatialRange.observable.subscribe((bbox: BoundingBox) => {
        this.addBox(bbox, MapLayer.BBOX_EDITABLE_LAYER_ID, this.defaultEditBboxStyle);
      }),

      this.layersService.layerChangeSourceObs.subscribe((layer: MapLayer) => {
        if (layer !== null) {

          // problem with imageOverlay suffix
          const realId = layer.id.replace(GeoJSONHelper.IMAGE_OVERLAY_ID_SUFFIX, '');

          const conf = this.configurables.get(realId);

          if (conf !== null) {
            const style = conf.getStyle();
            if (style !== null) {

              if (layer.options.customLayerOptionZIndex.get() !== null) {
                style.setZIndex(layer.options.customLayerOptionZIndex.get()!);
              }

              if (layer.options.customLayerOptionOpacity.get() !== null) {
                style.setOpacityColor1(layer.options.customLayerOptionOpacity.get()!);
              }

              if (layer.options.customLayerOptionColor.get() !== null) {
                style.setColor1(layer.options.customLayerOptionColor.get()!.substring(1));
              }

              if (layer.options.customLayerOptionFillColorOpacity.get() !== null) {
                style.setOpacityColor2(layer.options.customLayerOptionFillColorOpacity.get()!);
              }

              if (layer.options.customLayerOptionFillColor.get() !== null) {
                style.setColor2(layer.options.customLayerOptionFillColor.get()!.substring(1));
              }

              if (layer.options.customLayerOptionMarkerValue.get() !== null) {
                style.setMarkerValue(layer.options.customLayerOptionMarkerValue.get()!);
              }

              if (layer.options.customLayerOptionMarkerIconSize.get() !== null) {
                style.setMarkerIconSize(layer.options.customLayerOptionMarkerIconSize.get()!);
              }

              if (layer.options.customLayerOptionWeight.get() !== null) {
                style.setWeight(layer.options.customLayerOptionWeight.get()!);
              }

              if (layer.options.customLayerOptionClustering.get() !== null) {
                style.setClustering(layer.options.customLayerOptionClustering.get()!);
              }

              this.configurables.updateStyle(realId, style);

              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              const dataSearchToggleOnMap: Array<string> = JSON.parse(this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_TOGGLE_ON_MAP) as string || '[]');

              this.mapInteractionService.hideMarkerOnMap(layer, dataSearchToggleOnMap, false);
            }
          }
        }
      }),

      // if click on right sidenav bottom => close custom marker component
      this.panelsEvent.invokeTablePanel.subscribe(() => {
        this.eposLeaflet.closeLayerControl();
      }),

      // if custom marker component opened => close table data component
      this.eposLeaflet.layerControlOpened.subscribe((value: boolean) => {
        if (value === true) {
          this.panelsEvent.invokeTablePanelClose.emit();
        }
      }),

      // show or hide info on map (marker, image overlay, point, multiline...)
      this.mapInteractionService.featureOnlayerToggle.subscribe((featureOnLayer: Map<string, Array<number> | string | boolean>) => {
        const show = featureOnLayer.get('show');
        const propertyId = featureOnLayer.get('propertyId');
        const imageOverlay = featureOnLayer.get('imageOverlay');
        let layerId = featureOnLayer.get('layerId') as string;
        if (imageOverlay) {
          layerId += GeoJSONHelper.IMAGE_OVERLAY_ID_SUFFIX;
        }

        // NOTE: if property enabling/disabling is for a Wmts/Wms layer, the lines below will retrieve the id from the propertyId (where the id of the layer is being passed between "#" symbols)
        let customId = '';
        const propertyIdAsString = propertyId as string;
        const propertyIdTolayerId = propertyIdAsString.split('#')[0] as string;
        // it's all lowercase
        if (propertyIdTolayerId != null && propertyIdTolayerId !== '') {
          customId = propertyIdTolayerId as string;
        }
        // WMTS Layer Storage
        const WMTSLayerStorage = this.mapInteractionService.wmtsLayerStorage.value;

        // Activating WMTS layer (from table, using layerName because: layerName is the property used in the storage, remember that Table creation triggered Wmts/Wms layers only will have an ID after their first creation and, on destroy, no ID will be kept; in fact, layerID of distribution doesn't match with layerID of such created layers);
        if (show === true && WMTSLayerStorage != null && customId !== '' && WMTSLayerStorage.has(customId)) {

          const isDefaultLayer = WMTSLayerStorage.get(customId)?.isDefaultLayer || false;
          // if is Default Layer (= main/parent layer, first loaded) just set hidden=false
          if (isDefaultLayer) {
            const layers = this.eposLeaflet.getLayers();
            const mainLayer = layers.find(l => l.id === customId);
            if (mainLayer != null) {
              mainLayer.hidden.set(false);
            }
            return;
          }

          // info ("name" and "paneId") to pass to new layer
          let defaultLayerPaneId = '';
          let defaultLayerName = '';

          // default layer Id
          for (const [key, value] of WMTSLayerStorage.entries()) {
            if (value.isDefaultLayer === true) {
              defaultLayerPaneId = key;
              break;
            }
          }
          // default layer name
          const defaultMapLayer = this.eposLeaflet.getLayers().find(l => l.id === defaultLayerPaneId);
          if (defaultMapLayer != null) {
            defaultLayerName = defaultMapLayer.name;
          }

          const layerID = customId;
          const layerName = WMTSLayerStorage.get(customId)?.layerIdentifier || '';
          const style = WMTSLayerStorage.get(customId)?.style || '';
          const legendsURL = WMTSLayerStorage.get(customId)?.legendsURL || '';
          const tileMatrixSet = WMTSLayerStorage.get(customId)?.tileMatrixSet || '';

          const getTileJSONURLTemplate = WMTSLayerStorage.get(customId)?.tileJSONTemplate || '';
          const getTileJSONStyleReplaced: string = getTileJSONURLTemplate.replace('{style}', style);

          const featureInfoURLtemplate = WMTSLayerStorage.get(customId)?.featureInfoTemplate || '';

          this.http.get<TileJSON>(getTileJSONStyleReplaced)
            .toPromise()
            .then((res: TileJSON) => {
              const tileUrl = res.tiles[0];
              // if tileUrl is not empty, set the template
              if (tileUrl != null && tileUrl !== '') {

                const newWmtsTileLayer = new WmtsTileLayer(layerID, defaultLayerName, defaultLayerPaneId) // Important for Z-indexing: assigning the newly created layer to the main pane (the "defaultLayerPaneId")
                  // set the GetTileURL
                  .options.customURLTemplate.set(tileUrl);
                newWmtsTileLayer.setFeatureIdentifiable(new WMTSFeatureIdentifier(newWmtsTileLayer));
                newWmtsTileLayer.styleFromXML = style;
                newWmtsTileLayer.legendsURL = legendsURL;
                newWmtsTileLayer.getFeatureInfoBaseURL = featureInfoURLtemplate;
                newWmtsTileLayer.options.setOptions({ TILEMATRIXSET: tileMatrixSet });
                newWmtsTileLayer.options.setOptions({ LAYER: layerName });
                newWmtsTileLayer.visibleOnLayerControl.set(false);

                this.eposLeaflet.addLayer(newWmtsTileLayer);
              } else {
                console.error('TileJSON response does not contain valid tiles URL');
              }
            })
            .catch((e) => {
              console.error('Error fetching TileJSON: ', e);
            });
        }
        // Disabling WMTS Layer
        else if (show === false && WMTSLayerStorage != null && customId !== '' && WMTSLayerStorage.has(customId)) {
          const isDefaultLayer = WMTSLayerStorage.get(customId)?.isDefaultLayer || false;
          // if is Default Layer (main/parent layer, first loaded) set it to hidden=true
          if (isDefaultLayer) {
            const layers = this.eposLeaflet.getLayers();
            const mainLayer = layers.find(l => l.id === customId);
            if (mainLayer != null) {
              mainLayer.hidden.set(true);
            }
          }
          // remove the layer
          else {
            this.eposLeaflet.removeLayerById(customId);
          }
        }
        else {
          this.eposLeaflet.getLeafletObject().eachLayer((_l: MyLayer) => {

            if (_l !== undefined) {
              const options = _l.options;
              let elementOnMap: HTMLElement | undefined;

              if (options.pane === layerId) {

                // if propertyId on layer feature
                if (_l.feature !== undefined) {
                  const feature: Feature = _l.feature;
                  const properties = feature.properties;
                  if (properties !== null) {
                    if (properties[PopupProperty.PROPERTY_ID] === propertyId) {
                      // eslint-disable-next-line no-underscore-dangle
                      elementOnMap = _l._path;
                    }
                  }
                }
                else {

                  // if propertyId on layer options
                  if (options[PopupProperty.PROPERTY_ID] === propertyId) {

                    // eslint-disable-next-line no-underscore-dangle
                    elementOnMap = _l._icon;
                    if (elementOnMap === undefined) {
                      // eslint-disable-next-line no-underscore-dangle
                      elementOnMap = _l._image;
                    }
                    if (elementOnMap === undefined) {
                      // eslint-disable-next-line no-underscore-dangle
                      elementOnMap = _l._path;
                    }
                  }
                }

                if (elementOnMap !== undefined) {
                  if (show === false) {
                    elementOnMap.style.setProperty('display', 'none');
                  } else {
                    elementOnMap.style.removeProperty('display');
                  }
                }
              }
            }
          });
        }
      }),

      this.mapInteractionService.pointOnlayerTriggered.subscribe((pointOnLayer: Map<string, Array<number> | string>) => {

        const coordinates = pointOnLayer.get('coordinates');
        let layerId = pointOnLayer.get('layerId');
        const propertyId = pointOnLayer.get('propertyId');
        const imageOverlay = pointOnLayer.get('imageOverlay');
        const layerClickManager = this.eposLeaflet.getLayerClickManager();
        let lat = 0;
        let lng = 0;

        if (coordinates !== undefined && typeof layerId === 'string') {

          if (imageOverlay) {
            layerId += GeoJSONHelper.IMAGE_OVERLAY_ID_SUFFIX;
          }

          const layer = this.eposLeaflet.getLayers().find((l: MapLayer) => { return l.id === layerId; }) as GeoJSONMapLayer;

          if (layer !== undefined) {

            if (typeof coordinates[0] !== 'number') {
              lat = coordinates[0][1] as unknown as number;
              lng = coordinates[0][0] as unknown as number;
            } else {
              lat = coordinates[1] as unknown as number;
              lng = coordinates[0];
            }

            // move view with latitude offset
            const latOffset = -240 * Math.pow(0.5, this.eposLeaflet.getLeafletObject().getZoom()); // -240 * (1/2)^x
            this.eposLeaflet.moveView(lat, lng, MoveMethod.PAN, 10, latOffset, 0);

            // generate popup for feature propertyId
            layerClickManager?.displayFeatures(
              layer.getFeatureDisplayItemById(propertyId, layer.name) as Promise<Array<FeatureDisplayItem>>,
              [lat, lng]
            );
          }
        }
      }),
    );

  }

  private getBboxLatLngs(bbox: BoundingBox): Array<L.LatLng> {

    if (bbox.getMaxLon() < bbox.getMinLon() && bbox.getMaxLon() < 0) {
      // bbox on antimeridian
      return [
        L.latLng(bbox.getMaxLat(), bbox.getMinLon()),
        L.latLng(bbox.getMaxLat(), bbox.getMaxLon() + 360),
        L.latLng(bbox.getMinLat(), bbox.getMaxLon() + 360),
        L.latLng(bbox.getMinLat(), bbox.getMinLon())
      ];
    } else {
      return [
        L.latLng(bbox.getMaxLat(), bbox.getMinLon()),
        L.latLng(bbox.getMaxLat(), bbox.getMaxLon()),
        L.latLng(bbox.getMinLat(), bbox.getMaxLon()),
        L.latLng(bbox.getMinLat(), bbox.getMinLon())
      ];
    }
  }

  private addBox(bbox: BoundingBox, type: string, style: Record<string, unknown>): void {

    let id = type;

    if (bbox.getId() !== undefined) {
      id = bbox.getId() + type;
    }

    // Prevent removing the type layer
    this.eposLeaflet.removeLayerById(type);

    if (!bbox.isBounded()) {
      this.eposLeaflet.removeLayerById(id);
    } else {
      const latlngs = this.getBboxLatLngs(bbox);
      const geo = L.polygon(latlngs).toGeoJSON();

      if (style.color === null) {
        style = this.defaultBboxStyle;
        if (bbox.getId() === CONTEXT_FACILITY) {
          style = this.defaultBboxStyleSecond;
        }
      }

      const styleClass = new Style(style.color as string ?? '#3388ff');
      styleClass.setOpacityColor1(style.opacity as number);
      styleClass.setWeight(style.weight as number);
      styleClass.setEnable(style.enable as boolean);
      styleClass.setId(id);
      const stylable = new BboxStyle();
      stylable.setStyle(styleClass);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      const layer = new GeoJSONMapLayer(this.injector, id, id, stylable, () => new Promise((resolve) => {
        resolve(geo);
      }), this.eposLeaflet)
        .toggleable.set(true)
        .setGeoJsonData(geo)
        .setStylingFunction(() => style)
        .visibleOnLayerControl.set(true);

      let preBboxName = 'Data ';
      if (bbox.getId() === CONTEXT_FACILITY) {
        preBboxName = 'Facilities ';
      } else if (bbox.getId() === CONTEXT_SOFTWARE) {
        preBboxName = 'Software ';
      }


      layer.name = preBboxName + 'Spatial Filter';

      layer.options.customLayerOptionOpacity.set(style.opacity as number);
      layer.options.customLayerOptionMarkerType.set(MapLayer.MARKERTYPE_POLYGON);
      layer.options.customLayerOptionStylable.set(stylable);
      layer.options.customLayerOptionColor.set(style.color as string);
      layer.options.customLayerOptionFillColor.set(style.fillColor as string);
      layer.options.customLayerOptionFillColorOpacity.set(style.fillOpacity as number);
      layer.options.customLayerOptionWeight.set(style.weight as number);
      layer.options.customLayerOptionEnable.set(style.enable as boolean);

      this.addLayer(
        layer
      );
    }
  }

  private normalizeBbox(bbox: EposLeafletBoundingBox): BoundingBox {
    // ensure between -180 and +180
    const convertFunc = (num: number) => ((((num + 180) % 360) + 360) % 360) - 180;
    const roundFunc = (num: number, precDP = 5) => Math.round(num * Math.pow(10, precDP)) / Math.pow(10, precDP);

    if (this.bboxContext !== null) {
      bbox.setId(this.bboxContext);
    }

    return (!bbox.isBounded())
      ? SimpleBoundingBox.makeUnbounded()
      : new SimpleBoundingBox(
        roundFunc(bbox.getMaxLat()),
        roundFunc(convertFunc(bbox.getMaxLon())),
        roundFunc(bbox.getMinLat()),
        roundFunc(convertFunc(bbox.getMinLon())),
      );
  }


  private removeConfigDisplayItems(dataConfigurables: Array<DataConfigurableI>, context: string): void {
    dataConfigurables.forEach((dataConfigurable: DataConfigurable) => {
      const mapLayerIds = this.currentIdToMapLayerIdMap.get(dataConfigurable.id);
      // WMTS storage
      const wmtsLayerStorage = this.mapInteractionService.wmtsLayerStorage.value;

      if (null != mapLayerIds && dataConfigurable.context === context) {
        mapLayerIds.forEach((id: string) => {
          // if conf is a WMTS
          if (wmtsLayerStorage && wmtsLayerStorage.has(id)) {
            // clean both wmts storage and all related map layers
            for (const [key, value] of wmtsLayerStorage.entries()) {
              if (value.originatorConfig === id) {
                wmtsLayerStorage.delete(key);
                this.eposLeaflet.removeLayerById(key);
              }
            }
          }
          else {
            this.eposLeaflet.removeLayerById(id);
          }
        });

        this.removeConfigurableStyleSubscription(dataConfigurable.id);
        this.currentIdToMapLayerIdMap.delete(dataConfigurable.id);
      }
    });
  }

  private addLayer(mapLayer: MapLayer): void {
    // manually remove the legend so that it's regenerated
    // otherwise epos-leaflet map will re-use the cached legend (if available)
    this.eposLeaflet.addLayer(mapLayer);
  }


  private addConfigDisplayItem(dataConfigurable: DataConfigurable): void {

    // create map layer
    const mapLayers: Array<MapLayer> = this.mapLayerGenerator.createMapLayersFromConfigurable(dataConfigurable, this.eposLeaflet);

    const savedVisibilities = this.layersService.getArticOverlayLayersVisibilityStorage();

    // APPLICA LE PREFERENZE A OGNI LAYER APPENA CREATO
    mapLayers.forEach(layer => {
      const savedState = savedVisibilities.get(layer.id);
      if (savedState !== undefined) {
        layer.options.customLayerOptionStylable.get()?.getStyle()?.setEnable(savedState);
      }
    });

    // remove previous subscription
    this.removeConfigurableStyleSubscription(dataConfigurable.id);
    // add new subscription, which will add maplayer immediately
    let previousStyle = dataConfigurable.getStyle();
    this.currentDataConfigurablesStyleSubs.set(
      dataConfigurable.id,
      dataConfigurable.styleObs.subscribe((newStyle: Style) => {
        if ((newStyle != null) && (newStyle !== previousStyle)) {
          previousStyle = newStyle;
          this.refreshMapLayersOnStyleChange(dataConfigurable);
        }
      })
    );
    const mapLayerIds = new Array<string>();
    mapLayers.forEach((mapLayer: MapLayer) => {
      if (mapLayer instanceof GeoJSONImageOverlayMapLayer) {
        // remove geo image layer if empty
        mapLayer.setPostLayerAddFunction(() => {
          if ((mapLayer).isEmpty()) {
            this.eposLeaflet.removeLayerById(mapLayer.id);
          }
          return Promise.resolve();
        });
      }
      this.addLayer(mapLayer);

      mapLayerIds.push(mapLayer.id);
    });

    this.currentIdToMapLayerIdMap.set(dataConfigurable.id, mapLayerIds);

    // === Start the CRS check on WMS layers ===
    void this.runWmsChecksForLayers(mapLayers, this.crs.code);
  }


  private removeConfigurableStyleSubscription(id: string): void {
    if (this.currentDataConfigurablesStyleSubs.has(id)) {
      this.currentDataConfigurablesStyleSubs.get(id)!.unsubscribe();
      this.currentDataConfigurablesStyleSubs.delete(id);
    }
  }


  /**
   * Switches the underlying Leaflet map to a new Coordinate Reference System (CRS).
   * This method orchestrates the entire teardown and rebuild process to ensure a clean transition.
   *
   * @param crs The new L.CRS object to apply (e.g., L.CRS.EPSG3857 or a custom Proj.CRS).
   */
  private async switchToCRS(crs: L.CRS): Promise<void> {
    // Exit if the map component isn't ready or if we are already using the target CRS.
    if (!this.eposLeaflet || this.eposLeaflet.crs.code === crs.code) {
      return;
    }

    if (this.measureControlInstance) {
      this.measureControlInstance.stopMeasurement();
    }

    try {


      // --- STEP 1: CLEANUP & STATE CAPTURE ---

      // Explicitly clean up existing RxJS subscriptions and Leaflet controls to prevent memory leaks.
      this.destroySubscriptions();
      this.controls.forEach(control => control.remove());
      this.controls = [];

      this.mapInteractionService.startBBox.set(false);
      if (this.bboxControl) {
        this.bboxControl.clearBoundingBox();
      }
      this.mapInteractionService.mapBBox.set(SimpleBoundingBox.makeUnbounded());

      // Disable the click manager during the transition to prevent user interactions.
      this.eposLeaflet.disableLayerClickManager();

      // Take a snapshot of the current map state before destroying it.
      // This includes all visible data layers (non-base layers) and their Z-index order.
      const baseLayerIds = this.layersService.lastActiveBaseLayer.getLayers().map(layer => layer.id);
      const visibleDataLayers = this.eposLeaflet.getLayers().filter(layer => !baseLayerIds.includes(layer.id));
      const storedZIndices = this.layersService.getLayersOrderStorage();

      const snapshot = {
        visibleDataLayers,
        layerZIndices: storedZIndices,
      };

      // Remove all current layers (both base and data) from the map instance.
      // We use a dedicated method that avoids altering the persisted layer order in storage.
      [...baseLayerIds, ...snapshot.visibleDataLayers.map(l => l.id)].forEach(id => {
        this.eposLeaflet.removeLayerByIdCRS(id);
      });


      // --- STEP 2: REBUILD THE MAP ---

      // Get the appropriate view settings (center, zoom, etc.) for the target CRS from our presets.
      // This assumes you have defined `this.crsPresets` as suggested earlier.
      const preset = this.crsPresets.get(crs.code!)!;

      // Update zoom level
      this.minZoom = preset.minZoom;
      this.maxZoom = preset.maxZoom;

      // Apply the preset to the child EposLeafletComponent and persist the view settings in local storage.
      this.eposLeaflet.applyPreset(preset, { persist: true });

      // Recreate the Leaflet map instance with the new CRS. This is an async operation that
      // destroys the old map object and creates a fresh one.
      await this.eposLeaflet.reinitializeWithCRS(crs);


      // --- STEP 3: RESTORE THE STATE ---

      // Update the component's internal state to reflect the new CRS.
      this.crs = crs;

      // Load and apply the appropriate base layer for the new CRS from the LayersService.
      const newBaseLayer = this.layersService.getBaseLayerFromStorage(crs.code);
      this.layersService.baseLayerChange(newBaseLayer, crs.code);
      this.layersService.lastActiveBaseLayer = newBaseLayer;
      this.layersService.setCurrentMapCRS(crs.code!);

      // Restore all data layers, controls, and subscriptions onto the new map instance.
      this.restoreMapState(snapshot);

      // Asynchronously check WMS layers for compatibility with the new CRS.
      void this.runWmsChecksForLayers(snapshot.visibleDataLayers, crs.code);

    } catch (error) {
      console.error('Error switching CRS:', error);
      // As a fallback, re-enable the click manager to ensure the UI remains interactive.
      this.eposLeaflet.enableLayerClickManager();
    }
  }


  /**
   * Re-attaches previously visible data layers, restores their Z-index,
   * reinitializes controls and subscriptions, and finalizes the map state.
   *
   * @param snapshot An object containing the data layers and their Z-indices to restore.
   */
  private restoreMapState(snapshot: {
    visibleDataLayers: MapLayer[];
    layerZIndices: Map<string, string>;
  }): void {
    const map = this.eposLeaflet.getLeafletObject();

    // Loop through the data layers from the snapshot and add them back to the map.
    snapshot.visibleDataLayers.forEach(layer => {
      // Check if the layer is managed by a "DataConfigurable". If so, refresh it
      // to ensure its style and data are up-to-date. Otherwise, just re-add the layer.
      const conf = this.currentDataConfigurables.find(c => layer.id.startsWith(c.id));
      if (conf) {
        this.refreshMapLayersOnStyleChange(conf as DataConfigurable);
      } else {
        this.eposLeaflet.addLayer(layer);
      }

      // Restore the layer's Z-index to maintain the correct visual stacking order.
      // This is done by setting the zIndex style on the layer's corresponding map pane.
      const zIndex = snapshot.layerZIndices.get(layer.id);
      const pane = map.getPane(layer.id);
      if (pane && zIndex) {
        pane.style.zIndex = zIndex;
        layer.options.customLayerOptionZIndex.set(zIndex);
      }
    });

    // Recreate and re-add all UI controls (zoom, search, etc.) to the new map instance.
    this.initControls();

    // Re-establish all RxJS subscriptions for map interactions.
    this.initSubscriptions();

    // Finalize the process by ordering the map panes according to their z-index
    // and re-enabling the layer click manager for user interaction.
    this.eposLeaflet.orderLayerOnMap();
    this.eposLeaflet.enableLayerClickManager();
  }

  /**
   * Unsubscribes from all active RxJS subscriptions and clears the array.
   * This is a crucial cleanup step to prevent memory leaks when the component
   * logic is re-initialized, for example during a CRS switch.
   */
  private destroySubscriptions(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.length = 0; // Empty the array
  }

  /**
 * Manages the lifecycle of layers specific to the Arctic projection.
 * - If the map is in Arctic mode, creates and adds the layers.
 * - If the map is not in Arctic mode, ensures the layers are removed.
 */
  private manageArcticLayers(): void {
    // List of IDs of layers we manage
    const arcticLayerIds = [
      'arctic-contours',
      'arctic-reference',
      'smart-graticule'
    ];

    if (this.isArctic()) {
      // --- ARCTIC STATE: Add layers ---
      this.eposLeaflet.createPane('arcticOverlays', 200);

      const savedVisibilities = this.layersService.getArticOverlayLayersVisibilityStorage();

      const contourLayer = new ArcticContoursLayer(this.injector);
      const savedContourState = savedVisibilities.get(contourLayer.id);
      if (savedContourState !== undefined) {
        contourLayer.options.customLayerOptionStylable.get()?.getStyle()?.setEnable(savedContourState);
      }

      const referenceLayer = new ArcticReferenceLayer(this.injector);
      const savedReferenceState = savedVisibilities.get(referenceLayer.id);
      if (savedReferenceState !== undefined) {
        referenceLayer.options.customLayerOptionStylable.get()?.getStyle()?.setEnable(savedReferenceState);
      }

      const graticuleLayer = new SmartGraticuleLayer(this.injector);
      const savedGraticuleState = savedVisibilities.get(graticuleLayer.id);
      if (savedGraticuleState !== undefined) {
        graticuleLayer.options.customLayerOptionStylable.get()?.getStyle()?.setEnable(savedGraticuleState);
      }

      // 3. ADD THE LAYERS TO THE MAP, NOW THAT THEY ARE IN THE CORRECT STATE
      this.eposLeaflet.addLayer(contourLayer);
      this.eposLeaflet.addLayer(referenceLayer);
      this.eposLeaflet.addLayer(graticuleLayer);

    } else {
      // --- NON-ARCTIC STATE: Remove layers (if present) ---

      // This part acts as a safeguard. Even though `switchToCRS` already cleans
      // the map, this ensures that Arctic layers are never shown
      // on the global map.
      const currentLayers = this.eposLeaflet.getLayers();
      currentLayers.forEach(layer => {
        if (arcticLayerIds.includes(layer.id)) {
          this.eposLeaflet.removeLayerById(layer.id);
        }
      });
    }
  }

  /**
   * Run CRS compatibility checks for WMS layers when using non-default CRS and
   * notify the user about any incompatible layers.
   */
  private async runWmsChecksForLayers(layers: MapLayer[], crsCode?: string): Promise<void> {
    const targetCrs = crsCode ?? this.crs?.code ?? 'EPSG:3857';

    // Skip checks if default projection EPSG:3857
    if (targetCrs.toUpperCase() === 'EPSG:3857') {
      return;
    }

    const rows = await this.wmsCheck.runForLayers(layers, targetCrs);

    if (!rows.length) {
      return;
    }

    const notOk = rows.filter(r => !r.status);
    if (notOk.length > 0) {
      await this.wmsNotify.notifyIncompatibilities(
        notOk.map(r => ({
          layerName: r.layerName,
          subLayer: r.subLayer,
          crs: r.crs,
        }))
      );
    }
  }


}

class BboxStyle implements Stylable {

  private readonly styleSrc = new BehaviorSubject<null | Style>(null);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public readonly styleObs = this.styleSrc.asObservable();

  public setStyle(style: null | Style): void {
    this.styleSrc.next(style);
  }

  public getStyle(): null | Style {
    return this.styleSrc.value;
  }

}

interface MyLayer extends L.Layer {
  feature: Feature;
  _path: HTMLElement;
  _icon: HTMLElement;
  _image: HTMLElement;
}
