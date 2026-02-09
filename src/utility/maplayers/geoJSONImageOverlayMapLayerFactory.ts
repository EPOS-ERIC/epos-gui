import { EposLeafletComponent } from 'utility/eposLeaflet/eposLeaflet';
import { MapLayerFactory } from './mapLayerFactory.interface';
import { ParameterValue } from 'api/webApi/data/parameterValue.interface';
import { Stylable } from 'utility/styler/stylable.interface';
import { ParameterDefinitions } from 'api/webApi/data/parameterDefinitions.interface';
import { Injector } from '@angular/core';
import { GeoJSONImageOverlayMapLayer } from './geoJSONImageOverlayMapLayer';


/** The GeoJSONImageOverlayMapLayerFactory class is a TypeScript class that implements the
MapLayerFactory interface and is responsible for creating GeoJSONImageOverlayMapLayer instances. */
export class GeoJSONImageOverlayMapLayerFactory implements MapLayerFactory<GeoJSON.GeoJsonObject, GeoJSONImageOverlayMapLayer> {

  /**
   * The constructor function takes an injector as a parameter and assigns it to a private readonly
   * property.
   * @param {Injector} injector - The `injector` parameter is an instance of the `Injector` class. The
   * `Injector` class is responsible for creating instances of classes and resolving their
   * dependencies. It is commonly used in Angular applications for dependency injection.
   */
  constructor(
    private readonly injector: Injector,
  ) {
  }

  /**
   * The function creates an array of GeoJSONImageOverlayMapLayer objects based on the provided
   * parameters.
   * @param {EposLeafletComponent} mapConfig - The `mapConfig` parameter is of type
   * `EposLeafletComponent` and represents the configuration of the map component.
   * @param {string} id - The `id` parameter is a string that represents the unique identifier for the
   * map layer.
   * @param {string} name - The `name` parameter is a string that represents the name of the map layer.
   * @param {Stylable} stylable - The `stylable` parameter is an object that contains information about
   * how the map layer should be styled. It likely includes properties such as color, opacity, and line
   * width.
   * @param {ParameterDefinitions} parameterDefs - The parameterDefs parameter is of type
   * ParameterDefinitions, which is an object that defines the parameters for the map layer. It
   * typically includes information such as the name, type, and default value of each parameter.
   * @param parameters - The `parameters` parameter is an array of `ParameterValue` objects. Each
   * `ParameterValue` object represents a specific parameter for the map layer.
   * @param getDataFunction - The `getDataFunction` parameter is a function that returns a Promise that
   * resolves to a GeoJSON object. This function is responsible for fetching the data needed to create
   * the map layer.
   * @returns An array of GeoJSONImageOverlayMapLayer objects.
   */
  public createMapLayers(
    mapConfig: EposLeafletComponent,
    id: string,
    name: string,
    stylable: Stylable,
    parameterDefs: ParameterDefinitions,
    parameters: Array<ParameterValue>,
    getDataFunction: () => Promise<GeoJSON.GeoJsonObject>,
  ): Array<GeoJSONImageOverlayMapLayer> {
    return [new GeoJSONImageOverlayMapLayer(this.injector, id, name, stylable, getDataFunction)];
  }

}
