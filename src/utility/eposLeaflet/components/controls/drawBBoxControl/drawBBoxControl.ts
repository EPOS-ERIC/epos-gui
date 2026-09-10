import * as L from 'leaflet';
import 'leaflet-draw';
import { BoundingBox } from '../../boundingBox';
import { SetMapComponentable } from '../../setMapComponentable';
import { EposLeafletComponent } from '../../eposLeaflet.component';
import { BehaviorSubject, Observable } from 'rxjs';
import { SpatialSelectionMode } from '../../radiusSelection';

export interface DrawnRadius {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

export class DrawBBoxControl extends L.Control.Draw implements SetMapComponentable {
  protected static drawOptions = {
    draw: {
      polyline: false,
      polygon: false,
      marker: false,
      circle: false,
      circlemarker: false,
      rectangle: {
        shapeOptions: {
          clickable: false,
          pane: 'overlayPane',
        },
      },
    },
  } as L.Control.DrawConstructorOptions;
  protected eposLeaflet: EposLeafletComponent;

  protected currentBbox = new BehaviorSubject<BoundingBox>(BoundingBox.makeUnbounded());
  protected leafletBBoxLayer: null | L.Layer;
  protected leafletWrapperLayer = new L.LayerGroup();
  protected drawnRadius: DrawnRadius | null = null;

  protected timeout: NodeJS.Timeout;
  protected setBboxArray = new Array<BoundingBox>();
  protected circleDrawActive = false;
  protected circleCenter: L.LatLng | null = null;
  protected circlePreview: L.Circle | null = null;
  protected circleCenterMarker: L.CircleMarker | null = null;
  protected circleRadiusLine: L.Polyline | null = null;
  protected circleRadiusTooltip: L.Tooltip | null = null;
  protected mapWasDraggable = false;

  constructor(protected isVisible = true) {
    super(DrawBBoxControl.drawOptions);
  }

  public addTo(leafletMapObj: L.Map): this {
    leafletMapObj.addLayer(this.leafletWrapperLayer);

    leafletMapObj.on('draw:drawstart', (e: L.LeafletEvent) => {
    });
    leafletMapObj.on('draw:canceled', (e: L.LeafletEvent) => {
      // set as a new object
      this.updateBBox(this.currentBbox.getValue());
    });
    // set the extents when the user has finished drawing
    leafletMapObj.on(L.Draw.Event.CREATED, (e: L.LeafletEvent) => {
      const drawEvent = e as unknown as L.DrawEvents.Created;
      if (drawEvent.layerType === 'circle') {
        const circle = drawEvent.layer as L.Circle;
        const center = circle.getLatLng();
        this.drawnRadius = {
          latitude: center.lat,
          longitude: center.lng,
          radiusKm: circle.getRadius() / 1000,
        };
      } else {
        this.drawnRadius = null;
      }
      const bounds = (drawEvent.layer as L.Circle | L.Polygon).getBounds();
      this.updateBBox(new BoundingBox(bounds.getNorth(), bounds.getEast(), bounds.getSouth(), bounds.getWest()));
    });
    super.addTo(leafletMapObj);

    setTimeout(() => {
      // if not visible hide control off screen
      const drawElement: null | HTMLElement = this.eposLeaflet.getElement().querySelector('.leaflet-draw');
      if (null != drawElement) {
        if (!this.isVisible) {
          drawElement.style.position = 'absolute';
          drawElement.style.left = '-999999999px';
        } else {
          const dottedSquare = document.createElement('div');
          dottedSquare.classList.add('dotted-square');
          drawElement.querySelector('.leaflet-draw-draw-rectangle')!.appendChild(dottedSquare);
        }
      }
    }, 500);
    return this;
  }

  public setMapComponent(eposLeaflet: EposLeafletComponent): this {
    this.eposLeaflet = eposLeaflet;
    return this;
  }

  public startDraw(mode: SpatialSelectionMode = 'bbox'): this {
    if (mode === 'radius') {
      this.startCircleDraw();
    } else {
      this.stopActiveCircleDraw();
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      (this.eposLeaflet.getElement().querySelector('.leaflet-draw-draw-rectangle span') as HTMLElement).click();
    }
    return this;
  }

  public stopDraw(): void {
    const circleDrawActive = this.circleDrawActive;
    this.stopActiveCircleDraw();
    if (circleDrawActive) {
      return;
    }
    // remove bbox control
    this.remove();

    setTimeout(() => {
      // readd bbox control
      this.addTo(this.eposLeaflet.leafletMapObj);
    }, 500);

  }

  public clearBoundingBox(): this {
    this.stopActiveCircleDraw();
    this.drawnRadius = null;
    this.setBoundingBox(null);
    return this;
  }
  public setBoundingBox(bbox: null | BoundingBox): this {
    bbox = null == bbox ? BoundingBox.makeUnbounded() : bbox;
    this.currentBbox.next(bbox);

    // clear old layer
    this.setBoundsDrawLayer(null);

    if (bbox.isBounded()) {
      if (this.drawnRadius !== null) {
        this.setBoundsDrawLayer(L.circle(
          [this.drawnRadius.latitude, this.drawnRadius.longitude],
          { radius: this.drawnRadius.radiusKm * 1000, pane: 'overlayPane' }
        ));
      } else {
        const rect = L.latLngBounds([
          [bbox.getMaxLat(), bbox.getMaxLon()],
          [bbox.getMinLat(), bbox.getMinLon()],
        ]);
        this.setBoundsDrawLayer(L.rectangle(rect, { pane: 'overlayPane' }));
      }
    }
    return this;
  }

  public getDrawnRadius(): DrawnRadius | null {
    return this.drawnRadius;
  }

  public getBoundingBox(): BoundingBox {
    return this.currentBbox.getValue();
  }
  public watchBoundingBox(): Observable<BoundingBox> {
    return this.currentBbox.asObservable();
  }

  public hideLayer(hide: boolean): this {
    if (null != this.leafletBBoxLayer) {
      if (hide) {
        if (this.leafletWrapperLayer.hasLayer(this.leafletBBoxLayer)) {
          this.leafletWrapperLayer.removeLayer(this.leafletBBoxLayer);
        }
      } else {
        this.leafletWrapperLayer.addLayer(this.leafletBBoxLayer);
      }
    }
    return this;
  }

  protected readonly finishCircleDraw = (): void => {
    const circle = this.circlePreview;
    const center = this.circleCenter;
    const radius = circle?.getRadius() ?? 0;

    if (circle === null || center === null || radius === 0) {
      this.removeCircleReleaseListeners();
      this.clearCircleMeasurement();
      this.setBoundsDrawLayer(null);
      this.circleCenter = null;
      this.circlePreview = null;
      return;
    }

    this.stopActiveCircleDraw(false);

    const bounds = circle.getBounds();
    this.drawnRadius = {
      latitude: center.lat,
      longitude: center.lng,
      radiusKm: radius / 1000,
    };
    this.updateBBox(new BoundingBox(bounds.getNorth(), bounds.getEast(), bounds.getSouth(), bounds.getWest()));
  };

  protected readonly startCircleRadius = (event: L.LeafletMouseEvent): void => {
    this.clearCircleMeasurement();
    this.circleCenter = event.latlng;
    this.circlePreview = L.circle(event.latlng, {
      radius: 0,
      interactive: false,
      pane: 'overlayPane',
    });
    this.setBoundsDrawLayer(this.circlePreview);
    this.circleRadiusLine = L.polyline([event.latlng, event.latlng], {
      color: '#f39c12',
      weight: 2,
      dashArray: '5, 5',
      interactive: false,
      pane: 'overlayPane',
    }).addTo(this.leafletWrapperLayer);
    this.circleCenterMarker = L.circleMarker(event.latlng, {
      radius: 4,
      color: '#f39c12',
      fillColor: '#ffffff',
      fillOpacity: 1,
      weight: 2,
      interactive: false,
      pane: 'overlayPane',
    }).addTo(this.leafletWrapperLayer);
    this.circleRadiusTooltip = L.tooltip({
      permanent: true,
      direction: 'right',
      offset: L.point(8, 0),
      className: 'radius-distance-tooltip',
      interactive: false,
    })
      .setLatLng(event.latlng)
      .setContent('0.00 km')
      .addTo(this.leafletWrapperLayer);
    document.addEventListener('pointerup', this.finishCircleDraw, true);
    document.addEventListener('mouseup', this.finishCircleDraw, true);
    document.addEventListener('touchend', this.finishCircleDraw, true);
    L.DomEvent.preventDefault(event.originalEvent);
  };

  protected readonly updateCircleRadius = (event: L.LeafletMouseEvent): void => {
    if (this.circleCenter !== null && this.circlePreview !== null) {
      const radius = this.eposLeaflet.leafletMapObj.distance(this.circleCenter, event.latlng);
      this.circlePreview.setRadius(radius);
      this.circleRadiusLine?.setLatLngs([this.circleCenter, event.latlng]);
      this.circleRadiusTooltip
        ?.setLatLng(event.latlng)
        .setContent(`${(radius / 1000).toFixed(2)} km`);
    }
  };

  protected startCircleDraw(): void {
    this.stopActiveCircleDraw();
    this.setBoundsDrawLayer(null);
    const map = this.eposLeaflet.leafletMapObj;
    this.circleDrawActive = true;
    this.mapWasDraggable = map.dragging.enabled();
    if (this.mapWasDraggable) {
      map.dragging.disable();
    }
    map.getContainer().style.cursor = 'crosshair';
    map.on('mousedown', this.startCircleRadius);
    map.on('mousemove', this.updateCircleRadius);
  }

  protected stopActiveCircleDraw(clearPreview = true): void {
    this.removeCircleReleaseListeners();
    this.clearCircleMeasurement();
    if (this.eposLeaflet !== undefined) {
      const map = this.eposLeaflet.leafletMapObj;
      map.off('mousedown', this.startCircleRadius);
      map.off('mousemove', this.updateCircleRadius);
      map.getContainer().style.cursor = '';
      if (this.mapWasDraggable) {
        map.dragging.enable();
      }
    }
    if (clearPreview) {
      this.setBoundsDrawLayer(null);
    }
    this.circleDrawActive = false;
    this.circleCenter = null;
    this.circlePreview = null;
    this.mapWasDraggable = false;
  }

  protected clearCircleMeasurement(): void {
    if (this.circleCenterMarker !== null) {
      this.leafletWrapperLayer.removeLayer(this.circleCenterMarker);
      this.circleCenterMarker = null;
    }
    if (this.circleRadiusLine !== null) {
      this.leafletWrapperLayer.removeLayer(this.circleRadiusLine);
      this.circleRadiusLine = null;
    }
    if (this.circleRadiusTooltip !== null) {
      this.leafletWrapperLayer.removeLayer(this.circleRadiusTooltip);
      this.circleRadiusTooltip = null;
    }
  }

  protected removeCircleReleaseListeners(): void {
    document.removeEventListener('pointerup', this.finishCircleDraw, true);
    document.removeEventListener('mouseup', this.finishCircleDraw, true);
    document.removeEventListener('touchend', this.finishCircleDraw, true);
  }

  protected updateBBox(bbox: BoundingBox): void {
    this.setBboxArray.push(bbox);
    clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      // set to last item that's not unbounded (if none then it will be unbounded)
      let bboxToSet = BoundingBox.makeUnbounded();
      while (!bboxToSet.isBounded() && this.setBboxArray.length > 0) {
        bboxToSet = this.setBboxArray.pop()!;
      }
      this.setBoundingBox(bboxToSet);
    }, 100);
  }

  /**
   * sets a drawn map layer to the map, or clears it if false
   * @param layer a drawn map layer or false
   */
  protected setBoundsDrawLayer(layer: null | L.Layer): void {
    if (layer == null) {
      if (null != this.leafletBBoxLayer) {
        this.leafletWrapperLayer.removeLayer(this.leafletBBoxLayer);
        this.leafletBBoxLayer = null;
      }
    } else {
      this.leafletBBoxLayer = layer;
      this.leafletWrapperLayer.addLayer(this.leafletBBoxLayer);
    }
  }
}
