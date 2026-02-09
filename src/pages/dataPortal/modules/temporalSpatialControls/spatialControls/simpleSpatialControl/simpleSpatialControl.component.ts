import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CONTEXT_RESOURCE } from 'api/api.service.factory';
import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { SimpleBoundingBox } from 'api/webApi/data/impl/simpleBoundingBox';

@Component({
  selector: 'app-simple-spatial-control',
  templateUrl: './simpleSpatialControl.component.html',
  styleUrls: ['./simpleSpatialControl.component.scss']
})
export class SimpleSpatialControlComponent {
  @Input() context = CONTEXT_RESOURCE;
  @Input() inputsDisabled = false;
  @Input() showClearButton = false;
  @Output() changeBBox = new EventEmitter<BoundingBox>();
  @Output() applyEdited = new EventEmitter<BoundingBox>();
  @Output() clearBBox = new EventEmitter<void>();

  public clearButtonEnabled = false;
  public maxLatNorth = '';
  public maxLonEast = '';
  public minLatSouth = '';
  public minLonWest = '';

  @Input()
  set bbox(value: BoundingBox) {
    if (null != value) {
      value.setId(this.context);
      this.setBbox(value);
    }
  }

  public onChange(): void {
    this.changeBBox.emit(SimpleBoundingBox.makeFromArray([
      this.maxLatNorth,
      this.maxLonEast,
      this.minLatSouth,
      this.minLonWest,
    ]));
  }

  public clearExtent(): void {
    this.clearBBox.emit();
  }

  public applyExtent(): void {
    this.applyEdited.emit();
  }

  private setBbox(bbox: BoundingBox): void {
    this.clearButtonEnabled = bbox.isBounded();
    this.maxLatNorth = (null == bbox.getMaxLat()) ? '' : bbox.getMaxLat().toString();
    this.maxLonEast = (null == bbox.getMaxLon()) ? '' : bbox.getMaxLon().toString();
    this.minLatSouth = (null == bbox.getMinLat()) ? '' : bbox.getMinLat().toString();
    this.minLonWest = (null == bbox.getMinLon()) ? '' : bbox.getMinLon().toString();
  }
}
