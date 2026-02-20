import { Component, Input } from '@angular/core';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-powered-by',
  templateUrl: 'poweredBy.component.html',
  styleUrls: ['poweredBy.component.scss'],
})
export class PoweredByComponent {

  @Input() text = environment.poweredByText;
  @Input() url = 'https://epos-eu.github.io/epos-open-source/#/';

  constructor() { }

}
