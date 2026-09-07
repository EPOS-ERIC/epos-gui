/* eslint-disable @typescript-eslint/no-shadow */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class BackofficeUserService {

    public backofficeUser: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor(
  ) {
  }

  public getIsBackofficeUser(): boolean {
    return this.backofficeUser.value;
  }
  public setIsBackofficeUser(val: boolean) {
    this.backofficeUser.next(val);
  }
}
