import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { OnAttachDetach } from 'decorators/onAttachDetach.decorator';
import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { SimpleBoundingBox } from 'api/webApi/data/impl/simpleBoundingBox';
import { MapInteractionService } from 'utility/eposLeaflet/services/mapInteraction.service';
import { CONTEXT_RESOURCE } from 'api/api.service.factory';
import { RadiusSelection, SpatialSelectionMode } from 'utility/eposLeaflet/components/radiusSelection';
import { RadiusSpatialControlComponent } from './radiusSpatialControl/radiusSpatialControl.component';

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
  @Input() radiusEnabled = false;

  @ViewChild(RadiusSpatialControlComponent) private radiusControl: RadiusSpatialControlComponent;

  public currentBBox = SimpleBoundingBox.makeUnbounded();
  public editedBBox = SimpleBoundingBox.makeUnbounded();

  public boundsEdited = true;

  public northEdited = false;
  public eastEdited = false;
  public southEdited = false;
  public westEdited = false;

  public enableClearButton = false;
  public mode: SpatialSelectionMode = 'bbox';
  public currentRadius: RadiusSelection | null = null;
  public editedRadius: RadiusSelection | null = null;

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
      if (!bbox.isBounded()) {
        this.mapInteractionService.clearRadiusSelection(this.context);
        this.currentRadius = null;
        this.editedRadius = null;
        this.radiusControl?.clear();
      } else {
        const radiusSelection = this.mapInteractionService.getRadiusSelection(this.context);
        this.currentRadius = radiusSelection !== null && radiusSelection.matchesBounds(bbox) ? radiusSelection : null;
        this.editedRadius = this.currentRadius;
        this.mode = this.currentRadius === null ? 'bbox' : 'radius';
      }
      this.mapInteractionService.clearEditableRadiusSelection(this.context);
      this.evaluateState();
    }
  }

  public changeEditableBBox(bbox: BoundingBox): void {
    this.editedRadius = null;
    this.mapInteractionService.clearEditableRadiusSelection(this.context);
    this.editedBBox = bbox;
    this.evaluateState();
  }

  public changeEditableRadius(selection: RadiusSelection | null): void {
    this.editedRadius = selection;
    if (selection === null) {
      this.editedBBox = this.currentBBox;
      this.mapInteractionService.clearEditableRadiusSelection(this.context);
    } else {
      this.editedBBox = selection.bbox;
      this.mapInteractionService.setEditableRadiusSelection(selection);
    }
    this.evaluateState();
  }

  public changeMode(mode: SpatialSelectionMode): void {
    if (this.mode === mode) {
      return;
    }
    this.mode = mode;
    this.editedBBox = this.currentBBox;
    this.editedRadius = this.currentRadius;
    this.mapInteractionService.clearEditableRadiusSelection(this.context);
    const editableBBox = SimpleBoundingBox.makeUnbounded();
    editableBBox.setId(this.context);
    this.setEditableBBox.emit(editableBBox);
    this.evaluateState();
  }

  public clearBBox(): void {
    this.mapInteractionService.clearRadiusSelection(this.context);
    this.mapInteractionService.clearEditableRadiusSelection(this.context);
    this.currentRadius = null;
    this.editedRadius = null;
    this.radiusControl?.clear();
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
    if (this.editedBBox.isBounded()) {
      if (this.mode === 'radius') {
        if (this.editedRadius === null) {
          return;
        }
        this.mapInteractionService.setRadiusSelection(this.editedRadius);
      } else {
        this.mapInteractionService.clearRadiusSelection(this.context);
      }
    } else {
      this.mapInteractionService.clearRadiusSelection(this.context);
    }
    this.editedBBox.setId(this.context);
    this.setBBox.emit(this.editedBBox);
    this.clearCountriesSelect.emit();

    if (center) {
      this.mapInteractionService.centerMapOnBoundingBox(this.editedBBox);
    }

    this.evaluateState();
  }

  private evaluateState(): void {

    if (this.mode === 'radius') {
      this.boundsEdited = this.editedRadius !== null
        && (this.currentRadius === null || this.editedRadius.isDifferent(this.currentRadius));
      this.enableClearButton = this.editedBBox.isBounded();

      const radiusEditableBBox = this.boundsEdited
        ? this.editedBBox
        : SimpleBoundingBox.makeUnbounded();

      radiusEditableBBox.setId(this.context);
      this.setEditableBBox.emit(radiusEditableBBox);
      return;
    }

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
