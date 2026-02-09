/**
 * Display element representing a {@link Facet} item that has no children.
 */

import { FacetDisplayItem } from './facetDisplayItem';

export class FacetLeafItem extends FacetDisplayItem {
  /** Calls the inherited {@link FacetDisplayItem} constructor with isLeaf=true. */
  constructor(
    /** How deep in the facet tree it sits. */
    depth: number,
    /** Identifier */
    id: string,
    /** Display label. */
    name: string,
    /** Whether it is selected or not. */
    public isSelected: boolean,
  ) {
    super(true, id, name, depth);
  }

  /**
   * Sets its selected status
   */
  public setSelected(selected: boolean): void {
    this.isSelected = selected;
  }

}
