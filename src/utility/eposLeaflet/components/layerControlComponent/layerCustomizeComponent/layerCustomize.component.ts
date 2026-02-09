import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSliderChange } from '@angular/material/slider';
import { LayersService } from 'utility/eposLeaflet/services/layers.service';
import { GeoJSONMapLayer } from 'utility/maplayers/geoJSONMapLayer';
import { Stylable } from 'utility/styler/stylable.interface';
import { defaultMarkerIcons, FaMarkerOption } from 'utility/styler/styler';
import { MapLayer } from '../../layers/mapLayer.abstract';
import { GeoJsonLayer } from '../../layers/public_api';
import { MapInteractionService } from 'utility/eposLeaflet/services/mapInteraction.service';
import { DataConfigurableDataSearch } from 'utility/configurablesDataSearch/dataConfigurableDataSearch';
import { CONTEXT_FACILITY, CONTEXT_RESOURCE, CONTEXT_SOFTWARE } from 'api/api.service.factory';

@Component({
  selector: 'app-layer-customize',
  templateUrl: './layerCustomize.component.html',
  styleUrls: ['./layerCustomize.component.scss']
})
export class LayerCustomizeComponent implements OnInit {

  /** The `@Input() layer: MapLayer;` is a decorator in TypeScript that marks the `layer` property as an
  input property. This means that the value of `layer` can be passed into the component from its
  parent component. In this case, the `layer` property is of type `MapLayer`, which is a custom class
  or interface used in the application. */
  @Input() layer: MapLayer;

  /** The `@ViewChild('markerImageUrlInput') markerImageUrlInput: ElementRef<HTMLInputElement>` is a
  decorator in TypeScript that allows the component to access a reference to an HTML element in the
  template. In this case, it is used to get a reference to the input element with the ID
  "markerImageUrlInput". The `markerImageUrlInput` property is of type `ElementRef<HTMLInputElement>`,
  which provides access to the properties and methods of the input element. This allows the component
  to manipulate the input element, such as getting its value or setting its value programmatically. */
  @ViewChild('markerImageUrlInput') markerImageUrlInput: ElementRef<HTMLInputElement>;

  /** The `@ViewChild('markerCharacterInput') markerCharacterInput: ElementRef<HTMLInputElement>` is a
  decorator in TypeScript that allows the component to access a reference to an HTML element in the
  template. In this case, it is used to get a reference to the input element with the ID
  "markerCharacterInput". The `markerCharacterInput` property is of type
  `ElementRef<HTMLInputElement>`, which provides access to the properties and methods of the input
  element. This allows the component to manipulate the input element, such as getting its value or
  setting its value programmatically. */
  @ViewChild('markerCharacterInput') markerCharacterInput: ElementRef<HTMLInputElement>;

  /** The `@ViewChild('selectIcon') selectIcon;` line is declaring a property named `selectIcon` and using
  the `@ViewChild` decorator to obtain a reference to an HTML element in the component's template. In
  this case, the reference is obtained using the element's ID, which is `selectIcon`. This allows the
  component to access and manipulate the properties and methods of the HTML element, such as getting
  its value or listening for events. */
  @ViewChild('selectIcon') selectIcon;

  /** The `stylable` property is declared as a public property of type `Stylable | null`. It is used to
  store the stylable object associated with the layer. The `Stylable` interface is a custom interface
  used in the application, and it represents an object that can be styled. By assigning the type
  `Stylable | null`, it means that the `stylable` property can either hold a reference to a `Stylable`
  object or be null if there is no stylable object associated with the layer. */
  public stylable: Stylable | null;

  /** The above code is declaring a public property named "opacity" with a type of number or null in
  TypeScript. */
  public opacity: number | null;

  /** The above code is declaring a public property called "color" with an initial value of an empty
  string. */
  public color = '';

  /** The above code is declaring a public property called "fillColor" and initializing it with an empty
  string. */
  public fillColor = '';

  /** The above code is declaring a public property called "fillColorOpacity" in a TypeScript class. The
  property can hold a value of type number or null. */
  public fillColorOpacity: number | null;

  /** The above code is defining a public property called "weight" in a TypeScript class. The "weight"
  property is of type "number" or "null". */
  public weight: number | null;

  /** The above code is declaring a public property called "markerIcons" of type "FaMarkerOption[]". */
  public markerIcons: FaMarkerOption[];

  /** The above code is declaring a public property called `markerType` in a TypeScript class. The
  `markerType` property can hold a value of type `string` or `null`. */
  public markerType: string | null;

  /** The above code is declaring a public property called `markerValue` in a TypeScript class. The
  property can hold a value of type `string` or `null`. */
  public markerValue: string | null;

  /** The above code is declaring a public property called `markerIconSize` in a TypeScript class. The
  property can hold a value of type `number`, `null`, or `undefined`. */
  public markerIconSize: number | null | undefined;

  /** The above code is declaring a public property called `markerIconFa` in a TypeScript class. The
  property is of type `string` or `undefined`. */
  public markerIconFa: string | undefined;

  public selectedMarkerIcon: string | undefined;

  /** The above code is declaring a public property called "clustering" with a type of boolean or null. */
  public clustering: boolean | null;

  /** The above code is declaring a public property called "tools" which is an object. This object has
  several boolean properties such as "opacity", "colorOpacity", "fillColorOpacity", "weight", "size",
  and "cluster". These properties are used to control various features or settings related to a map or
  a similar application. The "changeMarker" property is a string that can be used to change the marker
  type. */
  public tools = {
    opacity: false,
    colorOpacity: false,
    fillColorOpacity: false,
    weight: false,
    changeMarker: '',
    size: false,
    cluster: false,
  };

  /**
   * The constructor initializes the markerIcons property with the defaultMarkerIcons value and injects
   * the LayersService dependency.
   * @param {LayersService} layersService - The `layersService` parameter is of type `LayersService`.
   * It is a service that provides functionality related to layers in the application.
   */
  constructor(
    private layersService: LayersService,
    private mapInteractionService: MapInteractionService,
  ) {
    this.markerIcons = defaultMarkerIcons;
  }

  /**
   * The ngOnInit function initializes various properties and sets up tools based on the options and
   * style of a layer.
   */
  ngOnInit(): void {

    this.stylable = this.layer.options.customLayerOptionStylable.get();

    this.opacity = this.layer.options.customLayerOptionOpacity.get();

    this.color = this.layer.options.customLayerOptionColor.get() ?? '';

    this.fillColor = this.layer.options.customLayerOptionFillColor.get() ?? '';
    this.fillColorOpacity = this.layer.options.customLayerOptionFillColorOpacity.get();
    this.weight = this.layer.options.customLayerOptionWeight.get();

    this.markerType = this.layer.options.customLayerOptionMarkerType.get() ?? null;
    this.markerIconSize = this.layer.options.customLayerOptionMarkerIconSize.get() ?? this.stylable?.getStyle()?.getMarkerIconSize();
    this.markerValue = this.layer.options.customLayerOptionMarkerValue.get() ?? '';

    // remove facility from defaultMarkerIcons if context resources
    let context = CONTEXT_RESOURCE;
    if (this.layer.getStylable() !== undefined && (this.layer.getStylable() as DataConfigurableDataSearch).context !== undefined) {
      context = (this.layer.getStylable() as DataConfigurableDataSearch).context;
    }
    if (context === CONTEXT_RESOURCE || context === CONTEXT_SOFTWARE) {
      // remove facility by list
      this.markerIcons = defaultMarkerIcons.filter((_markerOpt: FaMarkerOption) => _markerOpt.context !== CONTEXT_FACILITY);
    }

    this.markerIconFa = this.markerIcons.find(e =>
      e.value.join(' ') === this.markerValue
    )?.id;

    this.selectedMarkerIcon = this.markerIcons.find(e => e.id === this.markerIconFa)?.value.join(' ');

    const style = this.stylable?.getStyle();
    if (style !== null && style !== undefined) {
      this.clustering = style.getClustering();

      if (this.clustering !== null) {
        // enable/disable toggle on map in table panel
        this.mapInteractionService.toggleOnMapDisabled.next(this.clustering);
      }

    }

    setTimeout(() => {
      this.setTools();

      // if one marker on map set clustering false (remove cluster toogle tool)
      if (this.layer instanceof GeoJsonLayer && (this.layer as GeoJSONMapLayer).getMarkerLayer().getMarkers().length === 1) {
        this.clustering = false;
        this.setClustering(false);
        this.tools.cluster = false;
      }
    }, 100);
  }

  /**
   * The function updates the opacity of a layer and triggers a redraw if clustering is enabled.
   * @param {MatSliderChange} event - The event parameter is of type MatSliderChange, which is an event
   * emitted when the value of a MatSlider component changes.
   */
  updateOpacity(event: MatSliderChange): void {
    this.layer.options.customLayerOptionOpacity.set(event.value);
    this.layersService.layerChange(this.layer);

    if (this.clustering) {
      this.redrawLayer();
    }
  }

  /**
   * The function updates the color of a custom layer option and triggers a layer change event, and if
   * clustering is enabled, it redraws the layer.
   * @param {string} newcolor - The newcolor parameter is a string that represents the new color value
   * that you want to update.
   */
  updateColor(newcolor: string): void {
    this.layer.options.customLayerOptionColor.set(newcolor);
    this.layersService.layerChange(this.layer);

    if (this.clustering) {
      this.redrawLayer();
    }
  }

  /**
   * The function updates the fill color of a layer and triggers a layer change event, and if
   * clustering is enabled, it redraws the layer.
   * @param {string} newcolor - The newcolor parameter is a string that represents the new color value
   * that you want to set for the fill color of a layer.
   */
  updateFillColor(newcolor: string): void {
    this.layer.options.customLayerOptionFillColor.set(newcolor);
    this.layersService.layerChange(this.layer);

    if (this.clustering) {
      this.redrawLayer();
    }
  }

  /**
   * The function updates the fill color opacity of a layer and triggers a redraw if clustering is
   * enabled.
   * @param {MatSliderChange} event - The event parameter is of type MatSliderChange, which is an event
   * emitted when the value of a MatSlider component changes.
   */
  updateFillColorOpacity(event: MatSliderChange): void {
    this.layer.options.customLayerOptionFillColorOpacity.set(event.value);
    this.layersService.layerChange(this.layer);

    if (this.clustering) {
      this.redrawLayer();
    }
  }

  /**
   * The function changes the marker icon of a layer based on a default icon or a custom image URL.
   * @param [defaultIcon=false] - A boolean value indicating whether to use the default icon or not. If
   * true, the default icon will be used. If false, a custom icon will be used.
   */
  changeMarkerIcon(defaultIcon = false): void {

    if (defaultIcon) {
      this.layer.options.customLayerOptionMarkerValue.set(this.layer.options.customLayerOptionMarkerOriginValue.get());
      this.markerValue = this.layer.options.customLayerOptionMarkerOriginValue.get();
    } else {
      this.layer.options.customLayerOptionMarkerValue.set(this.markerImageUrlInput.nativeElement.value);
    }

    this.layersService.layerChange(this.layer);
  }

  /**
   * The function changes the marker icon character based on the input value or reverts it to the
   * default value.
   * @param [defaultIcon=false] - A boolean value indicating whether the default icon should be used or
   * not. If true, the default icon will be used. If false, the custom icon specified by the
   * markerCharacterInput will be used.
   */
  changeMarkerIconCharacter(defaultIcon = false): void {
    if (defaultIcon) {
      this.layer.options.customLayerOptionMarkerValue.set(this.layer.options.customLayerOptionMarkerOriginValue.get());
      this.markerValue = this.layer.options.customLayerOptionMarkerOriginValue.get();
    } else {
      this.layer.options.customLayerOptionMarkerValue.set(this.markerCharacterInput.nativeElement.value);
    }

    this.layersService.layerChange(this.layer);
  }

  /**
   * The function updates the size of a marker icon and triggers a layer change event.
   * @param {MatSliderChange} event - The event parameter is of type MatSliderChange, which is an event
   * emitted when the value of a MatSlider component changes.
   */
  updateSize(event: MatSliderChange): void {
    this.layer.options.customLayerOptionMarkerIconSize.set(event.value);
    this.layersService.layerChange(this.layer);
  }

  /**
   * The function updates the weight of a custom layer option and triggers a layer change event.
   * @param {MatSliderChange} event - The event parameter is an object that represents the change event
   * of a MatSlider component. It contains information about the slider's current value and other
   * properties related to the change event.
   */
  updateWeight(event: MatSliderChange): void {
    this.layer.options.customLayerOptionWeight.set(event.value);
    this.layersService.layerChange(this.layer);
  }

  /**
   * The function updates the clustering property based on the value of a MatSlideToggleChange event
   * and calls a setClustering function.
   * @param {MatSlideToggleChange} event - MatSlideToggleChange - an event object that is triggered
   * when the state of a slide toggle changes. It contains information about the change, such as the
   * new checked state.
   */
  updateClustering(event: MatSlideToggleChange): void {
    this.clustering = event.checked;

    // remove all hidden marker from local storage
    if (event.checked === true) {
      this.mapInteractionService.removeHiddenMarkerByLayerId(this.layer.id, false);
    }

    this.setClustering(this.clustering);
  }


  /**
   * The function "changeMarkerIconFa" updates the selectedMarkerIcon, customLayerOptionMarkerValue,
   * and triggers a layer change event based on the selected marker icon value.
   * @param {MatSelectChange} event - MatSelectChange - an event object that is triggered when the
   * value of a mat-select component changes. It contains information about the selected value.
   */
  changeMarkerIconFa(event: MatSelectChange): void {
    this.selectedMarkerIcon = this.markerIcons.find(e => e.id === event.value)?.value.join(' ');
    this.layer.options.customLayerOptionMarkerValue.set(this.markerIcons.find(e => e.id === event.value)?.value.join(' '));
    this.layersService.layerChange(this.layer);
  }

  /**
   * The function redraws a layer on a map using the EposLeaflet library.
   */
  private redrawLayer(): void {
    const map = this.layer.getEposLeaflet();
    void map.redrawLayer(this.layer);
  }

  /**
   * The function sets the clustering option for a custom layer and triggers a redraw of the layer.
   * @param {boolean} clustering - A boolean value indicating whether clustering should be enabled or
   * disabled.
   */
  private setClustering(clustering: boolean) {
    this.layer.options.customLayerOptionClustering.set(clustering);
    this.layersService.layerChange(this.layer);

    const style = this.stylable?.getStyle();
    if (style !== undefined) {
      this.stylable?.setStyle(style, true);
    }

    this.redrawLayer();
  }

  /**
   * The function sets the tools based on the marker type.
   */
  private setTools(): void {

    switch (this.markerType) {
      // WMS
      case null:
        this.tools = {
          opacity: true,
          colorOpacity: false,
          fillColorOpacity: false,
          weight: false,
          changeMarker: '',
          size: false,
          cluster: false,
        };
        break;
      // IMAGE ICON
      case MapLayer.MARKERTYPE_IMAGE:
        this.tools = {
          opacity: true,
          colorOpacity: false,
          fillColorOpacity: false,
          weight: false,
          changeMarker: 'image',
          size: true,
          cluster: true,
        };
        break;
      // RAW ICON
      case MapLayer.MARKERTYPE_RAW:
        this.tools = {
          opacity: true,
          colorOpacity: false,
          fillColorOpacity: false,
          weight: false,
          changeMarker: 'raw',
          size: false,
          cluster: false,
        };
        break;

      case MapLayer.MARKERTYPE_LINE:
        this.tools = {
          opacity: false,
          colorOpacity: true,
          fillColorOpacity: false,
          weight: true,
          changeMarker: '',
          size: false,
          cluster: false,
        };
        break;

      case MapLayer.MARKERTYPE_POINT:
        this.tools = {
          opacity: false,
          colorOpacity: true,
          fillColorOpacity: true,
          weight: true,
          changeMarker: '',
          size: false,
          cluster: true,
        };
        break;
      case MapLayer.MARKERTYPE_FA:
        this.tools = {
          opacity: false,
          colorOpacity: true,
          fillColorOpacity: false,
          weight: false,
          changeMarker: 'font',
          size: true,
          cluster: true,
        };
        break;

      case MapLayer.MARKERTYPE_CHARACTER:
        this.tools = {
          opacity: false,
          colorOpacity: true,
          fillColorOpacity: true,
          weight: false,
          changeMarker: 'character',
          size: true,
          cluster: true,
        };
        break;

      case MapLayer.MARKERTYPE_POLYGON:
        this.tools = {
          opacity: false,
          colorOpacity: true,
          fillColorOpacity: true,
          weight: true,
          changeMarker: '',
          size: false,
          cluster: false,
        };
        break;

      case MapLayer.MARKERTYPE_PIN_FA:
        this.tools = {
          opacity: false,
          colorOpacity: true,
          fillColorOpacity: true,
          weight: false,
          changeMarker: 'font',
          size: true,
          cluster: true,
        };
        break;

      default:
        this.tools = {
          opacity: false,
          colorOpacity: false,
          fillColorOpacity: false,
          weight: false,
          changeMarker: '',
          size: false,
          cluster: false,
        };
    }
  }

}
