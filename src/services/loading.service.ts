import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private showLoadingSrc = new BehaviorSubject<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public showLoadingObs = this.showLoadingSrc.asObservable();

  /**
   * The function "showLoading" is used to toggle the visibility of a loading indicator.
   * @param {boolean} showLoading - The `showLoading` parameter is a boolean value that determines
   * whether to show or hide a loading indicator.
   */
  public showLoading(showLoading: boolean): void {
    this.showLoadingSrc.next(showLoading);
  }
}
