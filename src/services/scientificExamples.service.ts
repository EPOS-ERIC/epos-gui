/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/no-floating-promises */

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { UserNotificationService } from 'components/userNotifications/userNotifications.service';
import { Examples } from 'components/dialog/scientificExamplesDialog/scientificExamplesDialog.component';
@Injectable({
  providedIn: 'root',
})


export class ScientificExamplesService {
  private readonly endpoint = 'https://raw.githubusercontent.com/epos-eu/ENVRI-Hub-Next-Use-Cases/refs/heads/main/useCases.JSON';
  private examplesSubject = new BehaviorSubject<Examples[]>([]);
  public examples$ = this.examplesSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly userNotificationService: UserNotificationService,

  ) {
    this.fetchScientificExamplesFromGitLab();
  }

  getscientificExamples(): Observable<object> {
    return this.http.get(this.endpoint
    ).pipe(
      catchError((error) => {
        this.userNotificationService.sendErrorNotification(
          'Error fetching steps from GitLab API.',
          6000,
        );
        return throwError(error);
      })
    );
  }

  private fetchScientificExamplesFromGitLab(): void {
    this.getscientificExamples().subscribe({
      next: (response: Examples[]) => {
        try {
          // Directly map the response if it's already an array
          const examples = response.map((example) => ({
            example: example.example,
            title: example.title,
            description: example.description,
            listOfServices: example.listOfServices,
            sharingLinkUrl: example.sharingLinkUrl,
          }));
          this.examplesSubject.next(examples);
        } catch (error) {
          console.error('Error processing response:', error);
        }
      },
      error: (error) => {
        console.error('Error fetching examples:', error);
      },
    });
  }
}
