import { EsriBaseLayer } from '../../layers/esriBaseLayer';
import { BaseLayerOption } from './baseLayerOption';

/**
 * Single place for defining leaflet map baselayers used on all maps
 */
export const baseLayerOptions = [
  new BaseLayerOption('None', () => [
  ], () => '', ['EPSG:3857', 'EPSG:3995']),

  new BaseLayerOption('World Imagery', () => [
    new EsriBaseLayer('World Imagery', 'EPOS')
      .setUrl('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png')
      .setAttr('&copy; <a href="https://www.eea.europa.eu/en/">EuropeanEnvironmentAgency</a>')
      .toggleable.set(false),
  ], () => './assets/img/baseLayer/World-Imagery.png', ['EPSG:3857']),

  new BaseLayerOption('Open Street Map', () => [
    new EsriBaseLayer('EPOS', 'EPOS')
      .setUrl('https://tile.openstreetmap.org/{z}/{x}/{y}.png')
      .toggleable.set(false)
      .setAttr('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'),
  ], () => './assets/img/baseLayer/osm.png', ['EPSG:3857']),

  new BaseLayerOption('Open Street Map - Topographic', () => [
    new EsriBaseLayer('EPOS topo', 'EPOS')
      .setUrl('https://tile.opentopomap.org/{z}/{x}/{y}.png')
      .setAttr('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>')
      .toggleable.set(false),
  ], () => './assets/img/baseLayer/osm-topo.png', ['EPSG:3857']),


  // NOTE: This has an alternative 'no-labels' version, to use it: -> "https://gisco-services.ec.europa.eu/maps/tiles/OSMPositronBackground/EPSG3857/{z}/{x}/{y}.png"
  new BaseLayerOption('OSM Positron Composite', () => [
    new EsriBaseLayer('OSM Positron Composite', 'EPOS')
      .setUrl('https://gisco-services.ec.europa.eu/maps/tiles/OSMPositronComposite/EPSG3857/{z}/{x}/{y}.png')
      .setAttr('&copy; <a href="https://www.eea.europa.eu/en/">EuropeanEnvironmentAgency</a>|<a href="https://data.europa.eu/data/datasets/estat-gisco?locale=en">GISCO</a>')
      .toggleable.set(false),
  ], () => './assets/img/baseLayer/OSM-Positron-Composite.png', ['EPSG:3857']),

  // NOTE: This has an alternative WMTS version, it includes both a regular Blossom map and a Positron one, side by side (to call it use this request: "https://gisco-services.ec.europa.eu/maps/service?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=OSMBlossomComposite&STYLE=default&FORMAT=image%2Fpng&TILEMATRIXSET=EPSG3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}.png")
  new BaseLayerOption('OSM Blossom Composite', () => [
    new EsriBaseLayer('OSM Blossom Composite', 'EPOS')
      .setUrl('https://gisco-services.ec.europa.eu/maps/tiles/OSMBlossomComposite/EPSG3857/{z}/{x}/{y}.png')
      .setAttr('&copy; <a href="https://www.eea.europa.eu/en/">EuropeanEnvironmentAgency</a>|<a href="https://data.europa.eu/data/datasets/estat-gisco?locale=en">GISCO</a>')
      .toggleable.set(false),
  ], () => './assets/img/baseLayer/OSM-Blossom-Composite.png', ['EPSG:3857']),

  // 'Map Data not yet available' (when zoom level too high, discuss if to keep it or discard it)
  new BaseLayerOption('Ocean', () => [
    new EsriBaseLayer('Ocean', 'EPOS')
      .setUrl('https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}.png')
      .setAttr('&copy; <a href="https://www.eea.europa.eu/en/">EuropeanEnvironmentAgency</a>')
      .toggleable.set(false),
  ], () => './assets/img/baseLayer/Ocean.png', ['EPSG:3857']),

  new BaseLayerOption('Arctic Bathymetry', () => [

    new EsriBaseLayer('Arctic Bathymetry', 'EPOS')
      .setUrl('https://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/Arctic_Bathymetry_Basemap/MapServer/tile/{z}/{y}/{x}')
      .setAttr('© NOAA NCEI, IBCAO, GEBCO, Natural Earth')
      .setOptions({
        noWrap: true,
        tileSize: 256,
        maxNativeZoom: 9,
        minNativeZoom: 1,
      })
      .toggleable.set(false),
  ], () => './assets/img/baseLayer/arctic-bathymetry.png', ['EPSG:3995']),



];
