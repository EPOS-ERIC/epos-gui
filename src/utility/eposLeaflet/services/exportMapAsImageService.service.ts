/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { Injectable , EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface NamedBlob {
  name: string;
  blob: Blob;
}
@Injectable({
  providedIn: 'root',
})

export class ExportMapAsImageService {
  private blobs: NamedBlob[] = [];

  private mapReady = false;
  private legendsReady = false;

  /** Numero di legende che ci aspettiamo di ricevere */
  private expectedLegends = 0;
  /** Contatore di legende effettivamente aggiunte */
  private receivedLegends = 0;

  private completeSubject = new Subject<void>();

  private readonly downloadLegends = new EventEmitter<void>();
  public downloadLegendsObservable = this.downloadLegends.asObservable();

  private readonly addControls = new EventEmitter<void>();
  public addControlsObservable = this.addControls.asObservable();

  private readonly removeControls = new EventEmitter<void>();
  public removeControlsObservable = this.removeControls.asObservable();

  constructor(){}

  public triggerDownloadLegends() {
    this.downloadLegends.emit();
  }
  public addMapControls(){
    this.addControls.emit();
  }
  public removeMapControls(){
    this.removeControls.emit();
  }
  public exportCompleteSubject(){
    this.completeSubject.next();
  }

  /**
   * Updates the expected number of legends and adjusts the state of received legends and readiness.
   *
   * @param count - The number of legends to set or increment.
   *                If greater than 1, it directly sets the expected legends to the given count.
   *                Defaults to 1 for incrementing behavior.
   *
   * Behavior:
   * - If `count > 1`, the method sets `expectedLegends` to the given count, resets `receivedLegends` to 0,
   *   and updates `legendsReady` to `true` if the count is 0.
   * - If `count <= 1` (default behavior), it increments `expectedLegends` by 1 unless it is already 0,
   *   in which case it resets `receivedLegends` to 0 and sets `legendsReady` to `false`.
   */
  public incrementExpectedLegends(count: number = 1): void {
    // overload: se passi count>1, imposti directly
    if (count > 1) {
      this.expectedLegends = count;
      this.receivedLegends = 0;
      this.legendsReady = count === 0;
    } else {
      // default bahvior
      if (this.expectedLegends === 0) {
        this.receivedLegends = 0;
        this.legendsReady = false;
      }
      this.expectedLegends++;
    }
  }

  /**
   * Adds a legend blob to the collection and tracks the number of received legends.
   * If the blob is invalid (null, undefined, or empty) or the name is not provided,
   * it still increments the count of received legends. Once the number of received
   * legends reaches the expected count, the legends are marked as ready.
   * Finally, it attempts to create a ZIP archive of the collected blobs.
   *
   * @param blob - The Blob object representing the legend. Can be null, undefined, or empty.
   * @param name - The name associated with the legend blob. Can be null or undefined.
   */
  public addLegendBlob(blob: Blob | null | undefined, name: string | null | undefined) {
    if (!blob || blob.size === 0 || !name) {
      // anche se invalido, comunque contiamo come "ricevuto"
      this.receivedLegends++;
    } else {
      this.blobs.push({ name, blob });
      this.receivedLegends++;
    }
    // Se abbiamo raggiunto il numero atteso, consideriamo le legende pronte
    if (this.receivedLegends >= this.expectedLegends) {
      this.legendsReady = true;
    }
    this.tryZip();
  }


  /**
   * Adds a map blob to the list of blobs and marks the map as ready.
   * If no legends are defined, assumes there are none and marks legends as ready.
   * Triggers the zipping process if all conditions are met.
   *
   * @param blob - The map blob to be added.
   * @param name - The name of the map blob.
   */
  public addMapBlob(blob: Blob, name: string) {
    this.blobs.push({ name, blob });
    this.mapReady = true;

    // If no legends are defined, assume there are none
    if (this.expectedLegends === 0 && this.receivedLegends === 0) {
      this.legendsReady = true;
    }

    this.tryZip();
  }


  /**
   * Attempts to create a ZIP file containing all the blobs stored in the `blobs` array
   * and triggers a download of the ZIP file. This method is executed only if both
   * `mapReady` and `legendsReady` flags are set to `true`.
   *
   * The method performs the following steps:
   * 1. Creates a new ZIP archive using the `JSZip` library.
   * 2. Iterates over the `blobs` array and adds each blob to the ZIP archive.
   * 3. Generates the ZIP file as a Blob and triggers its download using the `saveAs` function.
   * 4. Resets the state variables (`mapReady`, `legendsReady`, `blobs`, `expectedLegends`, `receivedLegends`)
   *    to their initial values.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves when the ZIP file is successfully created and downloaded.
   *
   * @remarks
   * - This method relies on the `JSZip` library for ZIP file creation and the `saveAs` function for file download.
   * - Ensure that `mapReady` and `legendsReady` are properly set before invoking this method.
   * - The `blobs` array should contain objects with `name` and `blob` properties.
   */
  private async tryZip() {
    if (this.mapReady && this.legendsReady) {
      const zip = new JSZip();
      for (const item of this.blobs) {
        zip.file(item.name, item.blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'epos-map-legends.zip');

      this.mapReady = false;
      this.legendsReady = false;
      this.blobs = [];
      this.expectedLegends = 0;
      this.receivedLegends = 0;
    }
  }
}
