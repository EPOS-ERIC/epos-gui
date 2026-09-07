import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CONTEXT_RESOURCE } from 'api/api.service.factory';
import { RadiusSelection } from 'utility/eposLeaflet/components/radiusSelection';

@Component({
  selector: 'app-radius-spatial-control',
  templateUrl: './radiusSpatialControl.component.html',
  styleUrls: ['../simpleSpatialControl/simpleSpatialControl.component.scss']
})
export class RadiusSpatialControlComponent {
  @Input() context = CONTEXT_RESOURCE;
  @Input() inputsDisabled = false;
  @Output() changeRadius = new EventEmitter<RadiusSelection | null>();
  @Output() applyEdited = new EventEmitter<void>();

  public latitude = '';
  public longitude = '';
  public radiusKm = '';

  @Input()
  set selection(value: RadiusSelection | null) {
    if (value === null) {
      this.clear();
    } else {
      this.latitude = value.latitude.toString();
      this.longitude = value.longitude.toString();
      this.radiusKm = value.radiusKm.toString();
    }
  }

  public onChange(): void {
    if (this.latitude.trim() === '' || this.longitude.trim() === '' || this.radiusKm.trim() === '') {
      this.changeRadius.emit(null);
      return;
    }

    this.changeRadius.emit(RadiusSelection.make(
      this.context,
      Number(this.latitude),
      Number(this.longitude),
      Number(this.radiusKm),
    ));
  }

  public applyExtent(): void {
    this.applyEdited.emit();
  }

  public clear(): void {
    this.latitude = '';
    this.longitude = '';
    this.radiusKm = '';
  }
}
