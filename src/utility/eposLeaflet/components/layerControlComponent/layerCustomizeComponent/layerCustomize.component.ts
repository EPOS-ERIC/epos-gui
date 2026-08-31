import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSliderChange } from '@angular/material/slider';
import { LayersService } from 'utility/eposLeaflet/services/layers.service';
import { GeoJSONMapLayer } from 'utility/maplayers/geoJSONMapLayer';
import { Stylable } from 'utility/styler/stylable.interface';
import { defaultMarkerIcons, FaMarkerOption } from 'utility/styler/styler';
import { MapLayer } from '../../layers/mapLayer.abstract';
import {
  GeoJsonLayer, GeoJsonMarkerColorPalette, GeoJsonMarkerParameterStyle, MarkerStyleMode,
  NumericGeoJsonProperty
} from '../../layers/public_api';
import { ExternalTileServiceLayer } from '../../layers/externalTileServiceLayer';
import { ExternalVisualisationSource, MapInteractionService } from 'utility/eposLeaflet/services/mapInteraction.service';
import { DataConfigurableDataSearch } from 'utility/configurablesDataSearch/dataConfigurableDataSearch';
import { CONTEXT_FACILITY, CONTEXT_RESOURCE, CONTEXT_SOFTWARE } from 'api/api.service.factory';
import { CovJSONMapLayer } from 'utility/maplayers/covJSONMapLayer';

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

  public externalTileServiceLayer: ExternalTileServiceLayer | null = null;

  public externalVectorSource: ExternalVisualisationSource | null = null;

  public isExternalPointGeoJsonLayer = false;

  public isParameterStylingAvailable = false;

  public numericMarkerProperties = new Array<NumericGeoJsonProperty>();

  public colorMode: MarkerStyleMode = 'fixed';

  public colorProperty: string | null = null;

  public colorPaletteId: string | null = null;

  public colorMinValue: number | null = null;

  public colorMaxValue: number | null = null;

  public colorRangeModified = false;

  public sizeMode: MarkerStyleMode = 'fixed';

  public sizeProperty: string | null = null;

  public sizeMinValue: number | null = null;

  public sizeMaxValue: number | null = null;

  public sizeRangeModified = false;

  public colorPalettes = GeoJsonLayer.MARKER_COLOR_PALETTES;

  public markerSizeScale = 100;

  public minMarkerSizeScale = 50;

  public maxMarkerSizeScale = 125;

  public colorPaletteBackground = '';

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

  private redrawPromise: Promise<void> = Promise.resolve();

  private baseMinMarkerSize = 10;

  private baseMaxMarkerSize = 80;

  private appliedMarkerSizeScale = 100;

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

  public get canConfigureColorByParameter(): boolean {
    return this.isParameterStylingAvailable
      && this.markerType !== MapLayer.MARKERTYPE_IMAGE
      && this.markerType !== MapLayer.MARKERTYPE_RAW;
  }

  public get canConfigureSizeByParameter(): boolean {
    return this.isParameterStylingAvailable;
  }

  public get isParameterColorOnStroke(): boolean {
    return this.markerType === MapLayer.MARKERTYPE_CHARACTER
      || this.markerType === MapLayer.MARKERTYPE_PIN_FA;
  }

  /**
   * The ngOnInit function initializes various properties and sets up tools based on the options and
   * style of a layer.
   */
  ngOnInit(): void {

    if (this.layer instanceof ExternalTileServiceLayer) {
      this.externalTileServiceLayer = this.layer;
    }
    const externalSource = this.mapInteractionService.externalVisualisationSources.value.get(this.layer.id);
    if (externalSource?.sourceUrl != null) {
      this.externalVectorSource = externalSource;
    }

    this.stylable = this.layer.options.customLayerOptionStylable.get();

    this.opacity = this.layer.options.customLayerOptionOpacity.get();

    this.color = this.layer.options.customLayerOptionColor.get() ?? '';

    this.fillColor = this.layer.options.customLayerOptionFillColor.get() ?? '';
    this.fillColorOpacity = this.layer.options.customLayerOptionFillColorOpacity.get();
    this.weight = this.layer.options.customLayerOptionWeight.get();

    this.markerType = this.layer.options.customLayerOptionMarkerType.get() ?? null;
    this.markerIconSize = this.layer.options.customLayerOptionMarkerIconSize.get() ?? this.stylable?.getStyle()?.getMarkerIconSize();
    this.markerValue = this.layer.options.customLayerOptionMarkerValue.get() ?? '';
    this.isExternalPointGeoJsonLayer = this.layer.id.startsWith('external-layer-')
      && this.layer instanceof GeoJsonLayer
      && this.mapInteractionService.externalVisualisationSources.value.get(this.layer.id)?.type === 'geojson'
      && this.hasPointGeometry(this.layer.getGeoJsonData());
    this.isParameterStylingAvailable = this.layer instanceof GeoJsonLayer
      && !(this.layer instanceof CovJSONMapLayer)
      && this.hasPointGeometry(this.layer.getGeoJsonData());
    if (this.isParameterStylingAvailable && this.layer instanceof GeoJsonLayer) {
      this.numericMarkerProperties = this.layer.getNumericMarkerProperties();
      const parameterStyle = this.layer.getMarkerParameterStyle();
      this.colorMode = parameterStyle.color.mode;
      this.colorProperty = parameterStyle.color.property;
      this.colorPaletteId = parameterStyle.color.paletteId;
      const colorRange = this.getParameterRange(parameterStyle, 'color');
      this.colorMinValue = colorRange.min;
      this.colorMaxValue = colorRange.max;
      this.sizeMode = parameterStyle.size.mode;
      this.sizeProperty = parameterStyle.size.property;
      const sizeRange = this.getParameterRange(parameterStyle, 'size');
      this.sizeMinValue = sizeRange.min;
      this.sizeMaxValue = sizeRange.max;
      this.initializeMarkerSizeScale(parameterStyle.size.minPx, parameterStyle.size.maxPx);
      this.updatePalettePreview();
    }
    if (this.isExternalPointGeoJsonLayer) {
      if (!this.markerValue) {
        this.markerValue = defaultMarkerIcons[0].value.join(' ');
        this.layer.options.customLayerOptionMarkerValue.set(this.markerValue);
      }
      if (this.markerIconSize == null) {
        this.markerIconSize = 20;
        this.layer.options.customLayerOptionMarkerIconSize.set(this.markerIconSize);
      }
    }

    // remove facility from defaultMarkerIcons if context resources
    let context = CONTEXT_RESOURCE;
    if (this.layer.getStylable() !== undefined && (this.layer.getStylable() as DataConfigurableDataSearch).context !== undefined) {
      context = (this.layer.getStylable() as DataConfigurableDataSearch).context;
    }
    if (!this.isExternalPointGeoJsonLayer && (context === CONTEXT_RESOURCE || context === CONTEXT_SOFTWARE)) {
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
        if (this.layer.id.startsWith('external-layer-')) {
          this.layer.options.customLayerOptionClustering.set(false);
        } else {
          this.setClustering(false);
        }
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
      void this.redrawLayer();
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
    if (this.colorMode === 'parameter' && this.layer instanceof GeoJsonLayer) {
      this.layer.getMarkerLayer().updateMarkerStrokeColor(newcolor);
      this.stylable?.getStyle()?.setColor1(newcolor.substring(1));
      return;
    }
    this.layersService.layerChange(this.layer);

    if (this.clustering || this.sizeMode === 'parameter') {
      void this.redrawLayer();
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
    if (this.colorMode === 'parameter' && this.isParameterColorOnStroke) {
      this.stylable?.getStyle()?.setColor2(newcolor.substring(1));
    }
    this.layersService.layerChange(this.layer);

    if (this.clustering
      || (this.colorMode === 'parameter' && this.isParameterColorOnStroke)
      || this.sizeMode === 'parameter') {
      void this.redrawLayer();
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

    if (this.clustering || this.sizeMode === 'parameter') {
      void this.redrawLayer();
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
    if (this.sizeMode === 'parameter') {
      void this.redrawLayer();
    }
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
    if (this.colorMode === 'parameter' || this.sizeMode === 'parameter') {
      void this.redrawLayer();
    }
  }

  /**
   * The function updates the size of a marker icon and triggers a layer change event.
   * @param {MatSliderChange} event - The event parameter is of type MatSliderChange, which is an event
   * emitted when the value of a MatSlider component changes.
   */
  updateSize(event: MatSliderChange): void {
    if (this.isExternalPointGeoJsonLayer && this.layer instanceof GeoJSONMapLayer && event.value != null) {
      const style = this.stylable?.getStyle();
      style?.setMarkerIconSize(event.value);
      if (style != null) {
        this.stylable?.setStyle(style, true);
      }
      if (this.colorMode === 'parameter' && this.sizeMode === 'fixed') {
        this.layer.options.customLayerOptionMarkerIconSize.set(event.value);
        this.layersService.layerChange(this.layer);
        return;
      }
      void this.redrawLayer().then(() => {
        this.layersService.layerChange(this.layer);
      });
      return;
    }
    this.layer.options.customLayerOptionMarkerIconSize.set(event.value);
    this.layersService.layerChange(this.layer);
    if (this.sizeMode === 'parameter') {
      void this.redrawLayer();
    }
  }

  public updateColorMode(event: MatSelectChange): void {
    this.colorRangeModified = false;
    this.colorMode = event.value as MarkerStyleMode;
    const style = this.getParameterStyle();
    style.color.mode = this.colorMode;
    if (this.colorMode === 'parameter') {
      style.color.paletteId = this.getAutomaticPaletteId();
      if (style.color.minValue == null || style.color.maxValue == null) {
        this.setParameterRangeFromProperty(style, 'color');
      }
    }
    this.applyParameterStyle(style);
  }

  public updateColorProperty(event: MatSelectChange): void {
    this.colorRangeModified = false;
    this.colorProperty = event.value as string;
    const style = this.getParameterStyle();
    style.color.property = this.colorProperty;
    this.setParameterRangeFromProperty(style, 'color');
    this.applyParameterStyle(style);
  }

  public updateColorPalette(event: MatSelectChange): void {
    const style = this.getParameterStyle();
    style.color.paletteId = event.value as string;
    this.applyParameterStyle(style);
  }

  public updateSizeMode(event: MatSelectChange): void {
    this.sizeRangeModified = false;
    this.sizeMode = event.value as MarkerStyleMode;
    const style = this.getParameterStyle();
    style.size.mode = this.sizeMode;
    if (this.sizeMode === 'parameter' && (style.size.minValue == null || style.size.maxValue == null)) {
      this.setParameterRangeFromProperty(style, 'size');
    }
    this.applyParameterStyle(style);
  }

  public updateSizeProperty(event: MatSelectChange): void {
    this.sizeRangeModified = false;
    this.sizeProperty = event.value as string;
    const style = this.getParameterStyle();
    style.size.property = this.sizeProperty;
    this.setParameterRangeFromProperty(style, 'size');
    this.applyParameterStyle(style);
  }

  public updateParameterRangeModified(
    type: 'color' | 'size',
    minInput: HTMLInputElement,
    maxInput: HTMLInputElement,
  ): void {
    const currentMin = type === 'color' ? this.colorMinValue : this.sizeMinValue;
    const currentMax = type === 'color' ? this.colorMaxValue : this.sizeMaxValue;
    this.setParameterRangeModified(
      type,
      minInput.valueAsNumber !== currentMin || maxInput.valueAsNumber !== currentMax,
    );
  }

  public applyParameterRange(
    type: 'color' | 'size',
    minInput: HTMLInputElement,
    maxInput: HTMLInputElement,
  ): void {
    const style = this.getParameterStyle();
    const config = style[type];
    const currentRange = this.getParameterRange(style, type);
    const minValue = minInput.valueAsNumber;
    const maxValue = maxInput.valueAsNumber;
    if (!Number.isFinite(minValue) || !Number.isFinite(maxValue) || minValue > maxValue) {
      this.syncParameterRangeInputs(type, minInput, maxInput);
      this.setParameterRangeModified(type, false);
      return;
    }
    if (minValue === currentRange.min && maxValue === currentRange.max) {
      this.setParameterRangeModified(type, false);
      return;
    }
    config.minValue = minValue;
    config.maxValue = maxValue;
    this.applyParameterStyle(style);
    this.setParameterRangeModified(type, false);
  }

  public resetParameterRange(
    type: 'color' | 'size',
    bound: 'minValue' | 'maxValue',
    minInput: HTMLInputElement,
    maxInput: HTMLInputElement,
  ): void {
    const style = this.getParameterStyle();
    const config = style[type];
    const property = this.numericMarkerProperties.find(item => item.name === config.property);
    if (property == null) {
      return;
    }
    config[bound] = bound === 'minValue' ? property.min : property.max;
    if (config.minValue != null && config.maxValue != null && config.minValue > config.maxValue) {
      config.minValue = property.min;
      config.maxValue = property.max;
    }
    this.applyParameterStyle(style);
    this.syncParameterRangeInputs(type, minInput, maxInput);
    this.setParameterRangeModified(type, false);
  }

  public getPaletteBackground(palette: GeoJsonMarkerColorPalette): string {
    return this.createPaletteBackground(palette);
  }

  public updateMarkerSizeScale(event: MatSliderChange): void {
    if (event.value == null) {
      return;
    }
    if (event.value !== this.markerSizeScale) {
      this.previewMarkerSizeScale(event);
    }
    this.markerSizeScale = event.value;
    const scale = this.markerSizeScale / 100;
    const style = this.getParameterStyle();
    style.size.minPx = this.baseMinMarkerSize * scale;
    style.size.maxPx = this.baseMaxMarkerSize * scale;
    this.appliedMarkerSizeScale = this.markerSizeScale;
    this.applyParameterStyle(style);
  }

  public previewMarkerSizeScale(event: MatSliderChange): void {
    if (event.value == null || !(this.layer instanceof GeoJsonLayer)) {
      return;
    }
    const previousScale = this.markerSizeScale;
    this.markerSizeScale = event.value;
    this.layer.getMarkerLayer().previewMarkerSizeScale(
      this.markerSizeScale / this.appliedMarkerSizeScale,
      previousScale / this.appliedMarkerSizeScale,
    );
  }

  public formatMarkerSizeScale(value: number): string {
    return `${value}%`;
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
    if (this.colorMode === 'parameter' || this.sizeMode === 'parameter') {
      void this.redrawLayer();
    }
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
    const markerValue = this.markerIcons.find(e => e.id === event.value)?.value.join(' ');
    if (markerValue == null) {
      return;
    }
    if (this.isExternalPointGeoJsonLayer && this.layer instanceof GeoJSONMapLayer) {
      this.markerType = MapLayer.MARKERTYPE_FA;
      this.selectedMarkerIcon = markerValue;
      this.layer.setMarkerOverride(markerValue);
      this.setTools();
      void this.redrawLayer().then(() => {
        this.layer.options.customLayerOptionMarkerValue.set(markerValue);
        this.layersService.layerChange(this.layer);
      });
      return;
    }
    const redrawAsIcon = this.isExternalPointGeoJsonLayer
      && this.layer.options.customLayerOptionMarkerType.get() === MapLayer.MARKERTYPE_POINT;
    if (redrawAsIcon) {
      this.markerType = MapLayer.MARKERTYPE_FA;
      this.layer.options.customLayerOptionMarkerType.set(this.markerType);
      this.setTools();
    }
    this.selectedMarkerIcon = markerValue;
    this.layer.options.customLayerOptionMarkerValue.set(markerValue);
    this.layersService.layerChange(this.layer);
    if (redrawAsIcon) {
      void this.redrawLayer();
    } else if (this.colorMode === 'parameter' || this.sizeMode === 'parameter') {
      void this.redrawLayer();
    }
  }

  private getParameterStyle(): GeoJsonMarkerParameterStyle {
    return this.layer instanceof GeoJsonLayer
      ? this.layer.getMarkerParameterStyle()
      : {
        color: { mode: 'fixed', property: null, paletteId: null, minValue: null, maxValue: null },
        size: { mode: 'fixed', property: null, minValue: null, maxValue: null, minPx: 10, maxPx: 70 },
      };
  }

  private applyParameterStyle(style: GeoJsonMarkerParameterStyle): void {
    if (!(this.layer instanceof GeoJsonLayer)) {
      return;
    }
    this.layer.setMarkerParameterStyle(style);
    this.colorMode = style.color.mode;
    this.colorProperty = style.color.property;
    this.colorPaletteId = style.color.paletteId;
    const colorRange = this.getParameterRange(style, 'color');
    this.colorMinValue = colorRange.min;
    this.colorMaxValue = colorRange.max;
    this.sizeMode = style.size.mode;
    this.sizeProperty = style.size.property;
    const sizeRange = this.getParameterRange(style, 'size');
    this.sizeMinValue = sizeRange.min;
    this.sizeMaxValue = sizeRange.max;
    this.updatePalettePreview();
    void this.redrawLayer().then(() => this.layersService.layerChange(this.layer));
  }

  private setParameterRangeFromProperty(
    style: GeoJsonMarkerParameterStyle,
    type: 'color' | 'size',
  ): void {
    const property = this.numericMarkerProperties.find(item => item.name === style[type].property);
    style[type].minValue = property?.min ?? null;
    style[type].maxValue = property?.max ?? null;
  }

  private getParameterRange(
    style: GeoJsonMarkerParameterStyle,
    type: 'color' | 'size',
  ): { min: number | null; max: number | null } {
    const property = this.numericMarkerProperties.find(item => item.name === style[type].property);
    return {
      min: style[type].minValue ?? property?.min ?? null,
      max: style[type].maxValue ?? property?.max ?? null,
    };
  }

  private setParameterRangeModified(type: 'color' | 'size', modified: boolean): void {
    if (type === 'color') {
      this.colorRangeModified = modified;
    } else {
      this.sizeRangeModified = modified;
    }
  }

  private syncParameterRangeInputs(
    type: 'color' | 'size',
    minInput: HTMLInputElement,
    maxInput: HTMLInputElement,
  ): void {
    const minValue = type === 'color' ? this.colorMinValue : this.sizeMinValue;
    const maxValue = type === 'color' ? this.colorMaxValue : this.sizeMaxValue;
    minInput.value = minValue == null ? '' : String(minValue);
    maxInput.value = maxValue == null ? '' : String(maxValue);
  }

  private initializeMarkerSizeScale(minPx: number, maxPx: number): void {
    this.baseMinMarkerSize = minPx;
    this.baseMaxMarkerSize = maxPx;
    this.markerSizeScale = 100;
    this.appliedMarkerSizeScale = 100;
    this.minMarkerSizeScale = Math.ceil((500 / minPx) / 5) * 5;
    this.maxMarkerSizeScale = Math.floor((10000 / maxPx) / 5) * 5;
  }

  private getAutomaticPaletteId(): string {
    if (!(this.layer instanceof GeoJsonLayer)) {
      return GeoJsonLayer.MARKER_COLOR_PALETTES[0].id;
    }
    const currentPaletteId = this.layer.getMarkerParameterStyle().color.paletteId;
    const paletteIds = this.layer.getEposLeaflet().getLayers()
      .filter(candidate => candidate !== this.layer && candidate instanceof GeoJsonLayer)
      .filter(candidate => !candidate.hidden.get())
      .filter(candidate => (candidate as GeoJsonLayer).getMarkerParameterStyle().color.mode === 'parameter')
      .map(candidate => (candidate as GeoJsonLayer).getMarkerParameterStyle().color.paletteId)
      .filter((paletteId): paletteId is string => paletteId != null);
    if (currentPaletteId != null && !paletteIds.includes(currentPaletteId)) {
      return currentPaletteId;
    }
    return GeoJsonLayer.MARKER_COLOR_PALETTES.reduce((selected, palette) => {
      const selectedUses = paletteIds.filter(id => id === selected.id).length;
      const paletteUses = paletteIds.filter(id => id === palette.id).length;
      return paletteUses < selectedUses ? palette : selected;
    }).id;
  }

  private updatePalettePreview(): void {
    if (!(this.layer instanceof GeoJsonLayer)) {
      this.colorPaletteBackground = '';
      return;
    }
    const palette = this.layer.getMarkerColorPalette();
    this.colorPaletteBackground = palette == null ? '' : this.createPaletteBackground(palette);
  }

  private createPaletteBackground(palette: GeoJsonMarkerColorPalette): string {
    return `linear-gradient(to right, ${palette.colors.map((color, index) => {
      return `${color} ${(index / (palette.colors.length - 1)) * 100}%`;
    }).join(', ')})`;
  }

  /**
   * The function redraws a layer on a map using the EposLeaflet library.
   */
  private redrawLayer(): Promise<void> {
    const map = this.layer.getEposLeaflet();
    this.redrawPromise = this.redrawPromise.then(
      () => map.redrawLayer(this.layer),
      () => map.redrawLayer(this.layer),
    );
    return this.redrawPromise;
  }

  private hasPointGeometry(value: unknown): boolean {
    if (value == null || typeof value !== 'object') {
      return false;
    }
    const geoJson = value as {
      type?: string;
      geometry?: unknown;
      geometries?: Array<unknown>;
      features?: Array<unknown>;
    };
    if (geoJson.type === 'Point' || geoJson.type === 'MultiPoint') {
      return true;
    }
    if (geoJson.type === 'Feature') {
      return this.hasPointGeometry(geoJson.geometry);
    }
    if (geoJson.type === 'FeatureCollection') {
      return geoJson.features?.some(feature => this.hasPointGeometry(feature)) ?? false;
    }
    if (geoJson.type === 'GeometryCollection') {
      return geoJson.geometries?.some(geometry => this.hasPointGeometry(geometry)) ?? false;
    }
    return false;
  }

  /**
   * The function sets the clustering option for a custom layer and triggers a redraw of the layer.
   * @param {boolean} clustering - A boolean value indicating whether clustering should be enabled or
   * disabled.
   */
  private setClustering(clustering: boolean) {
    this.layer.options.customLayerOptionClustering.set(clustering);
    this.layersService.layerChange(this.layer);

    if (this.layer.id.startsWith('external-layer-') && this.layer instanceof GeoJsonLayer) {
      this.layer.setClusteredMarkers(clustering);
    }

    const style = this.stylable?.getStyle();
    if (style !== undefined) {
      style?.setClustering(clustering);
      this.stylable?.setStyle(style, true);
    }

    void this.redrawLayer();
  }

  /**
   * The function sets the tools based on the marker type.
   */
  private setTools(): void {

    if (this.isExternalPointGeoJsonLayer
      && this.layer instanceof GeoJSONMapLayer
      && this.markerType === MapLayer.MARKERTYPE_POINT) {
      this.tools = {
        opacity: false,
        colorOpacity: true,
        fillColorOpacity: false,
        weight: false,
        changeMarker: 'font',
        size: true,
        cluster: true,
      };
      return;
    }

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
          changeMarker: this.isExternalPointGeoJsonLayer ? 'font' : '',
          size: this.isParameterStylingAvailable,
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
