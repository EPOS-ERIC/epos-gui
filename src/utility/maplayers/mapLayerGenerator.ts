import { MapLayer, EposLeafletComponent } from 'utility/eposLeaflet/eposLeaflet';
import { ExecutionService } from 'services/execution.service';
import * as GeoJSON from 'geojson/../geojson';
import { DistributionFormatType } from 'api/webApi/data/distributionFormatType';
import { DataConfigurable } from '../configurables/dataConfigurable.abstract';
import { MapLayerStrategy } from './mapLayerStrategy.interface';
import { Configurable } from 'api/webApi/data/configurable.interface';
import { GeoJSONMapLayerFactory } from './geoJSONMapLayerFactory';
import { WMSMapLayerFactory } from './wmsMapLayerFactory';
import { DistributionFormat } from 'api/webApi/data/distributionFormat.interface';
import { MapLayerFactory } from './mapLayerFactory.interface';
import { MapLayerFromConfigurableStrategy } from './mapLayerFromConfigurableStrategy';
import { CompositeMapLayerFactory } from './compositeMapLayerFactory';
import { GeoJSONImageOverlayMapLayerFactory } from './geoJSONImageOverlayMapLayerFactory';
import { Injector } from '@angular/core';
import { CovJSONMapLayerFactory } from './covJSONMapLayerFactory';
import { WMTSMapLayerFactory } from './wmtsMapLayerFactory';
import { Feature } from 'geojson';
import L from 'leaflet';
import { DataSearchConfigurablesServiceResource } from 'pages/dataPortal/modules/dataPanel/services/dataSearchConfigurables.service';
import { DataSearchConfigurablesServiceRegistry } from 'pages/dataPortal/modules/registryPanel/services/dataSearchConfigurables.service';

/** The `MapLayerGenerator` class is responsible for generating map layers based on configurable data
and map configurations. */
export class MapLayerGenerator {
  private readonly executionService: ExecutionService;
  private readonly dataSearchConfigurablesServiceResource: DataSearchConfigurablesServiceResource;
  private readonly dataSearchConfigurablesServiceRegistry: DataSearchConfigurablesServiceRegistry;

  private constructor(
    injector: Injector,
    private readonly fromConfigurable: MapLayerStrategy<Configurable>, //
    private readonly factoryMap: Map<string, MapLayerFactory<unknown, MapLayer>>
  ) {
    this.executionService = injector.get<ExecutionService>(ExecutionService);
    this.dataSearchConfigurablesServiceResource = injector.get<DataSearchConfigurablesServiceResource>(DataSearchConfigurablesServiceResource);
    this.dataSearchConfigurablesServiceRegistry = injector.get<DataSearchConfigurablesServiceRegistry>(DataSearchConfigurablesServiceRegistry);
  }

  /**
   * The function creates a MapLayerGenerator object with various MapLayerFactory objects based on
   * different distribution format types.
   * @param {Injector} injector - The `injector` parameter is an instance of the `Injector` class. It
   * is used for dependency injection, which allows you to provide instances of classes or values to be
   * used by other classes.
   * @returns an instance of the `MapLayerGenerator` class.
   */
  public static make(
    injector: Injector,
  ): MapLayerGenerator {
    const fromConfigurable: MapLayerStrategy<Configurable> = MapLayerFromConfigurableStrategy.make();

    const factoryMap = new Map<string, MapLayerFactory<unknown, MapLayer>>();
    const geoJSONCompositeFactory = new CompositeMapLayerFactory<GeoJSON.GeoJsonObject, MapLayer>([
      new GeoJSONMapLayerFactory(injector),
      new GeoJSONImageOverlayMapLayerFactory(injector),
    ]);

    const covJSONCompositeFactory = new CompositeMapLayerFactory<GeoJSON.GeoJsonObject, MapLayer>([
      new CovJSONMapLayerFactory(injector),
    ]);

    factoryMap.set(DistributionFormatType.APP_GEOJSON, geoJSONCompositeFactory);
    factoryMap.set(DistributionFormatType.APP_EPOS_GEOJSON, geoJSONCompositeFactory);
    factoryMap.set(DistributionFormatType.APP_EPOS_MAP_GEOJSON, geoJSONCompositeFactory);
    factoryMap.set(DistributionFormatType.APP_OGC_WMS, new WMSMapLayerFactory(injector));
    factoryMap.set(DistributionFormatType.APP_OGC_WMTS, new WMTSMapLayerFactory(injector));
    factoryMap.set(DistributionFormatType.APP_COV_JSON, covJSONCompositeFactory);
    factoryMap.set(DistributionFormatType.APP_EPOS_COV_JSON, covJSONCompositeFactory);

    return new MapLayerGenerator(injector, fromConfigurable, factoryMap);
  }

  /**
   * The function creates map layers based on a configurable data source and map configuration.
   * @param {DataConfigurable} dataConfigurable - The `dataConfigurable` parameter is an object of type
   * `DataConfigurable`. It contains the configuration details for the data that will be used to create
   * map layers.
   * @param {EposLeafletComponent} mapConfig - The `mapConfig` parameter is of type
   * `EposLeafletComponent`. It is an object that contains the configuration settings for the map
   * component.
   * @returns An array of MapLayer objects.
   */
  public createMapLayersFromConfigurable(
    dataConfigurable: DataConfigurable,
    mapConfig: EposLeafletComponent,
  ): Array<MapLayer> {
    const dist = dataConfigurable.getDistributionDetails();
    const format = dist.getMappableFormats()[0];
    const formatString: string = format.getFormat().toLowerCase();

    const factory = this.factoryMap.get(formatString);
    if (null == factory) {
      return new Array<MapLayer>();
    } else {
      // Switch on format
      switch (true) {
        case (DistributionFormatType.in(formatString, [
          DistributionFormatType.APP_GEOJSON,
          DistributionFormatType.APP_EPOS_GEOJSON,
          DistributionFormatType.APP_EPOS_MAP_GEOJSON,
          DistributionFormatType.APP_COV_JSON,
          DistributionFormatType.APP_EPOS_COV_JSON,
        ])):
          return this.createGeoJSONLayers(dataConfigurable, mapConfig, factory, format);
        case (DistributionFormatType.is(formatString, DistributionFormatType.APP_OGC_WMS)):
          return this.fromConfigurable.createMapLayersFrom(
            dataConfigurable,
            mapConfig,
            factory,
            () => Promise.resolve(this.executionService.getExecuteUrl(format)),
          );
        case (DistributionFormatType.is(formatString, DistributionFormatType.APP_OGC_WMTS)):
          return this.fromConfigurable.createMapLayersFrom(
            dataConfigurable,
            mapConfig,
            factory,
            () => Promise.resolve(this.executionService.getExecuteUrl(format)),
          );
        default: return new Array<MapLayer>();
      }
    }
  }

  public retrieveBoundsFromPlainFeatureCollection(features: Feature[]): number[] {

    const bounds = L.geoJSON(features).getBounds();

    const north = bounds.getNorth();
    const east = bounds.getEast();
    const south = bounds.getSouth();
    const west = bounds.getWest();

    const calculatedBounds = [north, east, south, west];

    return calculatedBounds;
  }


  public retrieveBoundsFromEposImageOverlay(features: Feature[]) {

    const bboxArray: number[][] = [];

    features.forEach(feature => {
      // For image overlays we are receiving bbox in this order:
      // 1. North
      // 2. West
      // 3. South
      // 4. East
      // in the 'calcMinMaxImgOverlay' they are returned in the right order (the order needed for the boundingBox creation and therefore matched also by 'retrieveBoundsFromPlainFeat...()')

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const featureBboxValues = feature['@epos_image_overlay'].bbox;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      bboxArray.push(featureBboxValues);

    });

    const bounds: number[] = this.calcMinMaxImgOverlayBounds(bboxArray);

    return bounds;
  }

  public calcMinMaxImgOverlayBounds(array: number[][]): number[] {
    let maxLat: number = -Infinity;
    let minLong: number = Infinity;
    let minLat: number = Infinity;
    let maxLong: number = -Infinity;
    array.forEach(bbox => {
      // North
      if (bbox[0] > maxLat!) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        maxLat = bbox[0];
      }

      // West
      if (bbox[1] < minLong!) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        minLong = bbox[1];
      }

      // South
      if (bbox[2] < minLat!) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        minLat = bbox[2];
      }

      // East
      if (bbox[3] > maxLong!) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        maxLong = bbox[3];
      }
    });

    // reordered
    const north = maxLat;
    const east = maxLong;
    const south = minLat;
    const west = minLong;

    const bounds = [north, east, south, west];

    return bounds;

  }


  private createGeoJSONLayers(
    dataConfigurable: DataConfigurable, //
    mapConfig: EposLeafletComponent, factory: MapLayerFactory<unknown, MapLayer>, //
    format: DistributionFormat,
  ): Array<MapLayer> {
    return this.fromConfigurable.createMapLayersFrom(
      dataConfigurable,
      mapConfig,
      factory,
      this.makeTheDataFunctionForGeoJSON(dataConfigurable, format),
    );
  }

  private makeTheDataFunctionForGeoJSON(
    dataConfigurable: DataConfigurable,
    format: DistributionFormat,
  ): () => Promise<GeoJSON.GeoJsonObject> {
    let returnPromise: Promise<GeoJSON.GeoJsonObject>;
    return () => {
      if (null == returnPromise) {
        returnPromise = new Promise((resolve) => {
          resolve(
            this.executionService.executeDistributionFormat(
              dataConfigurable.getDistributionDetails(),
              format,
              dataConfigurable.getParameterDefinitions(),
              dataConfigurable.currentParamValues.slice(),
            ) as Promise<GeoJSON.GeoJsonObject>);
        });
        // if type is FeatureCollection, data as FeatureCollection and pass it to mapIntService
        returnPromise.then((data) => {

          if (data.type === 'FeatureCollection') {

            const asFeatureCollection = data as GeoJSON.FeatureCollection;
            const features = asFeatureCollection.features;

            let bounds: Array<number> = [];

            if ('@epos_image_overlay' in features[0]) {
              bounds = this.retrieveBoundsFromEposImageOverlay(features);
            }
            else {
              bounds = this.retrieveBoundsFromPlainFeatureCollection(features);
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            void this.dataSearchConfigurablesServiceResource.updateLayerBbox(dataConfigurable.id, bounds); // --
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            void this.dataSearchConfigurablesServiceRegistry.updateLayerBbox(dataConfigurable.id, bounds);

          }
          // if type 'Coverage'
          else if ('ranges' in data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const asRecord = data as Record<string, any>;
            if (asRecord.type != null && asRecord.type === 'Coverage') {
              try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                const north = asRecord.domain.axes.y.values[0];
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                const east = asRecord.domain.axes.x.values[0];
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                const south = asRecord.domain.axes.y.values[0];
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                const west = asRecord.domain.axes.x.values[0];

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const bounds: number[] = [north, east, south, west];

                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                void this.dataSearchConfigurablesServiceResource.updateLayerBbox(dataConfigurable.id, bounds); // --
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                void this.dataSearchConfigurablesServiceRegistry.updateLayerBbox(dataConfigurable.id, bounds);

              }
              catch (e) {
                console.log(e);
              }
            }
          }
          else {
            console.log('Type of data is not a FeatureCollection');
          }
        }).catch((error) => {
          // can't retrieve GeoJSON Data, so no data to pass for the bbox
          console.error('No GeoJSONData.', error);
        });
      }
      return returnPromise;
    };
  }

}
