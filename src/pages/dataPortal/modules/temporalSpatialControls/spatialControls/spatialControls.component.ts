import {
  Component,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { OnAttachDetach } from 'decorators/onAttachDetach.decorator';
import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { SimpleBoundingBox } from 'api/webApi/data/impl/simpleBoundingBox';
import { MapInteractionService } from 'utility/eposLeaflet/services/mapInteraction.service';
import { CONTEXT_RESOURCE } from 'api/api.service.factory';

@OnAttachDetach('onAttachComponents')
@Component({
  selector: 'app-spatial-controls',
  templateUrl: './spatialControls.component.html',
  styleUrls: ['./spatialControls.component.scss']
})
export class SpatialControlsComponent {
  @Output() setBBox = new EventEmitter<BoundingBox>();
  @Output() setEditableBBox = new EventEmitter<BoundingBox>();
  @Output() clearCountriesSelect = new EventEmitter<void>();
  @Output() resetGeolocation = new EventEmitter<void>();

  @Input() context: string = CONTEXT_RESOURCE;
  @Input() showApplyButton = true;
  @Input() showDrawButton = true;
  @Input() disabled = false;

  public currentBBox = SimpleBoundingBox.makeUnbounded();
  public editedBBox = SimpleBoundingBox.makeUnbounded();

  public boundsEdited = true;

  public northEdited = false;
  public eastEdited = false;
  public southEdited = false;
  public westEdited = false;

  public enableClearButton = false;

  constructor(
    private mapInteractionService: MapInteractionService,
  ) {
  }

  @Input()
  set bbox(bbox: BoundingBox) {
    if (null != bbox) {
      bbox.setId(this.context);
      this.currentBBox = bbox;
      this.editedBBox = bbox;
      this.evaluateState();
    }
  }

  public changeEditableBBox(bbox: BoundingBox): void {
    this.editedBBox = bbox;
    this.evaluateState();
  }

  public clearBBox(): void {
    this.changeEditableBBox(SimpleBoundingBox.makeUnbounded());
    this.resetGeolocation.emit();
    this.applyEdited(false);
  }

  /**
   * It emits the edited bounding box, clears the selected countries, and centers the map on the bounding
   * box
   * @param [center=true] - boolean - if true, the map will be centered on the bounding box
   */
  public applyEdited(center = true): void {
    this.editedBBox.setId(this.context);
    this.setBBox.emit(this.editedBBox);
    this.clearCountriesSelect.emit();

    if (center) {
      this.mapInteractionService.centerMapOnBoundingBox(this.editedBBox);
    }

    this.evaluateState();
  }

  private evaluateState(): void {

    this.northEdited = (this.editedBBox.getMaxLat() !== this.currentBBox.getMaxLat());
    this.eastEdited = (this.editedBBox.getMaxLon() !== this.currentBBox.getMaxLon());
    this.southEdited = (this.editedBBox.getMinLat() !== this.currentBBox.getMinLat());
    this.westEdited = (this.editedBBox.getMinLon() !== this.currentBBox.getMinLon());

    this.boundsEdited = (this.northEdited || this.eastEdited || this.southEdited || this.westEdited);

    this.enableClearButton = this.editedBBox.isBounded();

    const editableBBox = (this.boundsEdited)
      ? this.editedBBox
      : SimpleBoundingBox.makeUnbounded();

    editableBBox.setId(this.context);
    this.setEditableBBox.emit(editableBBox);
  }


}
