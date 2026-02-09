import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { NewFeaturePopupComponent } from './newFeaturePopup.component';
import { environment } from 'environments/environment';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NewFeaturesService {

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  openNewFeatures(triggerFromHeader = false): void {
    const currentVersion = environment.version;
    const seenVersion = localStorage.getItem('newFeaturePopupSeen');
    if (seenVersion === currentVersion && triggerFromHeader ===false) { return; }

    this.loadChangelogForVersion(currentVersion as string).subscribe(latest => {
      if (!latest) { return; }

      this.dialog.open(NewFeaturePopupComponent, {
        width: 'auto',
        height: 'auto',
        data: {
          version: latest.version,
          features: latest.features,
        },
        disableClose: true,
      });
    });
  }

  private loadChangelogForVersion(version: string) {
    return this.http.get('assets/CHANGELOG.md', { responseType: 'text' }).pipe(
      map(content => this.extractVersion(content, version))
    );
  }

  private extractVersion(md: string, versionToFind: string): { version: string; features: string[] } | null {
    const versionRegex = /^##\s*\[(.*?)\]/gm;
    const matches = [...md.matchAll(versionRegex)];
    if (matches.length === 0) { return null; }

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      if (match[1] === versionToFind) {
        const startIndex = match.index!;
        const nextIndex = matches[i + 1]?.index ?? md.length;
        const block = md.substring(startIndex, nextIndex).trim();
        // the lines are found thanks to - put in the CHANGELOG.md
        const featureRegex = /^-\s+(.*)$/gm;
        const features = [...block.matchAll(featureRegex)]
          .map(m => m[1].trim())
          .map(line => this.formatLine(line))
          .filter(Boolean);

        return { version: versionToFind, features };
      }
    }

    return null;
  }

  /**
   * Transforms "(related issue: URL)" into a styled link with an icon
   */
  private formatLine(text: string): string {
    // Regex unchanged
    const issueRegex = /\(related issue:\s*(https?:\/\/[^\s)]+)\)/gi;

    return text.replace(issueRegex, (fullMatch: string, url: string) => {
      // Extracts the ID
      const idMatch = url.match(/\/(\d+)$/);
      // If there's an ID, writes "Issue #123", otherwise "Ref"
      const label = idMatch ? `Issue #${idMatch[1]}` : 'Ref';

      // Note the &nbsp; space before the link to softly separate it from the preceding text
      return `&nbsp;<a href="${url}" target="_blank" class="changelog-link" title="Open ${label}"><span>${label}</span></a>`;
    });
  }
}
