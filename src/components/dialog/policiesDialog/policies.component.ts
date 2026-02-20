import { Component } from '@angular/core';
import moment from 'moment-es6';
import { PoliciesService } from 'services/policiesService.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-policies',
  templateUrl: 'policies.component.html',
  styleUrls: ['policies.component.scss'],
  animations: [
    trigger('collapse', [
      state('expanded', style({
        height: '*',
        opacity: 1
      })),
      state('collapsed', style({
        height: '0',
        opacity: 0
      })),
      transition('expanded <=> collapsed', animate('300ms ease-in-out'))
    ])
  ]
})

export class PoliciesComponent {
  public cookiePolicy = true;
  isInfoCollapsed = true;

  constructor(
    private readonly policiesService: PoliciesService,
  ) {
  }

  toggleInfo(): void {
    this.isInfoCollapsed = !this.isInfoCollapsed;
  }
  setStorage(): void {
    this.policiesService.setConsentsTimestamp(moment());
    this.policiesService.setCookieConsent(this.cookiePolicy);
    window.location.reload();
  }
}
