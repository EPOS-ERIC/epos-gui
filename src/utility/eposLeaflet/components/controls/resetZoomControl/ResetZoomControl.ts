/* eslint-disable @typescript-eslint/member-ordering */

import * as L from 'leaflet';
import { AbstractControl } from '../abstractControl/abstractControl';
import { LayersService } from 'utility/eposLeaflet/services/layers.service';

export class ResetZoomControl extends AbstractControl {
  // Europe (as before)
  private readonly europeCenter: L.LatLngExpression = [54.0, -5.0];
  private readonly europeZoom = 4;

  // Arctic (EPSG:3995)
  private readonly arcticCenter: L.LatLngExpression = [90.0, 0.0];
  private readonly arcticZoom = 3; // tweak if you prefer tighter/wider view

  constructor(private readonly layersService: LayersService) {
    super({ position: 'topright' });
  }

  private isEPSG3995(crs: any): boolean {
    if (!crs) { return false; }
    if (typeof crs === 'string') { return crs.includes('3995'); }
    const code = (crs as any).code ?? (crs as any).options?.code;
    return typeof code === 'string' && code.toUpperCase() === 'EPSG:3995';
  }

  public onAdd(map: L.Map): HTMLElement {
    const controlContainer: HTMLElement = this.getControlContainerForActionOnly(
      'reset-zoom-control',
      'fa fa-compress',
      'Reset zoom and extent',
      () => {
        const crs = this.layersService.getStoredCRS?.();
        const isArctic = this.isEPSG3995(crs);

        const center = isArctic ? this.arcticCenter : this.europeCenter;
        const zoom = isArctic ? this.arcticZoom : this.europeZoom;

        map.flyTo(center, zoom, {
          animate: true,
          duration: 1.5,
          easeLinearity: 0.25,
        });
      }
    );

    return controlContainer;
  }
}
