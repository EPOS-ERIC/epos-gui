/* eslint-disable @typescript-eslint/no-shadow */
import { Injectable } from '@angular/core';
import { NotificationService } from './notification.service';
import { DistributionDetails } from '../api/webApi/data/distributionDetails.interface';
import { Tracker } from 'utility/tracker/tracker.service';
import { TrackerAction, TrackerCategory } from 'utility/tracker/tracker.enum';

export class Citation {
  constructor(
    public purpose: string,
    public citation: string,
  ) {
  }
}

@Injectable({
  providedIn: 'root',
})
export class CitationsService {
  private readonly URL = 'https://www.epos-eu.org/dataportal';

  constructor(
    private readonly notificationService: NotificationService,
    private tracker: Tracker,
  ) {
  }

/**
 * Retrieves a formatted citation for the dataset using the provided DOIs (if any).
 *
 * If valid DOIs are present, the method fetches the citation text from the
 * citation.doi.org API in APA format and appends a clickable link for each DOI.
 * If no citation can be retrieved or no DOIs are provided, a fallback citation is used.
 *
 * @param distributionDetails - The distribution details containing metadata and DOI(s)
 * @returns A Promise resolving to a Citation object with formatted HTML content
 */
public getDatasetCitation(distributionDetails: DistributionDetails): Promise<Citation> {
  const { providersString, doisString, license, name } = this.getCitationComponents(distributionDetails);
  const dois = distributionDetails.getDOI().filter(doi => doi?.trim());

  if (dois.length > 0) {
    const fetchPromises = dois.map(doi => {
      const url = `https://citation.doi.org/format?doi=${encodeURIComponent(doi)}&style=apa&lang=en-US`;

      return fetch(url, {
        headers: { Accept: 'text/x-bibliography' }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Citation fetch failed');
          }
          return response.text();
        })
        .then(citation => {
          const trimmed = citation.trim();
          return this.linkifyText(trimmed);
        })
        .catch(() => null); // Ignore individual DOI errors
    });

    return Promise.all(fetchPromises).then((citationTexts: (string | null)[]) => {
      const validCitations = citationTexts.filter((c): c is string => typeof c === 'string' && c.trim() !== '');

      if (validCitations.length > 0) {
        const combined = validCitations.map(c => `${c}.`).join('<br/>');

        return new Citation(
          'For citing the dataset as a reference in any publication',
          `${combined}<br/>Accessed on ${this.getTodayString()} through the EPOS Platform (<a href="${this.URL}" target="_blank" rel="noopener noreferrer">${this.URL}</a>)`
        );
      }

      // All citation fetches failed → fallback
      const rawText = `${name}, provided by ${providersString}${license ? `, ${license}` : ''}${doisString ? `, ${doisString}` : ''}`;
      const linkedText = this.linkifyText(rawText);

      return new Citation(
        'For citing the dataset as a reference in any publication',
        `${linkedText}.<br/>Accessed on ${this.getTodayString()} through the EPOS Platform (<a href="${this.URL}" target="_blank" rel="noopener noreferrer">${this.URL}</a>)`
      );
    });
  }

  // No DOIs → fallback citation
  const rawText = `${name}, provided by ${providersString}${license ? `, ${license}` : ''}${doisString ? `, ${doisString}` : ''}`;
  const linkedText = this.linkifyText(rawText);

  return Promise.resolve(
    new Citation(
      'For citing the dataset as a reference in any publication',
      `${linkedText}.<br/>Accessed on ${this.getTodayString()} through the EPOS Platform (<a href="${this.URL}" target="_blank" rel="noopener noreferrer">${this.URL}</a>)`
    )
  );
}

/**
 * Converts all plain URLs in a text to clickable HTML <a> tags.
 *
 * @param text The input text containing URLs.
 * @returns A string with all URLs converted to anchor tags.
 */
public linkifyText(text: string): string {
  const urlRegex = /\bhttps?:\/\/[^\s<>"'()]+[^\s.,:;"')\]]/gi;

  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}







  public getDataPortalCitation(): Citation {
    const doiUrl = 'https://doi.org/10.1038/s41597-023-02697-9';

    return new Citation(
      'For citing the EPOS Platform as a reference in any publication',
      `Bailo, D., Paciello, R., Michalek, J. et al. The EPOS multi-disciplinary Platform for integrated access to solid Earth science datasets. Sci Data 10, 784 (2023). <a href="${doiUrl}" target="_blank" rel="noopener noreferrer">${doiUrl}</a>`
    );
  }


  public getDataPortalContentsCitation(distributionDetails: DistributionDetails): Citation {
    const { providersString, doisString, license } = this.getCitationComponents(distributionDetails);

    const urlLink = `<a href="${this.URL}" target="_blank" rel="noopener noreferrer">${this.URL}</a>`;

    const doisPart = doisString
    ? ', ' + doisString
        .split(',')
        .map(doi => doi.trim())
        .map(doi => `<a href="${doi}" target="_blank" rel="noopener noreferrer">${doi}</a>`)
        .join(', ')
    : '';

    const licensePart = license ? `, <a href="${license}" target="_blank" rel="noopener noreferrer">${license}</a>` : '';

    return new Citation(
      'For citing the EPOS Platform contents different from DDSS (e.g. images, pictures)',
      `Credits: EPOS Platform (${urlLink}), ${providersString}${licensePart}${doisPart}. Accessed on ${this.getTodayString()}`
    );
  }


  public async getAllCitations(distributionDetails: DistributionDetails): Promise<Citation[]> {
    const citations: Citation[] = [];

    citations.push(
      await this.getDatasetCitation(distributionDetails),
      this.getDataPortalCitation(),
      this.getDataPortalContentsCitation(distributionDetails)
    );

    return citations;
  }



  public copyCitationToClipboard(citation: string, distributionDetails: DistributionDetails): void {

    const name = distributionDetails.getDomainCode() + Tracker.TARCKER_DATA_SEPARATION + distributionDetails.getName();

    // track event
    this.tracker.trackEvent(TrackerCategory.DISTRIBUTION, TrackerAction.CITATIONS, name);

    navigator.clipboard.writeText(citation).then(() => {
      // Show a success notification
      this.notificationService.sendNotification('Citation copied to clipboard', 'x', NotificationService.TYPE_SUCCESS, 5000);
    }).catch((_) => {
      // Show an error notification
      this.notificationService.sendNotification('Failed to copy citation to clipboard', 'x', NotificationService.TYPE_ERROR, 5000);
    });
  }

  private getCitationComponents(distributionDetails: DistributionDetails): {
    providersString: string; doisString: string; license: string; name: string;
  } {
    return {
      providersString: distributionDetails.getDataProvider().map(provider => provider.dataProviderLegalName).join(', '),
      doisString: distributionDetails.getDOI().join(', '),
      license: distributionDetails.getLicense(),
      name: distributionDetails.getName(),
    };
  }

  private getTodayString(): string {
    const dateObj = new Date();
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    return `${day}-${month}-${year}`;
  }
}
