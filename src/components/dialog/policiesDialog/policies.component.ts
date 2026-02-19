/*
         Copyright 2021 EPOS ERIC

 Licensed under the Apache License, Version 2.0 (the License); you may not
 use this file except in compliance with the License.  You may obtain a copy
 of the License at

   http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an AS IS BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 License for the specific language governing permissions and limitations under
 the License.
 */
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

  toggleInfo(): void {
    this.isInfoCollapsed = !this.isInfoCollapsed;
  }
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
