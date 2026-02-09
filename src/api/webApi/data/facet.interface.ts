import { Identifiable } from './identifiable.interface';
/**
 * Represents a node in a tree that may have child nodes, and optionally data of type T.
 */
export interface Facet<T> extends Identifiable {
  /**
   * The child facets of this facet.
   */
  getChildren(): Array<Facet<T>>;
  hasChildren(): boolean;

  /**
   * The parent facet of this facet, or null if there is no parent i.e. a root.
   */
  getParent(): null | Facet<T>;


  /**
   * The data (leaves) of this facet.
   */
  getData(): Array<T>;

  /**
   * Flatten the data from this facet and all child facets into a flat list.
   */
  getFlatData(): Array<T>;

  addChild(child: Facet<T>): void;
}
