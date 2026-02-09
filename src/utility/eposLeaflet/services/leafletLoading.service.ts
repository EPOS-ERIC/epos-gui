import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LeafletLoadingService {
  private showLoadingSrc = new BehaviorSubject<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public showLoadingObs = this.showLoadingSrc.asObservable();

  public showLoading(showLoading: boolean): void {
    this.showLoadingSrc.next(showLoading);
  }
}
