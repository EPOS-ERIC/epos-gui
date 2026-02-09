import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogData } from '../baseDialogService.abstract';

export interface WmsCrsIncompat {
  layerName: string;   // human readable
  subLayer?: string;   // not used in UI, but kept for future
  crs: string;         // e.g. 'EPSG:3857'
}

export interface CrsIncompatDataIn {
  title?: string;
  items: WmsCrsIncompat[];
}

export type CrsIncompatDataOut = boolean;

@Component({
  selector: 'app-crs-incompat-dialog',
  templateUrl: './crsIncompatDialog.component.html',
  styleUrls: ['./crsIncompatDialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrsIncompatDialogComponent {
  readonly dialogTitle: string;
  readonly closable: boolean;

  /** we assume a single CRS; take it from the first item */
  readonly currentCrs: string;

  /** internal store for layer names (dedup) */
  private readonly layersSet = new Set<string>();

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: DialogData<CrsIncompatDataIn, CrsIncompatDataOut>,
    private ref: MatDialogRef<CrsIncompatDialogComponent, CrsIncompatDataOut>,
    private cdr: ChangeDetectorRef,
  ) {
    this.dialogTitle = data?.dataIn?.title ?? 'Possible incompatibilities with the selected projection';
    this.closable = !!data?.closable;

    const items = data?.dataIn?.items ?? [];
    this.currentCrs = (items[0]?.crs ?? '').toUpperCase();

    for (const it of items) {
      const name = (it.layerName ?? '').trim() || '(Unnamed layer)';
      this.layersSet.add(name);
    }
  }

  /** unified view: single or multiple is the same → one row per layer */
  get layersForView(): string[] {
    return Array.from(this.layersSet).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Called by the Notifier/Service to append new layers while the dialog is open.
   * Optional `crs` is ignored if different (we assume a single CRS in this dialog).
   */
  appendLayers(layers: string[], crs?: string): void {
    for (const raw of layers) {
      const name = (raw ?? '').trim() || '(Unnamed layer)';
      this.layersSet.add(name);
    }
    this.cdr.markForCheck(); // OnPush → request re-render
  }

  onOk(): void {
    this.ref.close(true);
  }
}
