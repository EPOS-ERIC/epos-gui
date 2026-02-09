import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { LayersService } from 'utility/eposLeaflet/services/layers.service';
import { Stylable } from 'utility/styler/stylable.interface';
import { MapLayer } from '../layers/mapLayer.abstract';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { Subscription } from 'rxjs';
import { MapInteractionService } from 'utility/eposLeaflet/services/mapInteraction.service';

@Component({
  selector: 'app-layer-toggle',
  templateUrl: './layerToggle.component.html',
  styleUrls: ['./layerToggle.component.scss']
})
export class LayerToggleComponent implements OnInit, OnDestroy {

  /** The `@Input() layer: MapLayer;` is a decorator that marks the `layer` property as an input property.
  This means that the value of `layer` can be passed into the `LayerToggleComponent` component from
  its parent component. The `layer` property is of type `MapLayer`, which is a custom class
  representing a map layer. By marking it as an input property, the component can receive a specific
  map layer and perform operations on it, such as enabling or disabling the layer. */
  @Input() layer: MapLayer;

  /** The line `public enable: boolean | undefined;` declares a public property named `enable` with a type
  of `boolean | undefined`. This means that the property can hold a value of either `boolean` or
  `undefined`. It is used to store the state of whether the layer is enabled or not. */
  public enable: boolean | undefined;

  /** The line `public stylable: Stylable | null;` declares a public property named `stylable` with a type
  of `Stylable | null`. This means that the property can hold a value of either `Stylable` or `null`.
  It is used to store a reference to the stylable object associated with the layer. The `Stylable`
  interface defines the methods and properties for applying styles to a layer. By storing a reference
  to the stylable object, the component can access and modify the style settings for the layer. */
  public stylable: Stylable | null;


  private hiddenStateSubscription: Subscription;


  /**
   * The constructor function initializes private variables for the LayersService and
   * LocalStoragePersister.
   * @param {LayersService} layersService - The `layersService` parameter is an instance of the
   * `LayersService` class. It is used to interact with the layers in the application, such as
   * creating, updating, and deleting layers.
   * @param {LocalStoragePersister} localStoragePersister - The `localStoragePersister` parameter is an
   * instance of the `LocalStoragePersister` class. It is used to persist data to the browser's local
   * storage.
   */
  constructor(
    private readonly layersService: LayersService,
    private readonly mapIntService: MapInteractionService,
    private readonly localStoragePersister: LocalStoragePersister) {
  }

  /**
   * The ngOnInit function sets the visibility of a layer based on a custom style option.
   */
  ngOnInit(): void {
    this.stylable = this.layer.options.customLayerOptionStylable.get();
    this.enable = this.stylable?.getStyle()?.getEnable();
    this.layer.hidden.set(!this.enable);

    this.hiddenStateSubscription = this.layer.hidden.watch().subscribe((isHidden: boolean) => {
      this.enable = !isHidden;
    });
  }

  ngOnDestroy(): void {
    this.hiddenStateSubscription?.unsubscribe();
  }

  /**
   * The `updateEnable` function updates the enable status of a layer and saves the updated style
   * configuration if it is a bbox layer.
   * @param {MatSlideToggleChange} event - The event parameter is of type MatSlideToggleChange, which
   * is an event emitted when the state of a MatSlideToggle component changes. It contains information
   * about the change, such as the new checked state of the toggle.
   */
  public updateEnable(event: MatSlideToggleChange): void {
    this.layer.hidden.set(!event.checked);

    // WMTS
    const layers = this.layer.getEposLeaflet().layers;
    const wmtsLayerStorage = this.mapIntService.wmtsLayerStorage.value;
    if (wmtsLayerStorage && wmtsLayerStorage.has(this.layer.id)) {
      wmtsLayerStorage.forEach((value, key) => {
        if ((value.originatorConfig === this.layer.id)) {
          const wmtsLayer = layers.find(l => l.id === key);
          if (wmtsLayer != null) {
            wmtsLayer.hidden.set(!event.checked);
          }
        }
      });
    }

    const style = this.stylable?.getStyle();
    style?.setEnable(event.checked);
    this.layersService.layerChange(this.layer);

    this.layersService.setArticOverlayLayerVisibility(this.layer.id, event.checked);

    // if bbox layer
    if (this.layer.id.includes(MapLayer.BBOX_LAYER_ID)) {

      void this.localStoragePersister.get(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_BBOX_STYLE).then((styleMapString: string) => {

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const styleMap = new Map(Object.entries(JSON.parse(styleMapString)));

        const objStyle = styleMap.get(this.layer.id) as Record<string, unknown>;
        objStyle.enable = event.checked;
        styleMap.set(this.layer.id, objStyle);

        this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, JSON.stringify(Object.fromEntries(styleMap)), false, LocalStorageVariables.LS_BBOX_STYLE);

      });
    }

  }

}
