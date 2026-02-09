import { EposLeafletComponent, MapLayer } from 'utility/eposLeaflet/eposLeaflet';
import { MapLayerFactory } from './mapLayerFactory.interface';

/** The `export interface MapLayerStrategy<I>` is defining an interface called `MapLayerStrategy` that
takes a generic type `I` as a parameter. This interface is used to define the contract for classes
or objects that implement a strategy for creating map layers from a given input. The
`createMapLayersFrom` method defined in this interface takes various parameters and returns an array
of `MapLayer` objects. */
export interface MapLayerStrategy<I> {

  /** The `createMapLayersFrom` method is a function defined in the `MapLayerStrategy` interface. It takes
  several parameters: */
  createMapLayersFrom<D, L extends MapLayer>(
    input: I,
    mapConfig: EposLeafletComponent,
    factory: MapLayerFactory<D, L>,
    dataFunction: () => Promise<D>,
  ): Array<MapLayer>;
}
