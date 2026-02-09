import { FacetModel } from 'api/webApi/data/facetModel.interface';
import { Facet } from 'api/webApi/data/facet.interface';

/**
 * Facet model, holder of root(s).
 */
export class SimpleFacetModel<T> implements FacetModel<T> {


  constructor(private readonly rootMap: Map<string, Facet<T>>) { }

  rootIdentifiers(): Array<string> {
    return Array.from(this.rootMap.keys());
  }
  roots(): Array<Facet<T>> {
    return Array.from(this.rootMap.values());
  }

  root(identifier: string): null | Facet<T> {
    return this.rootMap.get(identifier) ?? null;
  }

  getFlatData(): Array<T> {
    const flat: Array<T> = [];

    this.roots().forEach(root => {
      flat.push(...root.getFlatData());
    });

    return flat;
  }

}
