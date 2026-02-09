import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PageLoadingService } from 'services/pageLoading.service';

/**
 * Component for showing a loading spinner on the whole page.
 */
@Component({
  selector: 'app-page-loading',
  templateUrl: 'pageLoading.component.html',
  styleUrls: ['pageLoading.component.scss'],
})
export class PageLoadingComponent implements OnInit, OnDestroy {
  public isLoading: boolean;

  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  constructor(
    private pageLoadingService: PageLoadingService,
  ) { }

  ngOnInit(): void {
    this.subscriptions.push(this.pageLoadingService.watchLoading().subscribe(
      (isLoading: boolean) => {
        this.isLoading = isLoading;
      }
    ));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => {
      s.unsubscribe();
    });
  }

}
