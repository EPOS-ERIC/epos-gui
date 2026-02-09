import { Component, OnInit } from '@angular/core';
import { LandingService } from './services/landing.service';
import { DataSearchConfigurablesServiceRegistry } from './services/dataSearchConfigurables.service';

@Component({
  selector: 'app-registry-panel',
  templateUrl: './registryPanel.component.html',
  styleUrls: ['./registryPanel.component.scss'],
})
export class RegistryPanelComponent implements OnInit {

  public showLanding = true;

  constructor(
    private readonly landingService: LandingService,
    private readonly dataSearchConfigurables: DataSearchConfigurablesServiceRegistry,
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
