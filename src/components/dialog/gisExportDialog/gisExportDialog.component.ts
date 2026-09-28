import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationService } from 'services/notification.service';
import { MapLayer } from 'utility/eposLeaflet/eposLeaflet';
import {
  GisExportService,
  GisExportSnapshot,
  GisMapServiceLayer,
  GisVectorLayer,
} from 'utility/eposLeaflet/services/gisExport.service';
import { DialogData } from '../baseDialogService.abstract';

export interface GisExportDialogDataIn {
  layers: Array<MapLayer>;
}

@Component({
  selector: 'app-gis-export-dialog',
  templateUrl: './gisExportDialog.component.html',
  styleUrls: ['./gisExportDialog.component.scss'],
})
export class GisExportDialogComponent {
  public readonly snapshot: GisExportSnapshot;
  public exporting = false;
  public exportError = '';
  public copiedServiceId: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData<GisExportDialogDataIn>,
    private readonly gisExportService: GisExportService,
    private readonly notificationService: NotificationService,
  ) {
    this.snapshot = this.gisExportService.createSnapshot(data.dataIn.layers);
  }

  public get selectedLayers(): Array<GisVectorLayer> {
    return this.snapshot.vectorLayers.filter(layer => layer.selected);
  }

  public get allSelected(): boolean {
    return this.snapshot.vectorLayers.length > 0
      && this.selectedLayers.length === this.snapshot.vectorLayers.length;
  }

  public get someSelected(): boolean {
    return this.selectedLayers.length > 0 && !this.allSelected;
  }

  public toggleAll(selected: boolean): void {
    this.snapshot.vectorLayers.forEach(layer => {
      layer.selected = selected;
    });
  }

  public async exportSelected(): Promise<void> {
    if (this.exporting || this.selectedLayers.length === 0) {
      return;
    }

    this.exporting = true;
    this.exportError = '';
    try {
      const result = await this.gisExportService.export(this.selectedLayers);
      const failedLayers = result.layers.filter(layer => layer.error != null);
      const skippedFeatures = result.layers.reduce((total, layer) => total + layer.skippedFeatures, 0);

      if (result.fileName == null) {
        this.exportError = failedLayers.map(layer => `${layer.layerName}: ${layer.error}`).join(' | ')
          || 'No valid features were available for export.';
        this.notificationService.sendErrorNotification('The GeoPackage could not be created.', 'GIS export');
        return;
      }

      if (failedLayers.length > 0 || skippedFeatures > 0) {
        this.notificationService.sendNotification(
          'GIS export completed with warnings',
          `${failedLayers.length} layer(s) and ${skippedFeatures} invalid feature(s) were skipped.`,
          NotificationService.TYPE_WARNING,
          6000
        );
      } else {
        this.notificationService.sendPositiveNotification(result.fileName, 'GIS export completed');
      }
      this.data.close();
    } catch (error) {
      this.exportError = error instanceof Error ? error.message : 'Unable to create the GeoPackage.';
      this.notificationService.sendErrorNotification('The GeoPackage could not be created.', 'GIS export');
    } finally {
      this.exporting = false;
    }
  }

  public cancel(): void {
    if (!this.exporting) {
      this.data.close();
    }
  }

  public async copyServiceUrl(service: GisMapServiceLayer): Promise<void> {
    if (service.url === '') {
      return;
    }
    try {
      if (navigator.clipboard != null) {
        try {
          await navigator.clipboard.writeText(service.url);
        } catch {
          this.copyWithTextArea(service.url);
        }
      } else {
        this.copyWithTextArea(service.url);
      }
      this.copiedServiceId = service.id;
    } catch {
      this.notificationService.sendErrorNotification('The service URL could not be copied.', 'GIS export');
    }
  }

  public trackById(_index: number, layer: { id: string }): string {
    return layer.id;
  }

  private copyWithTextArea(value: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = value;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    try {
      textArea.select();
      if (!document.execCommand('copy')) {
        throw new Error('Copy command was rejected.');
      }
    } finally {
      document.body.removeChild(textArea);
    }
  }
}
