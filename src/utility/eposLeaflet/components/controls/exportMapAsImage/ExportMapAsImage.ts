/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as L from 'leaflet';
import { AbstractControl } from '../abstractControl/abstractControl';
import { ComponentFactoryResolver, ComponentRef, Injector, ViewContainerRef } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ExportMapAsImageService } from 'utility/eposLeaflet/services/exportMapAsImageService.service';
import { DialogService } from 'components/dialog/dialog.service';
import { environment } from 'environments/environment';
import domtoimage from 'dom-to-image-more';
import html2canvas from 'html2canvas';


export class ExportMapAsImage extends AbstractControl {
  private spinnerRef: ComponentRef<MatProgressSpinner> | null = null;
  constructor(
    private injector: Injector,
    private componentFactoryResolver: ComponentFactoryResolver,
    private viewContainerRef: ViewContainerRef,
    private exportMapAsImageService: ExportMapAsImageService,
    private dialogService: DialogService,
  ) {
    super({ position: 'topright' });

  }


  /**
   * `showSpinner` function is used to dynamically creates the spinner using Angular's ComponentFactoryResolverPositions.
   *  then the spinner will be shown in the center of the screen .
   *  To make sure that the spinner appears above all other UI elements by setting a high z-index
   */
  public showSpinner(): void {
    if (!this.viewContainerRef) {
      return;
    }
    // The spinnerFactory is used to create spinner by using angular material.
    const spinnerFactory = this.componentFactoryResolver.resolveComponentFactory(MatProgressSpinner);
    // The viewContainerRef is used to dynamically insert Angular components in order to show the spinner.
    this.spinnerRef = this.viewContainerRef.createComponent(spinnerFactory);
    if (this.spinnerRef) {
      // Set properties and variables for the spinner
      this.spinnerRef.instance.diameter = 100;
      this.spinnerRef.instance.mode = 'indeterminate';
      // Create a spinner container to hold the spinner
      const spinnerContainer = document.createElement('div');
      spinnerContainer.style.position = 'absolute';
      spinnerContainer.style.top = '50%';
      spinnerContainer.style.left = '50%';
      spinnerContainer.style.transform = 'translate(-50%, -50%)';
      spinnerContainer.style.zIndex = '9999';

      // Append the spinner to the container
      spinnerContainer.appendChild(this.spinnerRef.location.nativeElement);

      // Append the container to the body
      document.body.appendChild(spinnerContainer);
    }
  }
  /**
   * `hideSpinner` function is used to dynamically hide the spinner by targetting spinnerRef
   */
  public hideSpinner(): void {
    if (this.spinnerRef) {
      this.spinnerRef.destroy();
      this.spinnerRef = null;
    }
  }


  public onAdd(map: L.Map): HTMLElement {
    const controlContainer: HTMLElement = this.getControlContainerForActionOnly(
      'export-map-image-control',
      'fa fa-download',
      'Export map as image',
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      async () => {
        const confirmed = await this.confrimDownloadImagesLegends();
        if (confirmed !== true) { return; }

        this.exportMapAsImageService.triggerDownloadLegends();
        this.exportMapAsImageService.removeMapControls();
        await this.exportMapImage(map);
      }
    );

    return controlContainer;
  }

  private async confrimDownloadImagesLegends(): Promise<boolean> {
    return this.dialogService.openConfirmationDialog(
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Are you sure you want to export the map image and legends? &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p> ',
       true, // Dialog is closable by clicking outside
      'Export', // Text for the confirm button
      'confirm', // CSS class for the confirm button
      'Cancel' // Text for the cancel button
    );
  }

  /**
   * Exports the current view of the provided Leaflet map as an image.
   *
   * This method first checks if the map contains any WMS layers. If a WMS layer is present,
   * it uses a fallback export method based on `dom-to-image` due to potential rendering issues
   * with WMS layers in other libraries. If no WMS layers are detected, it attempts to export
   * the map using `html2canvas`. If this attempt fails for any reason, it falls back to the
   * `dom-to-image` method.
   *
   * @param map - The Leaflet map instance to export as an image.
   * @returns A Promise that resolves when the export operation is complete.
   */
  public async exportMapImage(map: L.Map): Promise<void> {
    const wmsPresent = this.hasWmsLayer(map);

    if (wmsPresent) {
      return this.exportWithDomToImage(map);
    }

    try {
      await this.exportWithHtml2Canvas(map);
    } catch (err) {
      await this.exportWithDomToImage(map);
    }
  }

  /**
   * Exports the current Leaflet map view as a PNG image with an overlaid logo.
   * Handles CORS-blocked images by temporarily replacing them with placeholders,
   * captures the map using `dom-to-image`, and returns a `NamedBlob` containing
   * the final image and a filename.
   *
   * @param map The Leaflet map instance to capture.
   * @returns A Promise resolving to a `NamedBlob` with the image and filename.
   */
  private async exportWithDomToImage(map: L.Map): Promise<void> {
    try {

      this.showSpinner();

      // Wait until the map is fully ready
      await new Promise<void>((resolve) => map.whenReady(() => resolve()));

      const mapContainer = map.getContainer();

      const scale = 3;
      const width = mapContainer.clientWidth * scale;
      const height = mapContainer.clientHeight * scale;

      // Generate PNG from the map container at higher resolution
      let dataUrl: string;
      try {

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        dataUrl = await domtoimage.toPng(mapContainer, {
          bgcolor: '#ffffff',
          width,
          height,
          quality: 1,
          style: {
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: `${mapContainer.clientWidth}px`,
            height: `${mapContainer.clientHeight}px`,
          }
        });
      } catch (err) {
        if (err instanceof Error) {
          console.error('Error generating PNG:', err.message);
          throw err;
        } else if (err instanceof Event) {
          console.error('Unhandled DOM event error:', err);
          throw new Error('Export failed due to a DOM event.');
        } else {
          console.error('Unknown error:', err);
          throw new Error('Unknown export error: ' + JSON.stringify(err));
        }
      }

      // Load map image and prepare final canvas
      const mapImage = await this.loadImage(dataUrl);
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = width;
      finalCanvas.height = height;
      const ctx = finalCanvas.getContext('2d');
      if (!ctx) { throw new Error('Failed to get canvas context'); }

      ctx.drawImage(mapImage, 0, 0, width, height);

      // Load and draw logo
      const logo = await this.loadImage(environment.platformLogoPath);
      const logoWidth = 100 * scale;
      const logoHeight = (logo.height / logo.width) * logoWidth;

      ctx.globalAlpha = 0.8;
      ctx.drawImage(logo, 10 * scale, 10 * scale, logoWidth, logoHeight);
      ctx.globalAlpha = 1.0;

      // Convert the canvas to a PNG Blob
      const blob = await new Promise<Blob | null>((resolve) =>
        finalCanvas.toBlob((b) => resolve(b), 'image/png')
      );
      if (!blob) { throw new Error('Failed to generate map image blob'); }

      const filename = `epos_map_export_${Date.now()}.png`;
      this.exportMapAsImageService.addMapBlob(blob, filename);
    } catch (error) {
      console.error('Error generating map image:', error);
      throw error;
    } finally {
      this.hideSpinner();
      this.exportMapAsImageService.addMapControls();
    }
  }

  /**
   * Exports the current Leaflet map view as a PNG image using html2canvas.
   * This method captures the map container, draws it onto a high-resolution canvas,
   * overlays a logo, and exports the result as a PNG Blob.
   * The exported image is then passed to the ExportMapAsImageService.
   *
   * @param map The Leaflet map instance to capture.
   * @returns A Promise that resolves when the export operation is complete.
   */
  private async exportWithHtml2Canvas(map: L.Map): Promise<void> {
    try {
      this.showSpinner();

      // 1) Wait until the map is ready
      await new Promise<void>(resolve => map.whenReady(() => resolve()));

      const container = map.getContainer();
      const scale = 3;
      const width = container.clientWidth * scale;
      const height = container.clientHeight * scale;

      // 2) Capture the container with html2canvas
      const sourceCanvas: HTMLCanvasElement = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale,                                // internal rendering scale
        useCORS: true,                        // for cross-origin tiles and images
        logging: false
      });

      // 3) Draw onto a high-resolution canvas
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = width;
      finalCanvas.height = height;
      const ctx = finalCanvas.getContext('2d');
      if (!ctx) { throw new Error('Failed to get canvas context'); }

      // If html2canvas already applied the scale, just drawImage directly:
      ctx.drawImage(sourceCanvas, 0, 0, width, height);

      // 4) Overlay the logo
      const logo = await this.loadImage(environment.platformLogoPath);
      const logoW = 100 * scale;
      const logoH = (logo.height / logo.width) * logoW;

      ctx.globalAlpha = 0.8;
      ctx.drawImage(logo, 10 * scale, 10 * scale, logoW, logoH);
      ctx.globalAlpha = 1.0;

      // 5) Export as Blob and pass to the service
      const blob: Blob | null = await new Promise(res =>
        finalCanvas.toBlob(b => res(b), 'image/png')
      );
      if (!blob) { throw new Error('Failed to generate map image blob'); }

      const filename = `epos_map_export_${Date.now()}.png`;
      this.exportMapAsImageService.addMapBlob(blob, filename);

    } catch (error) {
      console.error('Error generating map image with html2canvas:', error);
      throw error;
    } finally {
      this.hideSpinner();
      this.exportMapAsImageService.addMapControls();
    }
  }


  /**
   * Checks whether the given Leaflet map contains at least one WMS (Web Map Service) layer.
   *
   * This method traverses all layers in the provided map, including nested layers within LayerGroups,
   * and returns `true` if any layer is identified as a WMS layer. The detection is performed by checking
   * if the layer is an instance of `L.TileLayer.WMS` or if it contains the `wmsParams` property, which is
   * commonly present in WMS layers. This approach ensures compatibility with different Leaflet builds.
   *
   * @param map - The Leaflet map instance to inspect for WMS layers.
   * @returns `true` if a WMS layer is found in the map; otherwise, `false`.
   */
  private hasWmsLayer(map: L.Map): boolean {
    let found = false;

    const checkLayer = (layer: L.Layer) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      if (layer instanceof (L as any).TileLayer.WMS) {
        found = true;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      else if ((layer as any).wmsParams) {
        found = true;
      }
      // Se è un gruppo, vai dentro
      else if (layer instanceof L.LayerGroup) {
        (layer as L.LayerGroup).eachLayer(checkLayer);
      }
    };

    map.eachLayer(checkLayer);
    return found;
  }


  /** `loadImage` function is used to Loads an image from a specified URL.
   * It will returns the image element (HTMLImageElement) once it has been successfully loaded.
   * It will rejects the promise with an error if the image fails to load.
   */
  private async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

}
