import * as L from 'leaflet';
import 'leaflet-draw';
import { BoundingBox } from '../../boundingBox';
import { SetMapComponentable } from '../../setMapComponentable';
import { EposLeafletComponent } from '../../eposLeaflet.component';
import { BehaviorSubject, Observable } from 'rxjs';

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
        },
      },
    },
  } as L.Control.DrawConstructorOptions;
  protected eposLeaflet: EposLeafletComponent;

  protected currentBbox = new BehaviorSubject<BoundingBox>(BoundingBox.makeUnbounded());
  protected leafletBBoxLayer: null | L.Layer;
  protected leafletWrapperLayer = new L.LayerGroup();

  protected timeout: NodeJS.Timeout;
  protected setBboxArray = new Array<BoundingBox>();

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
    leafletMapObj.on('draw:drawstop', (e: L.LeafletEvent) => {
      this.updateBBox(BoundingBox.makeUnbounded());
    });
    // set the extents when the user has finished drawing
    leafletMapObj.on(L.Draw.Event.CREATED, (e: L.LeafletEvent) => {
      const drawEvent = e as unknown as L.DrawEvents.Created;
      const bounds = (drawEvent.layer as unknown as L.Polygon).getBounds();
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

  public startDraw(): this {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    (this.eposLeaflet.getElement().querySelector('.leaflet-draw-draw-rectangle span') as HTMLElement).click();
    return this;
  }

  public stopDraw(): void {
    // remove bbox control
    this.remove();

    setTimeout(() => {
      // readd bbox control
      this.addTo(this.eposLeaflet.leafletMapObj);
    }, 500);

  }

  public clearBoundingBox(): this {
    this.setBoundingBox(null);
    return this;
  }
  public setBoundingBox(bbox: null | BoundingBox): this {
    bbox = null == bbox ? BoundingBox.makeUnbounded() : bbox;
    this.currentBbox.next(bbox);

    // clear old layer
    this.setBoundsDrawLayer(null);

    if (bbox.isBounded()) {
      const rect = L.latLngBounds([
        [bbox.getMaxLat(), bbox.getMaxLon()],
        [bbox.getMinLat(), bbox.getMinLon()],
      ]);
      this.setBoundsDrawLayer(L.rectangle(rect));
    }
    return this;
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
