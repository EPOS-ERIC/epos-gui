/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@angular/core';
import { DialogService } from 'components/dialog/dialog.service';
import { MatDialogRef } from '@angular/material/dialog';
import { CrsIncompatDialogComponent } from 'components/dialog/crsIncompatDialog/crsIncompatDialog.component';

export interface WmsCrsIncompat {
  layerName: string;   // MapLayer.name (human readable)
  subLayer: string;    // WMS sub-layer name (can be empty)
  crs: string;         // e.g., 'EPSG:3857'
}

@Injectable({
  providedIn: 'root',
})
export class WmsCrsNotifierService {

  private buffer: WmsCrsIncompat[] = [];
  private debounceId: any = null;
  private ref: MatDialogRef<CrsIncompatDialogComponent, boolean> | null = null;

  constructor(private dialogService: DialogService) {}

  /**
   * Shows a dedicated dialog listing WMS layers/sublayers that are not compatible
   * with the current CRS. Uses the new CrsIncompatDialog (no innerHTML).
   * Supports both the single-layer and multi-layer cases.
   */
  public async notifyIncompatibilities(notOk: WmsCrsIncompat[]): Promise<void> {
    if (!Array.isArray(notOk) || notOk.length === 0) { return; }

    // Accumulate and deduplicate into the buffer
    this.pushIntoBuffer(notOk);

    // Debounce: ensure only one dialog opens for bursts of calls
    if (this.debounceId) { clearTimeout(this.debounceId); }
    this.debounceId = setTimeout(() => { void this.openOrAppend(); }, 300);
  }

  /**
   * Adds items into the internal buffer with deduplication.
   * Dedup key is layerName|subLayer|CRS (uppercased).
   */
  private pushIntoBuffer(items: WmsCrsIncompat[]): void {
    const key = (x: WmsCrsIncompat) =>
      `${(x.layerName || '(Unnamed layer)')}|${(x.subLayer || '')}|${(x.crs || '').toUpperCase()}`;

    const existing = new Set(this.buffer.map(key));
    for (const it of items) {
      const k = key(it);
      if (!existing.has(k)) {
        this.buffer.push({ ...it, crs: (it.crs || '').toUpperCase() });
        existing.add(k);
      }
    }
  }

  /**
   * Opens a dialog or appends to it if already open.
   */
  private async openOrAppend(): Promise<void> {
    if (this.buffer.length === 0) { return; }

    const snapshot = this.buffer.slice();
    this.buffer = [];

    // Normalize names and assume single CRS per dialog
    const names = Array.from(new Set(snapshot.map(b => (b.layerName || '(Unnamed layer)').trim() || '(Unnamed layer)')));
    const crs = (snapshot[0]?.crs || '').toUpperCase();

    if (this.ref) {
      // Dialog already open → append live
      this.ref.componentInstance.appendLayers(names, crs);
      return;
    }

    // Open new dialog and keep the ref
    this.ref = this.dialogService.openCrsIncompatDialogRef(snapshot, {
      width: '720px',
      closable: true,
      title: 'Possible incompatibilities with the selected projection',
      noResize: false,
    });

    // Safety: if openCrsIncompatDialogRef returned null, bail out
    if (!this.ref) { return; }

    this.ref.afterClosed().subscribe(() => {
      this.ref = null;
      if (this.buffer.length > 0) {
        setTimeout(() => { void this.openOrAppend(); }, 50);
      }
    });
  }
}
