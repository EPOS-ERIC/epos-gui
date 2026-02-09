import { Component, Input } from '@angular/core';
import { MapLayer } from 'utility/eposLeaflet/eposLeaflet';

@Component({
  selector: 'app-arctic-overlay-selection',
  templateUrl: './overlayArticLayer.component.html',
  styleUrls: ['./overlayArticLayer.component.scss']
})
export class OverlayArcticComponent {

  /**
   * Receives the array of Arctic layers to display,
   * passed from the parent component (LayerControlComponent).
   */
  @Input() layers: Array<MapLayer> = [];

  constructor() { }

}
