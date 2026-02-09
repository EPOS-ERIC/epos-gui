import { Injectable } from '@angular/core';
import { Domain } from 'api/webApi/data/domain.interface';
import { BehaviorSubject, Subject } from 'rxjs';

/**
 * Service that is used to manage landing page..
 */
@Injectable()
export class BaseLandingService {

  protected domainsSrc = new BehaviorSubject<null | Array<Domain>>(null);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public domainObs = this.domainsSrc.asObservable();

  protected showLandingSrc = new BehaviorSubject<boolean>(true);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public showLandingObs = this.showLandingSrc.asObservable();

  protected returnToLandingSrc = new Subject<void>();
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public returnToLandingObs = this.returnToLandingSrc.asObservable();

  protected activeDomainSrc = new Subject<string | boolean>();
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public activeDomainSrcObs = this.activeDomainSrc.asObservable();

  public showLanding(showLanding: boolean): void {
    this.showLandingSrc.next(showLanding);
  }

  public getLandingStatus(): boolean {
    return this.showLandingSrc.value;
  }

  public returnToLanding(): void {
    this.returnToLandingSrc.next();
  }

  /**
   * The function `setActiveDomain` sets the value of `activeDomainSrc` to the provided value.
   * @param {string | boolean} value - The value parameter can be either a string or a boolean.
   */
  public setActiveDomain(value: string | boolean): void {
    this.activeDomainSrc.next(value);
  }

  public setDomain(value: string | boolean): void {
  }

}
