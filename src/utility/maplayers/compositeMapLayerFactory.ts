import { MapLayerFactory } from './mapLayerFactory.interface';
import { EposLeafletComponent, MapLayer } from 'utility/eposLeaflet/eposLeaflet';
import { ParameterValue } from 'api/webApi/data/parameterValue.interface';
import { Stylable } from 'utility/styler/stylable.interface';
import { ParameterDefinitions } from 'api/webApi/data/parameterDefinitions.interface';

/**
 * <D> is the input data type
 * <L> is the type of layers created by the factories
 */
export class CompositeMapLayerFactory<D, L extends MapLayer> implements MapLayerFactory<D, MapLayer> {

  constructor(private readonly factories: Array<MapLayerFactory<D, L>>) { }

  createMapLayers(
    mapConfig: EposLeafletComponent,
    id: string,
    name: string,
    stylable: Stylable,
    parameterDefs: ParameterDefinitions,
    parameters: Array<ParameterValue>,
    getDataFunction: () => Promise<D>,
  ): Array<MapLayer> {

    let allLayers: Array<MapLayer> = [];

    this.factories.forEach(factory => {
      const layers: Array<MapLayer> = factory.createMapLayers(mapConfig, id, name, stylable, parameterDefs, parameters, getDataFunction);
      allLayers = allLayers.concat(layers);
    });

    return allLayers;
  }
}

