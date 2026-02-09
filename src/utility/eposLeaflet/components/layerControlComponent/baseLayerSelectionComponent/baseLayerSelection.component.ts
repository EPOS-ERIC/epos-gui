import { Component, Output, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { baseLayerOptions } from '../../controls/baseLayerControl/baseLayerOptions';
import { LayersService } from 'utility/eposLeaflet/services/layers.service';
import { MatRadioChange } from '@angular/material/radio';
import { BaseLayerOption } from '../../controls/public_api';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';

/** The `BaseLayerSelectionComponent` class in TypeScript manages the selection of base layers and
communicates with the `LayersService` to update the selected base layer. */
@Unsubscriber('subscriptions')
@Component({
  selector: 'app-base-layer-selection',
  templateUrl: './baseLayerSelection.component.html',
  styleUrls: ['./baseLayerSelection.component.scss']
})
export class BaseLayerSelectionComponent implements OnChanges {

  /**
   * The code of the currently active Coordinate Reference System (CRS),
   * such as 'EPSG:3857' or 'EPSG:3995'. This value is passed from the parent
   * component and is used to dynamically filter the list of available base
   * layers (`basemaps`) that are compatible with the selected CRS.
   *
   * When this input changes, the component automatically refreshes the
   * list of base layers and ensures that the currently selected one is still
   * valid. If not, it selects a valid fallback from local storage preferences.
   */
  @Input() crsCode: string = 'EPSG:3857';

  /** The `@Output() selectedLayer = new
  BehaviorSubject<string>(baseLayerOptions[LayersService.INDEX_DEFAULT_BASEMAP].name);` line in the
  `BaseLayerSelectionComponent` class is creating an output property named `selectedLayer` using
  Angular's `@Output` decorator. This property is an instance of `BehaviorSubject<string>` which is
  initialized with the name of the default base layer option from the `baseLayerOptions` array at the
  index specified by `LayersService.INDEX_DEFAULT_BASEMAP`. */
  @Output() selectedLayer = new BehaviorSubject<string>(baseLayerOptions[LayersService.INDEX_DEFAULT_BASEMAP].name);

  /** The line `public basemaps: Array<BaseLayerOption> = baseLayerOptions;` in the
  `BaseLayerSelectionComponent` class is initializing a public property named `basemaps` as an array
  of `BaseLayerOption` objects. It is assigning the value of the `baseLayerOptions` array to this
  property. This allows the component to have access to the base layer options defined in the
  `baseLayerOptions` array and use them for displaying and selecting base layers in the user
  interface. */
  public basemaps: Array<BaseLayerOption> = baseLayerOptions;

  /** The line `public currentSelected = this.basemaps[LayersService.INDEX_DEFAULT_BASEMAP];` in the
  `BaseLayerSelectionComponent` class is initializing a public property named `currentSelected`. It
  is assigning the value of the base layer option at the index specified by
  `LayersService.INDEX_DEFAULT_BASEMAP` in the `basemaps` array to this property. */
  public currentSelected = this.basemaps[LayersService.INDEX_DEFAULT_BASEMAP];

  /** The line `protected subscriptions: Array<Subscription> = new Array<Subscription>();` in the
  `BaseLayerSelectionComponent` class is declaring a protected property named `subscriptions` as an
  array of `Subscription` objects. */
  protected subscriptions: Array<Subscription> = new Array<Subscription>();

  /**
   * This TypeScript constructor initializes a component with a LayersService dependency, subscribes to
   * a baseLayerChangeSourceObs observable, and sets the currentSelected property based on the received
   * BaseLayerOption or from storage.
   * @param {LayersService} layersService - The `layersService` parameter is an instance of the
   * `LayersService` class, which is being injected into the constructor using Angular's dependency
   * injection mechanism. The `LayersService` class likely provides functionality related to managing
   * layers in a mapping application, such as changing base layers and retrieving base layers from
   * storage
   */
  constructor(private layersService: LayersService, private cdRef: ChangeDetectorRef) {
    this.subscriptions.push(
      this.layersService.baseLayerChangeSourceObs.subscribe((basemap: BaseLayerOption) => {
        if (basemap !== null) {
          this.currentSelected = basemap;
        }
      })
    );
  }


  /**
   * Lifecycle hook triggered whenever any `@Input()` property changes.
   * In this case, it reacts to changes in the `crsCode` input.
   *
   * When the CRS changes, this method ensures that the list of available
   * base layers is updated to reflect only those compatible with the new CRS.
   *
   * @param changes - An object containing the changed input properties and their previous/current values.
   */
  ngOnChanges(changes: SimpleChanges): void {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    if (changes['crsCode']) {
      this.updateBasemaps();
    }
  }

  /**
   * Updates the list of base layers (`basemaps`) to include only those
   * that support the currently selected CRS (`crsCode`).
   *
   * If the currently selected base layer is no longer valid under the new CRS,
   * it is replaced with a compatible one retrieved from local storage.
   *
   * This method also triggers change detection to ensure that the view reflects
   * the updated state of available and selected base layers.
   */
  private updateBasemaps(): void {
    this.basemaps = baseLayerOptions.filter(layer =>
      layer.supportedCRS.includes(this.crsCode)
    );

    // If current selected layer is no longer compatible, update from storage
    if (!this.basemaps.some(l => l.name === this.currentSelected?.name)) {
      this.currentSelected = this.layersService.getBaseLayerFromStorage(this.crsCode);
      this.selectedLayer.next(this.currentSelected.name);
    }
    this.cdRef.markForCheck();
  }

  /**
   * The setLayer function updates the selected layer and triggers a base layer change event.
   * @param {MatRadioChange} event - The `event` parameter in the `setLayer` function is of type
   * `MatRadioChange`, which is an event emitted when the selected radio button changes in a Material
   * Design radio button group.
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public setLayer(event: MatRadioChange): void {
    const selected = event.value as BaseLayerOption;
    this.selectedLayer.next(selected.name);
    this.layersService.baseLayerChange(selected, this.crsCode);
  }
}
