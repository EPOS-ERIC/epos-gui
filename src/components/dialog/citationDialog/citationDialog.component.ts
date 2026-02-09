import { Component, Inject, OnInit } from '@angular/core';
import { DistributionDetails } from '../../../api/webApi/data/distributionDetails.interface';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogData } from '../baseDialogService.abstract';
import { CitationsService } from '../../../services/citations.service';

export interface CitationsDataIn {
  distributionDetails: DistributionDetails;
  citationsToShow: number[];
}

@Component({
  selector: 'app-citation-dialog',
  templateUrl: './citationDialog.component.html',
  styleUrls: ['./citationDialog.component.scss'],
})
export class CitationDialogComponent implements OnInit {

  public citation: string;
  public isLoading = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData<CitationsDataIn>,
    private citationService: CitationsService,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const citationResponse = await this.citationService.getDatasetCitation(this.data.dataIn.distributionDetails);
      this.citation = citationResponse.citation;
    } catch (error) {
      this.citation = 'Unable to load citation.';
    } finally {
      this.isLoading = false;
    }
  }

  public closeDialog(): void {
    this.data.close();
  }

  /**
   * Copies the plain text content of a citation to the clipboard.
   * This method parses the provided HTML string, extracts its visible text content,
   * and copies it using the Clipboard API, excluding any HTML tags or formatting.
   *
   * @param {string} htmlString - The citation content as an HTML string.
   *                              The method will strip tags and copy only the visible text.
   */
  public copyCitationToClipboard(htmlString: string): void {
    const tempDiv = document.createElement('div');
    // Sostituisci <br> con \n PRIMA di assegnare innerHTML
    tempDiv.innerHTML = htmlString.replace(/<br\s*\/?>/gi, '\n');

    const plainText = (tempDiv.textContent || tempDiv.innerText || '').trim();

    navigator.clipboard.writeText(plainText).then(() => {
      console.log('Citation copied to clipboard.');
    }).catch(err => {
      console.error('Failed to copy citation:', err);
    });
  }
}
