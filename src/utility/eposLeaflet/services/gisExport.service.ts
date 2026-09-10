import { Injectable } from '@angular/core';
import { Feature, FeatureCollection, GeoJsonObject, Geometry, GeometryCollection } from 'geojson';
import { saveAs } from 'file-saver';
import { CovJSONMapLayer } from 'utility/maplayers/covJSONMapLayer';
import { GeoJSONHelper } from 'utility/maplayers/geoJSONHelper';
import { GeoJsonLayer, MapLayer, WmsTileLayer, WmtsTileLayer } from '../eposLeaflet';

export interface GisVectorLayer {
  id: string;
  name: string;
  type: string;
  featureCount: number;
  selected: boolean;
  features: Array<GisFeature>;
}

export interface GisMapServiceLayer {
  id: string;
  name: string;
  type: 'WMS' | 'WMTS';
  url: string;
}

export interface GisUnsupportedLayer {
  id: string;
  name: string;
  reason: string;
}

export interface GisExportSnapshot {
  vectorLayers: Array<GisVectorLayer>;
  mapServices: Array<GisMapServiceLayer>;
  unsupportedLayers: Array<GisUnsupportedLayer>;
}

export interface GisLayerExportResult {
  layerName: string;
  exportedFeatures: number;
  skippedFeatures: number;
  error?: string;
}

export interface GisExportResult {
  fileName: string | null;
  layers: Array<GisLayerExportResult>;
}

type GisColumnType = 'BOOLEAN' | 'INTEGER' | 'REAL' | 'TEXT';
type GisFeature = Feature<Geometry, Record<string, unknown>>;

interface GisColumn {
  sourceName: string;
  targetName: string;
  dataType: GisColumnType;
}

interface BrowserGeoPackage {
  createFeatureTableFromProperties(
    tableName: string,
    properties: Array<{ name: string; dataType: string }>,
  ): boolean;
  addGeoJSONFeaturesToGeoPackage(
    features: Array<GisFeature>,
    tableName: string,
    index: boolean,
    batchSize: number,
  ): Promise<number>;
  deleteTableQuietly(tableName: string): void;
  export(): Promise<Uint8Array>;
  close(): void;
}

interface GeoPackageBrowserModule {
  GeoPackageAPI: {
    create(): Promise<BrowserGeoPackage>;
  };
  setSqljsWasmLocateFile(locateFile: (fileName: string) => string): void;
}

@Injectable({ providedIn: 'root' })
export class GisExportService {
  private geoPackageModulePromise: Promise<GeoPackageBrowserModule> | null = null;

  public createSnapshot(layers: Array<MapLayer>): GisExportSnapshot {
    const snapshot: GisExportSnapshot = {
      vectorLayers: [],
      mapServices: [],
      unsupportedLayers: [],
    };

    layers.forEach(layer => {
      if (this.isUtilityLayer(layer)) {
        return;
      }

      if (layer instanceof WmsTileLayer || layer instanceof WmtsTileLayer) {
        const service: GisMapServiceLayer = {
          id: layer.id,
          name: layer.name,
          type: layer instanceof WmsTileLayer ? 'WMS' : 'WMTS',
          url: '',
        };
        snapshot.mapServices.push(service);
        void layer.getServiceUrl().then(url => {
          service.url = url;
        });
        return;
      }

      if (layer instanceof GeoJsonLayer) {
        const features = this.extractFeatures(layer.getGeoJsonData());
        if (features.length > 0) {
          snapshot.vectorLayers.push({
            id: layer.id,
            name: layer.name,
            type: layer instanceof CovJSONMapLayer ? 'CoverageJSON (converted)' : 'GeoJSON',
            featureCount: features.length,
            selected: true,
            features,
          });
        } else {
          snapshot.unsupportedLayers.push({
            id: layer.id,
            name: layer.name,
            reason: 'No loaded vector features',
          });
        }
        return;
      }

      if (layer.visibleOnLayerControl.get()) {
        snapshot.unsupportedLayers.push({
          id: layer.id,
          name: layer.name,
          reason: 'Not available for GIS export',
        });
      }
    });

    return snapshot;
  }

  public async export(layers: Array<GisVectorLayer>): Promise<GisExportResult> {
    const geopackageModule = await this.loadGeoPackageModule();
    geopackageModule.setSqljsWasmLocateFile((fileName: string) =>
      new URL(`assets/geopackage/${fileName}`, document.baseURI).toString()
    );

    const geoPackage = await geopackageModule.GeoPackageAPI.create();
    const usedTableNames = new Set<string>();
    const results = new Array<GisLayerExportResult>();
    let successfulLayers = 0;

    try {
      for (const layer of layers) {
        const tableName = this.makeUniqueTableName(layer.name, usedTableNames);
        const validFeatures = layer.features.filter(feature => this.isValidFeature(feature));
        const skippedFeatures = layer.features.length - validFeatures.length;

        if (validFeatures.length === 0) {
          results.push({
            layerName: layer.name,
            exportedFeatures: 0,
            skippedFeatures,
            error: 'No valid features to export',
          });
          continue;
        }

        try {
          const columns = this.buildColumns(validFeatures);
          const normalizedFeatures = validFeatures.map(feature => this.normalizeFeature(feature, columns));
          geoPackage.createFeatureTableFromProperties(
            tableName,
            columns.map(column => ({ name: column.targetName, dataType: column.dataType }))
          );
          const exportedFeatures = await geoPackage.addGeoJSONFeaturesToGeoPackage(
            normalizedFeatures,
            tableName,
            false,
            1000
          );
          successfulLayers++;
          results.push({ layerName: layer.name, exportedFeatures, skippedFeatures });
        } catch (error) {
          geoPackage.deleteTableQuietly(tableName);
          results.push({
            layerName: layer.name,
            exportedFeatures: 0,
            skippedFeatures,
            error: error instanceof Error ? error.message : 'Unable to export layer',
          });
        }
      }

      if (successfulLayers === 0) {
        return { fileName: null, layers: results };
      }

      const bytes = await geoPackage.export();
      const fileName = `EPOS_export_${Date.now()}.gpkg`;
      saveAs(new Blob([bytes], { type: 'application/geopackage+sqlite3' }), fileName);
      return { fileName, layers: results };
    } finally {
      geoPackage.close();
    }
  }

  private loadGeoPackageModule(): Promise<GeoPackageBrowserModule> {
    const browserWindow = window as Window & { GeoPackage?: GeoPackageBrowserModule };
    if (browserWindow.GeoPackage != null) {
      return Promise.resolve(browserWindow.GeoPackage);
    }
    if (this.geoPackageModulePromise != null) {
      return this.geoPackageModulePromise;
    }

    this.geoPackageModulePromise = new Promise<GeoPackageBrowserModule>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('assets/geopackage/geopackage.min.js', document.baseURI).toString();
      script.async = true;
      script.onload = () => {
        if (browserWindow.GeoPackage == null) {
          reject(new Error('GeoPackage library did not initialize.'));
        } else {
          resolve(browserWindow.GeoPackage);
        }
      };
      script.onerror = () => reject(new Error('Unable to load the GeoPackage library.'));
      document.head.appendChild(script);
    });
    return this.geoPackageModulePromise;
  }

  private extractFeatures(data: GeoJsonObject | undefined): Array<GisFeature> {
    if (data == null) {
      return [];
    }
    if (data.type === 'FeatureCollection') {
      return (data as FeatureCollection<Geometry, Record<string, unknown>>).features.slice();
    }
    if (data.type === 'Feature') {
      return [data as GisFeature];
    }
    return [];
  }

  private isUtilityLayer(layer: MapLayer): boolean {
    return !layer.visibleOnLayerControl.get()
      || layer.id.includes(MapLayer.BBOX_LAYER_ID)
      || layer.id.includes(MapLayer.BBOX_EDITABLE_LAYER_ID)
      || layer.id.endsWith(GeoJSONHelper.IMAGE_OVERLAY_ID_SUFFIX);
  }

  private isValidFeature(feature: GisFeature): boolean {
    return feature != null
      && feature.type === 'Feature'
      && (feature.geometry == null || this.isValidGeometry(feature.geometry));
  }

  private isValidGeometry(geometry: Geometry): boolean {
    if (geometry.type === 'GeometryCollection') {
      return (geometry as GeometryCollection).geometries.every(item => this.isValidGeometry(item));
    }

    const coordinates = (geometry as Exclude<Geometry, GeometryCollection>).coordinates as unknown;
    switch (geometry.type) {
      case 'Point':
        return this.isPosition(coordinates);
      case 'MultiPoint':
        return this.isArrayOf(coordinates, item => this.isPosition(item));
      case 'LineString':
        return this.isLineString(coordinates);
      case 'MultiLineString':
        return this.isArrayOf(coordinates, item => this.isLineString(item));
      case 'Polygon':
        return this.isPolygon(coordinates);
      case 'MultiPolygon':
        return this.isArrayOf(coordinates, item => this.isPolygon(item));
      default:
        return false;
    }
  }

  private isPosition(value: unknown): boolean {
    return Array.isArray(value)
      && value.length >= 2
      && value.every(coordinate => typeof coordinate === 'number' && Number.isFinite(coordinate));
  }

  private isLineString(value: unknown): boolean {
    return Array.isArray(value)
      && value.length >= 2
      && value.every(position => this.isPosition(position));
  }

  private isPolygon(value: unknown): boolean {
    return this.isArrayOf(value, ring => {
      if (!Array.isArray(ring) || ring.length < 4 || !ring.every(position => this.isPosition(position))) {
        return false;
      }
      return JSON.stringify(ring[0]) === JSON.stringify(ring[ring.length - 1]);
    });
  }

  private isArrayOf(value: unknown, validator: (item: unknown) => boolean): boolean {
    return Array.isArray(value) && value.length > 0 && value.every(item => validator(item));
  }

  private buildColumns(features: Array<GisFeature>): Array<GisColumn> {
    const propertyNames = new Array<string>();
    features.forEach(feature => {
      Object.keys(feature.properties || {}).forEach(propertyName => {
        if (propertyName !== GeoJSONHelper.STYLE_ID_ATTR && !propertyNames.includes(propertyName)) {
          propertyNames.push(propertyName);
        }
      });
    });

    const usedColumnNames = new Set<string>(['id', 'geometry']);
    return propertyNames.map(sourceName => ({
      sourceName,
      targetName: this.makeUniqueColumnName(sourceName, usedColumnNames),
      dataType: this.inferColumnType(features.map(feature => feature.properties?.[sourceName])),
    }));
  }

  private inferColumnType(values: Array<unknown>): GisColumnType {
    const types = new Set<string>();
    values.forEach(value => {
      if (value == null) {
        return;
      }
      if (typeof value === 'number') {
        types.add(Number.isFinite(value) ? (Number.isInteger(value) ? 'INTEGER' : 'REAL') : 'TEXT');
      } else if (typeof value === 'boolean') {
        types.add('BOOLEAN');
      } else if (typeof value === 'string') {
        types.add('TEXT');
      } else {
        types.add('COMPLEX');
      }
    });

    if (types.size === 0) {
      return 'TEXT';
    }
    if (types.size === 1) {
      const onlyType = Array.from(types)[0];
      return onlyType === 'COMPLEX' ? 'TEXT' : onlyType as GisColumnType;
    }
    if (types.size === 2 && types.has('INTEGER') && types.has('REAL')) {
      return 'REAL';
    }
    return 'TEXT';
  }

  private normalizeFeature(feature: GisFeature, columns: Array<GisColumn>): GisFeature {
    const properties = {} as Record<string, null | boolean | number | string>;
    columns.forEach(column => {
      properties[column.targetName] = this.normalizePropertyValue(
        feature.properties?.[column.sourceName],
        column.dataType
      );
    });
    return {
      type: 'Feature',
      geometry: feature.geometry,
      properties,
    };
  }

  private normalizePropertyValue(
    value: unknown,
    dataType: GisColumnType,
  ): null | boolean | number | string {
    if (value == null) {
      return null;
    }
    if (dataType !== 'TEXT') {
      return value as boolean | number;
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  private makeUniqueTableName(name: string, usedNames: Set<string>): string {
    const normalized = name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase()
      .slice(0, 63) || 'layer';
    return this.makeUniqueName(normalized, usedNames, 63);
  }

  private makeUniqueColumnName(name: string, usedNames: Set<string>): string {
    let normalized = name.replace(/\0/g, '').trim().slice(0, 63) || 'property';
    if (normalized.toLowerCase() === 'id' || normalized.toLowerCase() === 'geometry') {
      normalized = `property_${normalized}`;
    }
    return this.makeUniqueName(normalized, usedNames, 63);
  }

  private makeUniqueName(name: string, usedNames: Set<string>, maximumLength: number): string {
    let candidate = name;
    let suffix = 2;
    while (usedNames.has(candidate.toLowerCase())) {
      const suffixText = `_${suffix++}`;
      candidate = name.slice(0, maximumLength - suffixText.length) + suffixText;
    }
    usedNames.add(candidate.toLowerCase());
    return candidate;
  }
}
