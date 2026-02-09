import { Component, OnInit } from '@angular/core';
import { LandingServiceSoftware } from './services/landing.service';
import { DataSearchConfigurablesServiceSoftware } from './services/dataSearchConfigurables.service';

@Component({
  selector: 'app-software-panel',
  templateUrl: './softwarePanel.component.html',
  styleUrls: ['./softwarePanel.component.scss'],
})
export class SoftwarePanelComponent implements OnInit {

  constructor(
    private readonly landingService: LandingServiceSoftware,
    private readonly dataSearchConfigurables: DataSearchConfigurablesServiceSoftware
  ) {
  }

  ngOnInit(): void {
    // get domains from API service
    this.landingService.getDomains();

    setTimeout(() => {
      this.dataSearchConfigurables.setModelVariablesFromConfigurables();
    }, 500);
  }

}
