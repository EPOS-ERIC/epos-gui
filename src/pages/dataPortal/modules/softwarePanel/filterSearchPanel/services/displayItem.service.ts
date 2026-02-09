import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { FacetDisplayItem } from 'api/webApi/data/impl/facetDisplayItem';

@Injectable()
export class DisplayItemService {

  private allDisplayItems = new BehaviorSubject<Array<FacetDisplayItem> | null>(new Array<FacetDisplayItem>());

  // eslint-disable-next-line @typescript-eslint/member-ordering
  allDisplayItemsObs = this.allDisplayItems.asObservable();

  public updateDisplayItems(currentProgressArray: Array<FacetDisplayItem> | null): void {
    this.allDisplayItems.next(currentProgressArray);
  }

}
