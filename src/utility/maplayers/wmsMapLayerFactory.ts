import { MapLayerFactory } from './mapLayerFactory.interface';
import { WmsTileLayer, MapLayer, EposLeafletComponent } from 'utility/eposLeaflet/eposLeaflet';
import { ParameterValue } from 'api/webApi/data/parameterValue.interface';
import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import * as L from 'leaflet';
import { Stylable } from 'utility/styler/stylable.interface';
import { ParameterDefinitions } from 'api/webApi/data/parameterDefinitions.interface';
import { WMSFeatureIdentifier } from './wmsFeatureIdentifier';
import { HttpClient } from '@angular/common/http';
import { Injector } from '@angular/core';
import { DataSearchConfigurablesServiceResource } from 'pages/dataPortal/modules/dataPanel/services/dataSearchConfigurables.service';
import { DataSearchConfigurablesServiceRegistry } from 'pages/dataPortal/modules/registryPanel/services/dataSearchConfigurables.service';

/** The WMSMapLayerFactory class is responsible for creating and configuring WMS tile layers for a
mapping application. */
export class WMSMapLayerFactory implements MapLayerFactory<string, WmsTileLayer> {

  /**
   * The constructor function takes an injector as a parameter and assigns it to a private property.
   * @param {Injector} injector - The `injector` parameter is an instance of the `Injector` class. The
   * `Injector` class is responsible for creating instances of classes and resolving their dependencies.
   * It is commonly used in dependency injection frameworks to manage the creation and injection of
   * dependencies into classes.
   */
  constructor(private injector: Injector) { }

  /**
   * The function creates a WMS tile layer with specified parameters and adds it to a map.
   * @param {EposLeafletComponent} mapConfig - An instance of the EposLeafletComponent class, which
   * represents the Leaflet map configuration.
   * @param {string} id - The `id` parameter is a string that represents the unique identifier for the
   * map layer. It is used to distinguish between different layers in the map.
   * @param {string} name - The `name` parameter is a string that represents the name of the map layer.
   * @param {Stylable} stylable - The `stylable` parameter is of type `Stylable`. It is used to set the
   * styling options for the map layer.
   * @param {ParameterDefinitions} parameterDefs - The parameterDefs parameter is of type
   * ParameterDefinitions, which is an object that defines the parameters for the WMS layer. It contains
   * information such as the parameter name, type, default value, and possible values.
   * @param parameterValues - The `parameterValues` parameter is an array of `ParameterValue` objects.
   * Each `ParameterValue` object represents a specific parameter value for the WMS layer.
   * @param getDataFunction - The `getDataFunction` parameter is a function that returns a Promise that
   * resolves to a string. This function is used to fetch the data for the WMS layer.
   * @returns An array of WmsTileLayer objects.
   */
  public createMapLayers(
    mapConfig: EposLeafletComponent,
    id: string, name: string,
    stylable: Stylable,
    parameterDefs: ParameterDefinitions,
    parameterValues: Array<ParameterValue>,
    getDataFunction: () => Promise<string>,
  ): Array<WmsTileLayer> {
    const layer: WmsTileLayer = this.createWmsLayer(id, name, getDataFunction());
    this.addParametersForWms(layer, parameterDefs, parameterValues);
    // layer.setLegendCreatorFunction(this.legendCreatorFunction)
    layer.setFeatureIdentifiable(new WMSFeatureIdentifier(layer));

    // add specific layer pane
    void Promise.resolve().then(() => mapConfig.ensurePaneExists(layer.id));

    layer.options.customLayerOptionStylable.set(stylable as Stylable);

    return [layer];
  }

  /**
   * The function `populateGetCapabilities` populates additional parameters for a WMS tile layer and
   * refreshes the GetCapabilities XML.
   * @param {WmsTileLayer} layer - The `layer` parameter is of type `WmsTileLayer`. It represents a Web
   * Map Service (WMS) tile layer in a mapping application.
   * @returns The function `populateGetCapabilities` is returning a Promise that resolves to `void`.
   */
  protected populateGetCapabilities(
    layer: WmsTileLayer,
  ): Promise<void> {
    const additionalParams = new Map<string, string>();

    const mapString = layer.options.get('MAP');
    if (null != mapString) {
      additionalParams.set('MAP', String(mapString));
    }

    return layer.refreshGetCapabilitiesXml(this.injector.get<HttpClient>(HttpClient), additionalParams)
      .then(() => { });

  }

  protected retrieveBboxFromXml(layer: WmsTileLayer) {

    return layer.getLayerBboxFromGetCapabilitiesXml(layer, this.injector.get<HttpClient>(HttpClient), this.injector.get<DataSearchConfigurablesServiceResource>(DataSearchConfigurablesServiceResource), this.injector.get<DataSearchConfigurablesServiceRegistry>(DataSearchConfigurablesServiceRegistry));
  }


  /**
   * The function converts a bounding box object into a Leaflet LatLngBounds object if the bounding box
   * is bounded, otherwise it returns null.
   * @param {BoundingBox} bounds - The `bounds` parameter is of type `BoundingBox`. It represents a
   * bounding box, which is defined by a minimum latitude, maximum latitude, minimum longitude, and
   * maximum longitude.
   * @returns either a `L.LatLngBounds` object or `null`.
   */
  private boundsToLeafletLatLngBounds(bounds: BoundingBox): null | L.LatLngBounds {
    return (bounds.isBounded())
      ? new L.LatLngBounds([bounds.getMinLat(), bounds.getMinLon()], [bounds.getMaxLat(), bounds.getMaxLon()])
      : null;
  }

  /**
   * The function creates a WmsTileLayer object with a given id and name, sets the 'transparent' option
   * to true, and sets a pre-layer add function that replaces the URL of the layer with a new URL
   * obtained from a promise.
   * @param {string} id - The `id` parameter is a string that represents the unique identifier for the
   * WMS layer. It is used to distinguish this layer from others in the application.
   * @param {string} name - The `name` parameter is a string that represents the name of the WMS layer.
   * @param urlPromise - The `urlPromise` parameter is a Promise that resolves to a string representing
   * the URL of the WMS (Web Map Service) layer.
   * @returns an instance of the WmsTileLayer class.
   */
  private createWmsLayer(
    id: string,
    name: string,
    urlPromise: Promise<string>,
  ): WmsTileLayer {
    const layer = new WmsTileLayer(id, name)
      .options.set('transparent', true)
      .setPreLayerAddFunction(() => {
        return urlPromise
          .then((url: string) => {
            const newUrl = url.replace(/\?.*$/, '');
            layer.setUrl(newUrl);

            // 1) expose a "ready" Promise that includes the GetCapabilities attempt
            const ready = this.populateGetCapabilities(layer)
              .catch(err => {
                console.warn(`[WMS][${layer.id}] GetCapabilities failed:`, err);
                // do not stop the flow, execution will continue anyway
              })
              .finally(() => {
                // 2) ALWAYS attach the invoker, even if GetCapabilities failed
                this.attachCheckInvoker(layer);

                // bbox: if GetCapabilities failed this might also fail,
                // but it is not blocking for the invoker
                void this.retrieveBboxFromXml(layer);
              });

            // 3) store the ready Promise on the layer
            layer.crsCheckReady = ready;

            // important: return the promise to comply with the preLayerAddFunction contract
            return ready;
          })
          .catch(err => {
            console.error(`[WMS][${id}] urlPromise/preLayerAdd error:`, err);
            // still, try to attach the invoker to allow CRS checks
            this.attachCheckInvoker(layer);
            layer.crsCheckReady = Promise.resolve();
          });
      });

    return layer;
  }

  private attachCheckInvoker(layer: WmsTileLayer): void {
    const http = this.injector.get<HttpClient>(HttpClient);
    layer.checkCrsCompatibility = (crs: string) =>
      layer.checkSingleCrsCompatibility(http, crs, layer.name)
        .then(results => {
          layer.crsCompatibilityResults = results;
          return results;
        })
        .catch(err => {
          return [];
        });
  }


  /**
   * The function adds parameters for a Web Map Service (WMS) to a map layer object.
   * @param {MapLayer} mapLayer - The `mapLayer` parameter is an object representing a map layer. It is
   * of type `MapLayer`.
   * @param {ParameterDefinitions} parameterDefs - The `parameterDefs` parameter is an object that
   * contains the definitions of the parameters that can be passed to the WMS (Web Map Service) layer. It
   * is of type `ParameterDefinitions`.
   * @param params - An array of ParameterValue objects. Each ParameterValue object has two properties:
   * "name" (string) and "value" (string or null).
   * @returns the updated `mapLayer` object.
   */
  private addParametersForWms(
    mapLayer: MapLayer,
    parameterDefs: ParameterDefinitions,
    params: Array<ParameterValue>,
  ): MapLayer {
    if (mapLayer != null) {
      // sets params like selected layer!
      params.forEach((param: ParameterValue) => {
        const name = param.name;
        let value: null | string = param.value;
        // ignore these parameters as leaflet fills it in
        switch (name) {
          case ('srs'):
          case ('crs'): value = null; break;
        }
        if (value != null) {
          mapLayer.options.set(name, value);
        }
      });
      // bbox
      mapLayer.options.set('bounds', this.boundsToLeafletLatLngBounds(parameterDefs.getSpatialBounds(params)));

    }
    return mapLayer;
  }

}
