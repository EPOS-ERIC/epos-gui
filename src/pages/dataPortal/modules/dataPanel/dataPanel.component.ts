import { Component, OnInit } from '@angular/core';
import { LandingService } from './services/landing.service';
import { DataSearchConfigurablesServiceResource } from './services/dataSearchConfigurables.service';

@Component({
  selector: 'app-data-panel',
  templateUrl: './dataPanel.component.html',
  styleUrls: ['./dataPanel.component.scss'],
})
export class DataPanelComponent implements OnInit {

  constructor(
    private readonly landingService: LandingService,
    private readonly dataSearchConfigurables: DataSearchConfigurablesServiceResource
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
