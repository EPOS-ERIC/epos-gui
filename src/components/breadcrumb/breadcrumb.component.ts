import { Component, Input } from '@angular/core';
import { DistributionLevel } from 'api/webApi/data/distributionLevel.interface';
import { ResultsPanelService } from 'pages/dataPortal/services/resultsPanel.service';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
  animations: [
  ],
})
export class BreadcrumbComponent {

  @Input() levels: Array<Array<DistributionLevel>>;
  @Input() showFirst: boolean;

  public textSliceLimit = 30;

  constructor(
    private readonly resultPanelService: ResultsPanelService,
  ) {
  }

  public filterBy(facet: string): void {
    this.resultPanelService.openFacetSelection(true);

    setTimeout(() => {
      this.resultPanelService.setFacetSelection(facet);
    }, 200);

  }
}

