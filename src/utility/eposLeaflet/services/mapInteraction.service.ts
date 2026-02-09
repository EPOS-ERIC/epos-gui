import { Injectable } from '@angular/core';
import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { SimpleBoundingBox } from 'api/webApi/data/impl/simpleBoundingBox';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { LoadingService } from 'services/loading.service';
import { Accessor } from 'utility/accessor';
import { MapLayer } from '../eposLeaflet';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { WMTSLayerTableData } from '../eposLeaflet';




/** The MapInteractionService class provides methods for interacting with a map, such as setting the
spatial range, centering the map on a bounding box or coordinates, and triggering events when
clicking on the map. */
@Injectable()
export class MapInteractionService {

  static initialLatLng: [number, number] = [54.0, -5.0];
  static initialZoom = 4;

  public readonly startBBox = new Accessor<boolean>(false);
  public readonly centerMapBBox = new Accessor<BoundingBox>(SimpleBoundingBox.makeUnbounded());
  public readonly editableSpatialRange = new Accessor<BoundingBox>(SimpleBoundingBox.makeUnbounded());
  public readonly spatialRange = new Accessor<BoundingBox>(SimpleBoundingBox.makeUnbounded());
  public readonly mapBBox = new Accessor<BoundingBox>(SimpleBoundingBox.makeUnbounded());
  public readonly zoomLevel = new Accessor<null | number>(null);
  public readonly pointOnlayerTriggered = new Subject<null | Map<string, Array<number> | string>>();
  public readonly featureOnlayerToggle = new Subject<null | Map<string, Array<number> | string | boolean>>();
  public readonly updateStatusHiddenMarker = new Subject<boolean>();

  // set functionality "toggleOnMap" disabled on table panel
  public readonly toggleOnMapDisabled = new Subject<boolean>();

  public readonly overlayPane = new Subject<boolean>();

  public readonly propertyHiddenOnMap: Array<string | null> = [];

  public readonly bboxContext = new Accessor<string | null>(null);


  // Wmts Layer Storage
  public  wmtsLayerStorage = new BehaviorSubject<null | Map<string, WMTSLayerTableData>>(null);

  /**
   * The constructor function takes in a LoadingService and a LocalStoragePersister as parameters.
   * @param {LoadingService} loadingService - The `loadingService` parameter is an instance of the
   * `LoadingService` class, which is used to manage loading indicators or progress bars in the
   * application. It is likely used to show loading states when data is being fetched or processed
   * asynchronously.
   * @param {LocalStoragePersister} localStoragePersister - The `localStoragePersister` parameter in
   * the constructor is likely a service or class responsible for persisting data to the local storage
   * of the browser. It is marked as `private readonly`, indicating that it is a private member of the
   * class and cannot be accessed from outside the class. This parameter is used
   */
  constructor(
    public loadingService: LoadingService,
    private readonly localStoragePersister: LocalStoragePersister,
  ) {
  }

  /**
   * The function sets the spatial range and data search bounds based on the given bounding box, with
   * an option to force the update even if the bounding box is not bounded.
   * @param {BoundingBox} bbox - The parameter "bbox" is of type BoundingBox. It represents the
   * bounding box that will be used to set the spatial range.
   * @param [force=false] - The "force" parameter is a boolean value that determines whether to set the
   * bounding box spatial range even if the given bounding box is not bounded. If "force" is set to
   * true, the spatial range will be set regardless of whether the bounding box is bounded or not. If
   * "force" is
   */
  public setBoundingBoxSpatialRangeFromControl(bbox: BoundingBox, force = false): void {
    if (bbox.isBounded() || force) {
      this.spatialRange.set(bbox);
    }
  }

  // WMTS Layer Storage
  public getWmtsLayersMapStorageObs(): Observable<null | Map<string, WMTSLayerTableData>> {
    return this.wmtsLayerStorage.asObservable();
  }
  public setWmtsLayersMapStorage(layerMapStructure: null | Map<string, WMTSLayerTableData>): void {
    this.wmtsLayerStorage.next(layerMapStructure);
  }

  /**
   * The function "resetAll" resets various bounding boxes and flags to their initial values.
   */
  public resetAll(): void {
    const resetBbox = SimpleBoundingBox.makeUnbounded();
    this.startBBox.set(false);
    this.editableSpatialRange.set(resetBbox);
    this.spatialRange.set(resetBbox);
    this.mapBBox.set(resetBbox);
  }

  /**
   * The function "centerOnInitial" sets the center of the map to the initial latitude and longitude
   * coordinates.
   */
  public centerOnInitial(): void {
    this.centerMapBBox.set(
      new SimpleBoundingBox(
        MapInteractionService.initialLatLng[0],
        MapInteractionService.initialLatLng[1],
        MapInteractionService.initialLatLng[0],
        MapInteractionService.initialLatLng[1]
      )
    );
  }

  /**
   * The function "centerMapOnBoundingBox" sets the center of the map to the given bounding box.
   * @param {BoundingBox} bbox - The parameter `bbox` is of type `BoundingBox`.
   */
  public centerMapOnBoundingBox(bbox: BoundingBox): void {
    this.centerMapBBox.set(bbox);
  }

  // to reset the zoom level of the map to initial value (see 'initialZoom' property of this service)
  public resetZoomLevel(): void{
    this.zoomLevel.set(MapInteractionService.initialZoom);
  }

  /**
   * The function "clickOnMaps" triggers an event with information about a clicked point on a map.
   * @param {string} layerId - A string representing the ID of the layer on the map.
   * @param {string | null} propertyId - The propertyId parameter is a string or null value. It
   * represents the ID of a property associated with the map layer.
   * @param coordinates - The "coordinates" parameter is an array of numbers representing the latitude
   * and longitude values of a location on a map. It should have two elements, where the first element
   * is the latitude and the second element is the longitude.
   * @param {boolean} imageOverlay - The `imageOverlay` parameter is a boolean value that indicates
   * whether an image overlay should be displayed on the map. If `imageOverlay` is `true`, an image
   * overlay will be displayed. If `imageOverlay` is `false`, no image overlay will be displayed.
   */
  public clickOnMaps(layerId: string, propertyId: string | null, coordinates: Array<number>, imageOverlay: boolean): void {
    const pointsOnMap = new Map();
    pointsOnMap.set('layerId', layerId);
    pointsOnMap.set('coordinates', coordinates);
    pointsOnMap.set('propertyId', propertyId);
    pointsOnMap.set('imageOverlay', imageOverlay);
    this.pointOnlayerTriggered.next(pointsOnMap as null | Map<string, Array<number> | string>);
  }

  /**
   * The function `toggleFeature` toggles the visibility of a feature on a map by adding or removing
   * its property ID from an array.
   * @param {string} layerId - The `layerId` parameter is a string that represents the ID of the layer
   * on which the feature is located.
   * @param {string | null} propertyId - The `propertyId` parameter is a string that represents the ID
   * of a property. It can be either a valid string value or `null`.
   * @param {boolean} show - The `show` parameter is a boolean value that determines whether to show or
   * hide a feature on the map. If `show` is `true`, the feature will be shown on the map. If `show` is
   * `false`, the feature will be hidden on the map.
   * @param {boolean} imageOverlay - The `imageOverlay` parameter is a boolean value that indicates
   * whether the feature is an image overlay or not. If `imageOverlay` is `true`, it means the feature
   * is an image overlay. If `imageOverlay` is `false`, it means the feature is not an image overlay.
   */
  public toggleFeature(layerId: string, propertyId: string | null, show: boolean, imageOverlay: boolean): void {
    const pointsOnMap = new Map();
    pointsOnMap.set('layerId', layerId);
    pointsOnMap.set('propertyId', propertyId);
    pointsOnMap.set('show', show);
    pointsOnMap.set('imageOverlay', imageOverlay);

    // if show false add propertyId on propertyHiddenOnMap
    if (show === false) {
      this.propertyHiddenOnMap.push(propertyId);
    } else {
      this.propertyHiddenOnMap.forEach((_p, index) => {
        if (_p === propertyId) { this.propertyHiddenOnMap.splice(index, 1); }
      });
    }

    this.featureOnlayerToggle.next(pointsOnMap as null | Map<string, Array<number> | string>);
  }

  /**
   * The function `hideMarkerOnMap` hides markers on a map for specific property IDs within a given map
   * layer.
   * @param {MapLayer} layer - The `layer` parameter represents the map layer on which the markers are
   * displayed.
   * @param propertyIdToHide - The `propertyIdToHide` parameter is an array of strings that contains
   * the IDs of the properties on the map that need to be hidden.
   * @param [imageOverlay=false] - The `imageOverlay` parameter is a boolean flag that indicates
   * whether the marker to be hidden is an image overlay on the map. If `imageOverlay` is set to
   * `true`, it means that the marker to be hidden is an image overlay; otherwise, it is set to
   * `false`.
   */
  public hideMarkerOnMap(layer: MapLayer, propertyIdToHide: Array<string>, imageOverlay = false): void {
    propertyIdToHide.forEach(p => {
      this.toggleFeature(layer.id, p, false, imageOverlay);
    });
  }

  /**
   * The function `centerMapOnCoordinates` takes an array of coordinates and sets the map's bounding
   * box to center on those coordinates.
   * @param coordinates - The `coordinates` parameter is an array of numbers representing the latitude
   * and longitude values of a location. The first element of the array represents the latitude, and
   * the second element represents the longitude.
   */
  public centerMapOnCoordinates(coordinates: Array<number>): void {
    this.centerMapBBox.set(
      new SimpleBoundingBox(
        coordinates[1],
        coordinates[0],
        coordinates[1],
        coordinates[0]
      )
    );
  }

  /**
   * The function sets the value of the overlayPane variable to the given boolean value.
   * @param {boolean} val - The "val" parameter is a boolean value that determines whether the overlay
   * pane should be set or not.
   */
  public setOverlayPane(val: boolean): void {
    this.overlayPane.next(val);
  }

  public removeHiddenMarkerByLayerId(layerId: string, imageOverlay: boolean): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let dataSearchToggleOnMap: Array<string> = JSON.parse(this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_TOGGLE_ON_MAP) as string || '[]');

    dataSearchToggleOnMap.forEach(_v => {
      if (_v.indexOf(layerId) !== -1) {
        this.toggleFeature(layerId, _v, false, imageOverlay);
      }
    });

    // remove from LS
    dataSearchToggleOnMap = dataSearchToggleOnMap.filter(_v => _v.indexOf(layerId) === -1);

    this.localStoragePersister.set(
      LocalStorageVariables.LS_CONFIGURABLES,
      JSON.stringify(dataSearchToggleOnMap),
      false,
      LocalStorageVariables.LS_TOGGLE_ON_MAP
    );

    this.updateStatusHiddenMarker.next(true);
  }

}
