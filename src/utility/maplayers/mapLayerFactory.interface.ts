import { Stylable } from 'utility/styler/stylable.interface';
import { MapLayer, EposLeafletComponent } from 'utility/eposLeaflet/eposLeaflet';
import { ParameterValue } from 'api/webApi/data/parameterValue.interface';
import { ParameterDefinitions } from 'api/webApi/data/parameterDefinitions.interface';

/** The `MapLayerFactory` interface is defining a generic interface that takes two type parameters `D`
and `L`. */
export interface MapLayerFactory<D, L extends MapLayer> {

  /** The `createMapLayers` method is a function that takes several parameters and returns an array of map
layers. */
  createMapLayers(
    mapConfig: EposLeafletComponent,
    id: string,
    name: string,
    stylable: Stylable,
    parameterDefs: ParameterDefinitions,
    parameters: Array<ParameterValue>,
    getDataFunction: () => Promise<D>,
  ): Array<L>;
}
