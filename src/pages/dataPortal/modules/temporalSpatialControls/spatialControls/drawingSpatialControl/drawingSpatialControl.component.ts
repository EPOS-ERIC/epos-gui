import {
  Component, EventEmitter, Input, OnInit, Output,
} from '@angular/core';
import { OnAttachDetach } from 'decorators/onAttachDetach.decorator';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { MapInteractionService } from 'utility/eposLeaflet/services/mapInteraction.service';
import { Subscription } from 'rxjs';
import { BoundingBox } from 'utility/eposLeaflet/eposLeaflet';
import { SpatialSelectionMode } from 'utility/eposLeaflet/components/radiusSelection';

@OnAttachDetach('onAttachComponents')
@Unsubscriber('subscriptions')
@Component({
  selector: 'app-drawing-spatial-control',
  templateUrl: './drawingSpatialControl.component.html',
  styleUrls: ['./drawingSpatialControl.component.scss']
})
export class DrawingSpatialControlComponent implements OnInit {

  @Input() mode: SpatialSelectionMode = 'bbox';
  @Input() radiusEnabled = false;
  @Output() modeChange = new EventEmitter<SpatialSelectionMode>();

  public drawingBbox = false;

  /** Variable for keeping track of subscriptions, which are cleaned up by Unsubscriber */
  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  constructor(
    private readonly mapInteractionService: MapInteractionService,
  ) {

  }

  public ngOnInit(): void {

    this.subscriptions.push(
      this.mapInteractionService.mapBBox.observable.subscribe((bbox: BoundingBox) => {
        if (bbox.isBounded()) {
          this.drawingBbox = false;
        }
      })
    );
  }

  /**
   * The function toggles the drawing of a bounding box on a map.
   */
  public startDrawExtent(): void {
    this.drawingBbox = !this.drawingBbox;
    this.mapInteractionService.spatialDrawMode.set(this.mode);
    this.mapInteractionService.startBBox.set(this.drawingBbox);
  }

  public selectMode(mode: SpatialSelectionMode): void {
    if (this.drawingBbox && this.mode === mode) {
      return;
    }
    const restartDelay = this.drawingBbox && this.mode === 'bbox' ? 500 : 0;
    if (this.drawingBbox) {
      this.drawingBbox = false;
      this.mapInteractionService.startBBox.set(false);
    }
    this.mode = mode;
    this.modeChange.emit(mode);
    if (restartDelay > 0) {
      setTimeout(() => this.startDrawExtent(), restartDelay);
    } else {
      this.startDrawExtent();
    }
  }

}
