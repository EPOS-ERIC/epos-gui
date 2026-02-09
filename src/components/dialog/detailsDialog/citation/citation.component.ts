import { Component, Input, OnInit } from '@angular/core';
import { DistributionDetails } from '../../../../api/webApi/data/distributionDetails.interface';
import { MatTableDataSource } from '@angular/material/table';
import { Citation, CitationsService } from '../../../../services/citations.service';

@Component({
  selector: 'app-citation-component',
  templateUrl: './citation.component.html',
  styleUrls: ['./citation.component.scss'],
})
export class CitationComponent implements OnInit {
  // Input data for the component
  @Input() detailsData: DistributionDetails;

  // Get which citation to show
  @Input() citationsToShow: number[];

  // Table data source for the citations
  public citations: MatTableDataSource<Citation>;

  // Columns to display in the table
  public displayColumns = ['title', 'citation', 'copyButton'];

  constructor(
    private citationService: CitationsService,
  ) {
  }

  async ngOnInit(): Promise<void> {
    const citations = await this.citationService.getAllCitations(this.detailsData);

    if (!this.citationsToShow) {
      this.citations = new MatTableDataSource(citations);
    } else {
      this.citations = new MatTableDataSource(
        citations.filter((_, index) => this.citationsToShow.includes(index))
      );
    }
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
