import { Component } from '@angular/core';
import moment from 'moment-es6';
import { PoliciesService } from 'services/policiesService.service';


@Component({
  selector: 'app-policies',
  templateUrl: 'policies.component.html',
  styleUrls: ['policies.component.scss'],

})

export class PoliciesComponent {
  public cookiePolicy = true;

  constructor(
    private readonly policiesService: PoliciesService,
  ) {
  }
  setStorage(): void {
    this.policiesService.setConsentsTimestamp(moment());
    this.policiesService.setCookieConsent(this.cookiePolicy);
    window.location.reload();
  }
}
