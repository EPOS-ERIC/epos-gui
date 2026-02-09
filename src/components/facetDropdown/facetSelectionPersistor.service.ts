import { Injectable } from '@angular/core';
import { FacetFlatNode } from './facetDropdown.component';

@Injectable({
  providedIn: 'root'
})
export class FacetSelectionPersistorService {

  private facetSelectionPersistMap = new Map<string, Array<FacetFlatNode>>();

  public setFacets(domainName: string, facets: Array<FacetFlatNode>): void {
    this.facetSelectionPersistMap.set(domainName, facets);
  }

  public getFacets(domainName: string): Array<FacetFlatNode> | undefined {
    return this.facetSelectionPersistMap.get(domainName);
  }

}
