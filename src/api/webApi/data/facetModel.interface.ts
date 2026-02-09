import { Facet } from './facet.interface';

export interface FacetModel<T> {
  /**
   * Get the root facets.
   */
  roots(): Array<Facet<T>>;

  /**
   * Get a specific root.
   * @param identifier
   */
  root(identifier: string): null | Facet<T>;

  /**
   * Get the root facet identifiers.
   */
  rootIdentifiers(): Array<string>;

  /**
   * Flatten the data from all roots facet and their child facets into a flat list.
   */
  getFlatData(): Array<T>;
}
