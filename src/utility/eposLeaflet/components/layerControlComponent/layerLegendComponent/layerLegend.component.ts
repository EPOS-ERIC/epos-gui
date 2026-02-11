import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MapLayer } from '../../layers/mapLayer.abstract';
import { Legend, LegendItem } from '../../controls/public_api';
import { Subscription } from 'rxjs';
import { GeoJSONMapLayer } from 'utility/maplayers/geoJSONMapLayer';
import { WmtsTileLayer } from 'utility/eposLeaflet/eposLeaflet';
import { LayersService } from 'utility/eposLeaflet/services/layers.service';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { MapInteractionService } from 'utility/eposLeaflet/services/mapInteraction.service';
import { GeoJSONHelper } from 'utility/maplayers/geoJSONHelper';
import { ExportMapAsImageService } from 'utility/eposLeaflet/services/exportMapAsImageService.service';
import { ChangeDetectorRef ,  NgZone } from '@angular/core';
import html2canvas from 'html2canvas';
import { environment } from 'environments/environment';

@Unsubscriber('subscriptions')
@Component({
  selector: 'app-layer-legend',
  templateUrl: './layerLegend.component.html',
  styleUrls: ['./layerLegend.component.scss']
})
export class LayerLegendComponent implements OnInit {

  /** The `@Input() showLabel = true;` is a decorator in TypeScript that marks the `showLabel` property as
  an input property. This means that the value of `showLabel` can be passed into the component from
  its parent component. */
  @Input() showLabel = true;

  /** The `@Input() showImage = true;` is a decorator in TypeScript that marks the `showImage` property as
  an input property. This means that the value of `showImage` can be passed into the component from
  its parent component. By default, the value of `showImage` is set to `true`, indicating that the
  component should display the image in the legend. However, if the parent component sets the value of
  `showImage` to `false`, the component will not display the image in the legend. */
  @Input() showImage = true;

  /** The `@ViewChild('legendContent') legendContent: ElementRef;` is a decorator in TypeScript that
  allows the component to access a child component or element in the template. In this case, it is
  used to get a reference to the `legendContent` element in the template, which is defined using the
  `#legendContent` template reference variable. The `ElementRef` type is used to access properties and
  methods of the DOM element. */
  @ViewChild('legendContent') legendContent: ElementRef;

  /** The line `protected subscriptions: Array<Subscription> = new Array<Subscription>();` is declaring a
  protected property called `subscriptions` of type `Array<Subscription>`. It is initializing this
  property with a new empty array of `Subscription` objects. This property is used to store
  subscriptions to observables, which can be unsubscribed from later to prevent memory leaks. */
  protected subscriptions: Array<Subscription> = new Array<Subscription>();

  /** The line `private _layer: MapLayer;` is declaring a private property called `_layer` of type
  `MapLayer`. This property is used to store the map layer that is passed into the component as an
  input. It can be accessed and used within the component to perform operations or retrieve
  information related to the map layer. */
  private _layer: MapLayer;

  private textWidthCache = new Map<string, number>();

  private measureCtx = (() => {
    const c = document.createElement('canvas');
    return c.getContext('2d')!;
  })();


  /**
   * The constructor function initializes the private variables http, renderer, and layersService.
   * @param {HttpClient} http - The `http` parameter is an instance of the `HttpClient` class, which is
   * used to send HTTP requests and receive HTTP responses in Angular applications.
   * @param {Renderer2} renderer - The `renderer` parameter is an instance of the `Renderer2` class.
   * The `Renderer2` class is a service provided by Angular that allows you to manipulate the DOM in a
   * way that is safe and efficient, regardless of the platform or environment. It provides methods for
   * creating, updating, and
   * @param {LayersService} layersService - The `layersService` parameter is an instance of the
   * `LayersService` class. It is used to interact with the layers in the application, such as adding
   * or removing layers, updating layer properties, etc.
   */

  constructor(
    private http: HttpClient,
    private renderer: Renderer2,
    private layersService: LayersService,
    private localStoragePersister: LocalStoragePersister,
    private mapInteractionService: MapInteractionService,
    private exportMapAsImageService: ExportMapAsImageService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,

  ) {
  }



  /** The `@Input() set layer(layer: MapLayer)` is a setter method for the `layer` input property. It is
  used to set the value of the `layer` property when it is passed into the component from its parent
  component. */
  @Input() set layer(layer: MapLayer) {
    this.getLegendContent(layer);
    this._layer = layer;
  }


  /**
   * The ngOnInit function subscribes to changes in the layersService's layerChangeSourceObs and calls
   * the updateLegendContent function.
   */
  ngOnInit(): void {
    this.subscriptions.push(
      this.layersService.layerChangeSourceObs.subscribe((layer: MapLayer) => {
        this.updateLegendContent();
      }),

      this.mapInteractionService.featureOnlayerToggle.subscribe((featureOnLayer: Map<string, Array<number> | string | boolean>) => {
        const imageOverlay = featureOnLayer.get('imageOverlay');
        let layerId = featureOnLayer.get('layerId') as string;

        if (imageOverlay) {
          layerId += GeoJSONHelper.IMAGE_OVERLAY_ID_SUFFIX;

          if (layerId === this._layer.id) {
            this.getLegendContent(this._layer);
          }
        }

        const wmtsLayerStorage = this.mapInteractionService.wmtsLayerStorage.value;
        if(wmtsLayerStorage && wmtsLayerStorage.has(this._layer.id)){
          const originatorConfig = wmtsLayerStorage.get(this._layer.id)?.originatorConfig;
          const mapLayersArray = (this._layer as WmtsTileLayer).getEposLeaflet().getLayers();
          if(originatorConfig){
            const defaultLayer = mapLayersArray.find((layerEl)=> layerEl.id === originatorConfig);
            if(defaultLayer != null && defaultLayer.id === this._layer.id){
              this.getLegendContent(this._layer);
            }
          }
        }

      }),

      this.exportMapAsImageService.downloadLegendsObservable.subscribe(() => {
        const stylable = this._layer?.options?.customLayerOptionStylable?.get?.();

        if (!stylable) {
          this.exportMapAsImageService.addLegendBlob(null, null);
          return;
        }

        const style = stylable.getStyle?.();
        const isEnabled = style?.getEnable?.();

        if (isEnabled) {
          this.exportMapAsImageService.incrementExpectedLegends();
          void this.exportLegendWithLogo(this._layer);
          void this.downloadLegendImages(this._layer);
        }
        else {
          this.exportMapAsImageService.addLegendBlob(null, null);
        }
      })

    );
  }



  private measureTextWidth(text: string, fontSize: number): number {
    if (!text) { return 0; }
    const key = `${fontSize}|${text}`;
    if (this.textWidthCache.has(key)) {
      return this.textWidthCache.get(key)!;
    }
    this.measureCtx.font = `${fontSize}px sans-serif`;
    const w = this.measureCtx.measureText(text).width;
    this.textWidthCache.set(key, w);
    return w;
  }

  // Helper method to load an image
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Required if the image is from another domain
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  }

  private sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase();
  }


  /**
   * The `getLegendContent` function retrieves legend data for a map layer and appends it to the DOM,
   * or displays a default image if no legend data is available.
   * @param {MapLayer} layer - The `layer` parameter is of type `MapLayer`.
   */
  private getLegendContent(layer: MapLayer): void {
    setTimeout(() => {
      (this.legendContent.nativeElement as HTMLElement).innerHTML = '';

      if (!(layer.options.get('paneType') !== 'geoJsonPane' && this.showImage === false)) {

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const dataSearchToggleOnMap: Array<string> = JSON.parse(this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_TOGGLE_ON_MAP) as string || '[]');
        void layer.getLegendData(this.http).then((legendArray: Array<Legend>) => {
          if (legendArray !== null) {
            legendArray.forEach((legend: Legend) => {
              (this.legendContent.nativeElement as HTMLElement).appendChild(legend.createDisplayContent(dataSearchToggleOnMap));
            });
          }
        });
      } else if (this.showImage === false) {

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('legend-details-grid');
        contentDiv.classList.add('nice-scrollbar');
        const contentRowDiv = document.createElement('div');
        contentRowDiv.classList.add('legend-details-row');

        const span = document.createElement('span');
        span.classList.add('legend-icon');

        const spanicon = document.createElement('span');
        spanicon.classList.add('material-icons');
        spanicon.innerHTML = 'image';
        span.appendChild(spanicon);
        contentRowDiv.appendChild(span);

        contentDiv.appendChild(contentRowDiv);

        (this.legendContent.nativeElement as HTMLElement).appendChild(contentDiv);
      }
    }, 100);

  }

  /**
   * The function `updateLegendContent` updates the legend content based on the style options of a
   * GeoJSONMapLayer.
   */
  private updateLegendContent(): void {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    if (typeof this._layer['getStylable'] === 'function') {
      const styleable = (this._layer as GeoJSONMapLayer).getStylable();

      if (styleable !== undefined) {
        const newstyle = styleable.getStyle();

        if (this._layer.options.customLayerOptionColor.get() !== null) {
          newstyle?.setColor1(this._layer.options.customLayerOptionColor.get()!.substring(1));
        }

        if (this._layer.options.customLayerOptionFillColor.get() !== null) {
          newstyle?.setColor2(this._layer.options.customLayerOptionFillColor.get()!.substring(1));
        }

        newstyle?.setOpacityColor1(this._layer.options.customLayerOptionOpacity.get() ?? 100);
        newstyle?.setOpacityColor2(this._layer.options.customLayerOptionFillColorOpacity.get() ?? 100);

        styleable.setStyle(newstyle);

        void (this._layer as GeoJSONMapLayer).updateLegend(styleable).then((legends: Array<Legend>) => {
          legends.forEach((legend: Legend) => {
            legend.legendItems.forEach((legendItem: LegendItem) => {
              if ((this.legendContent.nativeElement as HTMLElement).querySelector('span.legend-icon') !== null) {
                this.renderer.setProperty(
                  (this.legendContent.nativeElement as HTMLElement).querySelector('span.legend-icon'),
                  'innerHTML',
                  legendItem.getIconElement().innerHTML
                );
              }
            });
          });
        });
      }
    }
  }


// eslint-disable-next-line @typescript-eslint/member-ordering
public async downloadLegendImages(layer: MapLayer): Promise<void> {
    const container = this.legendContent?.nativeElement as HTMLElement | undefined;
    if (!container) {
      this.exportMapAsImageService.addLegendBlob(null, null);
      return;
    }

    const imgElements = Array.from(container.querySelectorAll<HTMLImageElement>('img'));
    if (!imgElements.length) {
      this.exportMapAsImageService.addLegendBlob(null, null);
      return;
    }

    this.exportMapAsImageService.incrementExpectedLegends(imgElements.length);


    // 1) Prepare URLs and load in parallel
    const logoUrl = environment.platformLogoPath;
    const uniqueUrls = new Set<string>(imgElements.map(img => img.src).filter(Boolean));
    uniqueUrls.add(logoUrl);

    const urlsArray = Array.from(uniqueUrls);
    const loadedImages = await Promise.all(urlsArray.map(u => this.loadImage(u)));
    const imageMap = new Map<string, HTMLImageElement>();
    urlsArray.forEach((u, i) => imageMap.set(u, loadedImages[i]));

    // 2) Pre-compute text measurements
    const padding         = 20;
    const bandPadding     = 10;
    const minWidth        = 200;
    const iconLabelSpace  = 8;
    const lineSpacing     = 4;
    const fontSize        = 16;
    const titleText       = layer.name || '';
    const titleWidth      = titleText ? this.measureTextWidth(titleText, fontSize) : 0;

    const labelMap = new Map<string, { text: string; width: number }>();
    imgElements.forEach(img => {
      const txt = img.closest('.legend-details-row')
                  ?.querySelector<HTMLElement>('.legend-label')
                  ?.textContent?.trim() || '';
      const w = txt ? this.measureTextWidth(txt, fontSize) : 0;
      labelMap.set(img.src, { text: txt, width: w });
    });

    // 3) Reuse one canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    let index = 0;

    // Loop only over legend URLs (exclude logo)
    for (const src of urlsArray.filter(u => u !== logoUrl)) {
      const image   = imageMap.get(src)!;
      const logoImg = imageMap.get(logoUrl)!;
      const { text: labelText, width: labelWidth } = labelMap.get(src)!;

      // Compute sizes
      const logoW      = 100;
      const logoH      = (logoImg.height / logoImg.width) * logoW;
      const imgW       = image.width;
      const imgH       = image.height;
      const whiteH     = imgH + bandPadding * 2 + (labelText ? fontSize + iconLabelSpace : 0);
      const titleH     = titleText ? fontSize + lineSpacing : 0;
      const maxContent = Math.max(imgW, logoW, labelWidth, titleWidth, minWidth);
      const canvasW    = maxContent + padding * 2;
      const canvasH    = padding + logoH + padding + whiteH + padding + titleH + padding;

      canvas.width  = canvasW;
      canvas.height = canvasH;
      ctx.clearRect(0, 0, canvasW, canvasH);

      // 1) Grey background
      ctx.fillStyle = 'grey';
      ctx.fillRect(0, 0, canvasW, canvasH);

      // 2) Draw logo (centered at top)
      ctx.drawImage(logoImg, (canvasW - logoW) / 2, padding, logoW, logoH);

      // 3) White band and icon
      const bandY = padding + logoH + padding;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, bandY, canvasW, whiteH);

      const iconX = (canvasW - imgW) / 2;
      const iconY = bandY + bandPadding;
      ctx.drawImage(image, iconX, iconY);

      // 4) Label under icon
      if (labelText) {
        ctx.fillStyle    = 'black';
        ctx.font         = `${fontSize}px sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(labelText, canvasW / 2, iconY + imgH + iconLabelSpace);
      }

      // 5) Layer title below band
      if (titleText) {
        ctx.fillStyle    = 'white';
        ctx.font         = `${fontSize}px sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(titleText, canvasW / 2, bandY + whiteH + padding);
      }

      // 6) Export blob
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
      if (blob) {
        const filename = this.sanitizeFilename(`${layer.name}_legend_${++index}`);
        this.exportMapAsImageService.addLegendBlob(blob, `${filename}.png`);
      }
    }
  }


// eslint-disable-next-line @typescript-eslint/member-ordering
public async exportLegendWithLogo(layer: MapLayer): Promise<void> {
  if (!this.showImage) { return; }

  const container = this.legendContent.nativeElement as HTMLElement;
  const rows = Array.from(container.querySelectorAll<HTMLElement>('.legend-details-row'));
  if (!rows.length) {
    this.exportMapAsImageService.addLegendBlob(null, null);
    return;
  }

  this.exportMapAsImageService.incrementExpectedLegends(rows.length);

  // 1) Load the logo once
  const logoUrl = environment.platformLogoPath;
  const logoImg = await this.loadImage(logoUrl);
  const logoW = 100;
  const logoH = (logoImg.height / logoImg.width) * logoW;

  // 2) Constants & pre-compute title metrics
  const padding         = 20;
  const minWidth        = 200;
  const fontSize        = 16;
  const cornerRadius    = 8;
  const lineSpacing     = 4;
  const iconLabelSpace  = 8;
  const titleText       = layer.name || '';
  const titleWidth      = titleText ? this.measureTextWidth(titleText, fontSize) : 0;

  // 3) Identify which rows have a native <img> and preload those in parallel
  const nativeRows = rows
    .map(row => ({ row, src: (row.querySelector('img') as HTMLImageElement)?.src }))
    .filter(({ src }) => !!src) as { row: HTMLElement; src: string }[];

  const nativePromises = nativeRows.map(({ src }) => this.loadImage(src!));
  const nativeImages = await Promise.all(nativePromises);
  const nativeMap = new Map<string, HTMLImageElement>();
  nativeRows.forEach(({ src }, i) => nativeMap.set(src!, nativeImages[i]));

  // 4) Pre-measure every label text
  const labelInfo = new Map<HTMLElement, { text: string; width: number }>();
  rows.forEach(row => {
    const lblEl = row.querySelector<HTMLElement>('.legend-label');
    const text  = lblEl?.textContent?.trim() || '';
    const w     = text ? this.measureTextWidth(text, fontSize) : 0;
    labelInfo.set(row, { text, width: w });
  });

  // 5) Prepare one canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  let count = 0;

  for (const row of rows) {
    try {
      const { text: labelText, width: labelWidth } = labelInfo.get(row)!;
      const titleTextNonNull = titleText;
      const titleW = titleWidth;

      // Decide if we use native image or rasterize with html2canvas
      let iconImg: HTMLImageElement;
      let iconW: number;
      let iconH: number;
      let bandPad: number;

      const native = row.querySelector('img') as HTMLImageElement | null;
      if (native && nativeMap.has(native.src)) {
        // use preloaded native
        iconImg = nativeMap.get(native.src)!;
        iconW = iconImg.width;
        iconH = iconImg.height;
        bandPad = 4;
      } else {
        // rasterize via html2canvas (unchanged logic)
        const clone = row.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('img, .marker-gradient, .fa-marker-icon-icon, .legend-label')
             .forEach(el => el.remove());
        clone.querySelectorAll<HTMLElement>('.legend-icon > span')
             .forEach(span => span.style.display = 'inline-block');

        const wrapper = document.createElement('div');
        Object.assign(wrapper.style, {
          position: 'absolute', left: '-9999px', top: '-9999px',
          background: 'transparent', margin: '0', padding: '5px'
        });
        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);

        await document.fonts?.ready;
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        const raster = await html2canvas(wrapper, { backgroundColor: null, useCORS: true, scale: 1 });
        iconImg = new Image();
        iconImg.src = raster.toDataURL();
        await new Promise(r => (iconImg.onload = r));
        document.body.removeChild(wrapper);

        iconW = iconImg.width;
        iconH = iconImg.height;
        bandPad = Math.ceil(iconH / 2) + 4;
      }

      // 6) Compute dimensions
      const whiteBandH   = iconH + bandPad * 2 + (labelText ? fontSize + iconLabelSpace : 0);
      const titleAreaH   = titleTextNonNull ? fontSize + lineSpacing : 0;
      const contentMaxW  = Math.max(iconW, logoW, labelWidth, titleW, minWidth);
      const canvasW      = contentMaxW + padding * 2;
      const canvasH      = padding + logoH + padding + whiteBandH + padding + titleAreaH + padding;

      canvas.width  = canvasW;
      canvas.height = canvasH;
      ctx.clearRect(0, 0, canvasW, canvasH);

      // 7) Draw background & logo
      ctx.fillStyle = 'grey';
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.drawImage(logoImg, (canvasW - logoW) / 2, padding, logoW, logoH);

      // 8) White band + clipped icon
      const bandY = padding + logoH + padding;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, bandY, canvasW, whiteBandH);

      const iconX = (canvasW - iconW) / 2;
      const iconY = bandY + bandPad;
      ctx.save();
      ctx.beginPath();
      // rounded rect path
      ctx.moveTo(iconX + cornerRadius, iconY);
      ctx.lineTo(iconX + iconW - cornerRadius, iconY);
      ctx.quadraticCurveTo(iconX + iconW, iconY, iconX + iconW, iconY + cornerRadius);
      ctx.lineTo(iconX + iconW, iconY + iconH - cornerRadius);
      ctx.quadraticCurveTo(iconX + iconW, iconY + iconH, iconX + iconW - cornerRadius, iconY + iconH);
      ctx.lineTo(iconX + cornerRadius, iconY + iconH);
      ctx.quadraticCurveTo(iconX, iconY + iconH, iconX, iconY + iconH - cornerRadius);
      ctx.lineTo(iconX, iconY + cornerRadius);
      ctx.quadraticCurveTo(iconX, iconY, iconX + cornerRadius, iconY);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(iconImg, iconX, iconY);
      ctx.restore();

      // 9) Label & title
      if (labelText) {
        ctx.fillStyle    = 'black';
        ctx.font         = `${fontSize}px sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(labelText, canvasW / 2, iconY + iconH + iconLabelSpace);
      }
      if (titleTextNonNull) {
        ctx.fillStyle    = 'white';
        ctx.font         = `${fontSize}px sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(titleTextNonNull, canvasW / 2, bandY + whiteBandH + padding);
      }

      // 10) Export
      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
      if (blob) {
        const fn = this.sanitizeFilename(`${layer.name}_legend_${++count}`);
        this.exportMapAsImageService.addLegendBlob(blob, `${fn}.png`);
      }
    } catch (err) {
      console.error('Error exporting legend row:', err);
    }
  }
}



}
