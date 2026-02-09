import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-powered-by',
  templateUrl: 'poweredBy.component.html',
  styleUrls: ['poweredBy.component.scss'],
})
export class PoweredByComponent {

  @Input() text = 'This Platform is Powered By EPOS ERIC';
  @Input() url = 'https://epos-eu.github.io/epos-open-source/#/';

  constructor() { }

}
