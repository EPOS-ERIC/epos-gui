import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { Legend } from '../controls/legendControl/legend';
import { TileLayer } from './tileLayer';
import { FeatureDisplayItemGenerator } from '../featureDisplay/featureDisplayItemGenerator';
import 'jquery';
import { MapLayer } from './mapLayer.abstract';
import { WmtsFeatureDisplayItemGenerator } from './wmtsFeatureDisplayItemGenerator';
import { DataSearchConfigurablesServiceResource } from 'pages/dataPortal/modules/dataPanel/services/dataSearchConfigurables.service';
import { MapInteractionService } from 'utility/eposLeaflet/services/mapInteraction.service';
import { WmtsTileJSON as TileJSON } from 'api/webApi/data/wmtsTileJSON.interface';
import { DataSearchConfigurablesServiceRegistry } from 'pages/dataPortal/modules/registryPanel/services/dataSearchConfigurables.service';
import { ImageLegendItem} from 'utility/eposLeaflet/eposLeaflet';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';

export enum WMTSParameter {
  FORMAT = 'FORMAT',
  LAYER = 'LAYER',
  REQUEST = 'REQUEST',
  SERVICE = 'SERVICE',
  TILEMATRIX = 'TILEMATRIX',
  TILEMATRIXSET = 'TILEMATRIXSET',
  SRS = 'SRS',
  TILECOL = 'TILECOL',
  TILEROW = 'TILEROW',
  INFOFORMAT = 'INFOFORMAT',
  WIDTH = 'WIDTH',
  HEIGHT = 'HEIGHT',
  STYLE = 'STYLE',
}

// blend interface of previously split WMTSLayerTableData and LayerTemplateReqs
export interface WMTSLayerTableData {
  originatorConfig: string;
  layerID: string;
  title: string;
  abstract: string;
  metadataUrl: string;
  layerIdentifier: string;
  tileMatrixSet: string | Array<string>;
  coordinates: Array<string>;
  tileJSONTemplate: string;
  featureInfoTemplate: string;
  style: string;
  legendsURL: string;
  tableRowPropertyId: string;
  isDefaultLayer: boolean;
}

interface LayerLegend{
  href: string;
  legendLabel: string;
  tableRowPropertyId: string;
}

export class WmtsTileLayer extends TileLayer {

  public static readonly WMTSParameters: Array<string> = [
    WMTSParameter.FORMAT,
    WMTSParameter.LAYER,
    WMTSParameter.REQUEST,
    WMTSParameter.SERVICE,
    WMTSParameter.TILEMATRIX,
    WMTSParameter.TILEMATRIXSET,
    WMTSParameter.SRS,
    WMTSParameter.TILECOL,
    WMTSParameter.TILEROW,
    WMTSParameter.STYLE,
  ];

  public crsCheckReady?: Promise<void>;
  public crsCompatibilityResults: Array<{ layerName: string; crs: string; status: boolean }> = [];
  public checkCrsCompatibility?: (crs: string) => Promise<Array<{ layerName: string; crs: string; status: boolean }>>;

  // this is assigned later on, when extracting info from GetCapabilities XML in the getLeafletLayer() method
  public getFeatureInfoBaseURL: string = '';
  // used by getFeatureInfo
  public styleFromXML: string = '';
  // used by GetFeatureInfo
  public getFeatureInfoFormat: string = '';
  // both assigned in default/first layer creation and Table-triggered layer creation
  public boundsFromXML: Array<string> = [''];

  // this is used to retrieve Legends for both first/default layer and "customURL" layer (which is, a layer triggered from Table View)
  public legendsURL: string = '';

  // legendsMap (this is going to be populated only from default layer, which is 'parent' layer)
  public legendsMap = new Map<string, LayerLegend>();

  // flag used to signal default/first loaded layer to getLayerInfoForTable...()
  public defaultLayerPlaceholderID: string | null;

  protected getCapabilitiesXML: JQuery<XMLDocument>;
  protected getCapabilitiesPromise: null | Promise<JQuery<XMLDocument>>;


  constructor(id: string, name?: string, pane?: string) {
    super(id, name);
    // Default options
    this.options.setOptions({
      format: 'image/png',
      transparent: true,
      pane: pane ? pane : id,
      width: 256,
      height:256,
    });

    // assign here in the constructor this placeHolderID: it's needed to keep first loaded map layer ID in sync with Table Layers data
    this.defaultLayerPlaceholderID = 'placeholderID';

    this.setLegendCreatorFunction(this.createLegendsDefault.bind(this) as (layer: MapLayer, http: HttpClient) => Promise<null | Array<Legend>>);
    this.setLayerBboxRetrieverFunction(this.getLayerBboxFromGetCapabilitiesXml.bind(this) as (layer: MapLayer, http: HttpClient) => Promise<null | Array<number>>);
    this.setLayerInfoForTableRetrieverFunction(this.getLayerInfoForTableVisualization.bind(this) as (layer: MapLayer, http: HttpClient) => Promise<null | Array<JQuery<Element>>>);
  }

  public getLeafletLayer(http: HttpClient): Promise<null | L.Layer> {
    // if layer creation was triggered from Table View, then just use the CustomURLTemplate set in the options (this option will be available only in this type of occurrence)
    if(this.options.get('customURLTemplate') != null && this.options.get('customURLTemplate') !== ''){
      return new Promise((resolve)=>{
        resolve(L.tileLayer((this.options.get('customURLTemplate') as string), this.options.getAll()));
      });
    }
    // initialize placeholderID variable here, each time the layer(/s) creation starts (gets cleaned in the getLayerInfoForTable...()) (this is specifically needed when i'm resetting spatial filter)
    this.defaultLayerPlaceholderID = 'placeholderID';
    return new Promise((resolve) => {
      try {
        // use copy
        const options = {
          ...this.options.getAll(),
        };

        const parameters = new Map<string, null | string>();
        const optionsCopy = {};

        // filter and map options
        Object.keys(options).forEach((key: string) => {
          switch (true) {
            case key.toLowerCase() === 'bbox':
              break;
            case key.startsWith('customLayerOption'):
              break;
            case WmtsTileLayer.WMTSParameters.includes(key.toUpperCase()):
              parameters.set(key.toUpperCase(), options[key] as string);
              break;
            default:
              optionsCopy[key] = options[key];
              break;
          }
        });

        // variable to hold the GetTile Request URL once extracted from GetCapabilities XML
        let getTileUrl: string | null = null;
        // variable to hold the GetFeatureInfo Request URL once extracted from GetCapabilities XML
        let getFeatureInfoUrl: string = '';

        this.getCapabilitiesXml(http)
        .then(($xml: JQuery<XMLDocument>) => {
          // if GetCapabilities XML
          if ($xml != null) {
            const capabilities = $xml;

            // the URL to extract from XML to retrieve Z,Y,X GetTile Request URL
            let getTileJSONUrl: string | null = null;
            // the layer style to pass to the GetTile and FeatureInfo Request
            let style: string = '';
            // the GetFeatureInfo format
            let featInfoFormat = '';
            // the bounds of the layer
            let bounds: Array<string> = [];

            // already set bounds (if any, e.g.: i've just set the spatial filter and the creation of the layer has just been retriggered, at this point i will have them available)
            let alreadySetBounds: Array<number> | null = null;
            // checking if boundingBox filter set (i will filter data table according to the set boundingBox)
            const ls = new LocalStoragePersister();
            const lsDataSearchBounds = ls.getValue(LocalStorageVariables.LS_DATA_SEARCH_BOUNDS) as Array<number> | null;
            // if filter set (load only those falling in the set bounds)
            if(lsDataSearchBounds != null){
              alreadySetBounds = ls.getValue(LocalStorageVariables.LS_DATA_SEARCH_BOUNDS) as Array<number>;
            }

            // PARSE GetCapabilities XML
            capabilities.find('Layer').each(function(mainIterIndex) {
              const layerEl = $(this);
                // EXTRACT metadata from Layer

                // BOUNDS
                const bboxEl = layerEl.find('*').filter(function() {
                  return this.localName.toLowerCase().includes('boundingbox');
                }).first();
                // defined as lon_min, lat_min in GetCapabilities XML
                const lowerBounds = bboxEl.find('ows\\:LowerCorner, LowerCorner').text().split(' ');
                // defined as lon_max, lat_max in GetCapabilities XML
                const upperBounds = bboxEl.find('ows\\:UpperCorner, UpperCorner').text().split(' ');

                // reordering bounds in this variable as expected from leaflet (eg.: bounds = [ [lat_min, lon_min], [lat_max, lon_max] ])
                const lowerBoundsInLeafletOrder =  [lowerBounds[1], lowerBounds[0]];
                const upperBoundsInLeafletOrder =  [upperBounds[1], upperBounds[0]];
                // final reordered South, West, North, East
                const boundsInLeafletOrder = [lowerBoundsInLeafletOrder[0], lowerBoundsInLeafletOrder[1], upperBoundsInLeafletOrder[0], upperBoundsInLeafletOrder[1]];
                // finally assigning the bounds (to upperscope variable: the variable allows us to to assign the class member later on)
                bounds = boundsInLeafletOrder;

                // if spatial filter set, if layer in set bounds, continue with creation, otherwise skip to next iteration/layer
                if(alreadySetBounds != null && alreadySetBounds.length === 4){
                  const mainBounds = new L.LatLngBounds(
                    L.latLng(alreadySetBounds[2], alreadySetBounds[3]),
                    L.latLng(alreadySetBounds[0], alreadySetBounds[1])
                  );
                  const layerSpecificBounds = new L.LatLngBounds(
                    L.latLng(Number(boundsInLeafletOrder[0]), Number(boundsInLeafletOrder[1])),
                    L.latLng(Number(boundsInLeafletOrder[2]), Number(boundsInLeafletOrder[3]))
                  );
                  // check if bounds of the current layer intersect with the spatial filter bounds -> if not so, go to next iteration/layer
                  if(!mainBounds.intersects(layerSpecificBounds)){
                    if(mainIterIndex === capabilities.find('Layer').length - 1){
                      return resolve(null);
                    }
                    return; // skip to next iteration
                  }
                }
                // STYLE
                const defaultStyle = layerEl.find('Style[isDefault="true"]').first();
                if (defaultStyle.length > 0) {
                  const styleIdentifier = defaultStyle.find('ows\\:Identifier, Identifier').first().text();
                  // assign styleIdentifier to style (it's used to replace the {style} parameter in the TileJSON URL retrieved a few lines below)
                  style = styleIdentifier;
                } else {
                  // if no defaultStyle found, assigning first available style identifier
                  console.warn('No Default Style Found. Applying first available style found');
                  style = layerEl.find('Style > ows\\:Identifier, Style > Identifier').first().text();
                }

                // these two flags are needed to signal if both cases of following ".each()" iteration have been tapped!
                let tileJSONTapped = false;
                let featureInfoTapped = false;
                // finding both the TileJSON and FeatureInfo URL; also 'format' for FeatureInfo
                layerEl.find('ResourceURL').each((index, element) => {

                  const resourceType = $(element).attr('resourceType');
                  // for raw TileJSON Url template
                  let rawTemplateTileJSON = '';
                  // for stripped TileJSON Url template
                  let templateTileJSONAttrURL = '';

                  // for raw FeatureInfo Url template (no need for stripping here)
                  let rawTemplateFeatureInfo = '';

                  // array of found formats, to be used in fallback if no 'application/json' format found
                  const foundFeatureInfoFormats: string[] = [];

                  switch(resourceType){
                    case 'TileJSON':
                      // raw TileJSON URL template
                      rawTemplateTileJSON = $(element).attr('template') || '';
                      // URL stripped from {style} parameter, otherwise raw template
                      templateTileJSONAttrURL = (rawTemplateTileJSON !== '' && rawTemplateTileJSON.includes('{style}') && style != null) ? rawTemplateTileJSON.replace('{style}', style) : rawTemplateTileJSON;
                      // final TileJSON URL
                      getTileJSONUrl = templateTileJSONAttrURL;
                      // flag to signal if this case has been entered (if both this and the other one have been entered we'll break the loop; check for this at the end of each iteration)
                      tileJSONTapped = true;
                      break;
                    case 'FeatureInfo':
                      // push the format attribute of current element into foundFeatureInfoFormats array (array needed for fallback if no 'application/json' format found)
                      foundFeatureInfoFormats.push($(element).attr('format') || '');
                      // checking for 'application/json' format
                      if ($(element).attr('format') === 'application/json'){
                        // set format (upper scope variable)
                        featInfoFormat = 'application/json';
                        // raw FeatureInfo URL template (no need for stripping, parameters replacement will happen in GetFeatureInfo request)
                        rawTemplateFeatureInfo = $(element).attr('template') || '';
                        // final GetFeatureInfo URL
                        getFeatureInfoUrl = rawTemplateFeatureInfo;
                        // flag to signal if this case has been entered (if both this and the other one have been entered we'll break the loop; check for this at the end of each iteration)
                        featureInfoTapped = true;
                        if(getFeatureInfoUrl === ''){
                          console.warn('No URL template for GetFeatureInfo');
                        }
                      }
                      // fallback: if last iteration and no 'application/json' format found, search for found formats and select one of the preferred formats if present, otherwise use first available
                      if(index === layerEl.find('ResourceURL').length - 1 && !featureInfoTapped){
                        const textPlainFormat = foundFeatureInfoFormats.find((format) => { return format === 'text/plain'; });
                        const applicationGeoJsonFormat = foundFeatureInfoFormats.find((format) => { return format === 'application/geojson'; });
                        const textHtmlFormat = foundFeatureInfoFormats.find((format) => { return format === 'text/html'; });
                        if(textPlainFormat !== undefined){
                          // assign format to upper scope variable (later used to assign the class member variable holding 'format'!)
                          featInfoFormat = textPlainFormat;
                          featureInfoTapped = true;
                        }
                        else if(applicationGeoJsonFormat !== undefined){
                          // assign format to upper scope variable
                          featInfoFormat = applicationGeoJsonFormat;
                          featureInfoTapped = true;
                        }
                        else if(textHtmlFormat !== undefined){
                          // assign format to upper scope variable
                          featInfoFormat = textHtmlFormat;
                          featureInfoTapped = true;
                        }
                        else{
                          // assign format to upper scope variable
                          featInfoFormat = foundFeatureInfoFormats[0];
                          featureInfoTapped = true;
                        }
                      }
                      break;
                    default:
                      // if resourceType is not TileJSON or FeatureInfo, skip the element
                      break;

                  }
                  if(tileJSONTapped && featureInfoTapped){
                    // if both TileJSON and FeatureInfo have been tapped, break the loop
                    return false; // break .each() loop
                  }
                });
                // if TileJSON template URL found, make the request (only loading first found layer)
                if(getTileJSONUrl != null && getTileJSONUrl.length > 0){
                  // make request for TileJSON
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const getTileJSON = http
                  .get(getTileJSONUrl)
                  .toPromise()
                  .catch((error) => {
                    console.error('Error fetching TileJSON:', error);
                    return null;
                  })
                  .then((res: TileJSON) => {
                    // extract the GetTile with Z,Y,X from the TileJSON response (assuming 'tiles' array will always contain just one element, i'm requesting a specific layer)
                    const zyxGetTile = res.tiles[0];
                    if (zyxGetTile != null && zyxGetTile.length > 0) {
                      // finally assigning the GetTile URL string to getTileUrl
                      getTileUrl = zyxGetTile;
                      // finally CREATING the layer, passing it the GetTile URL
                      resolve(L.tileLayer(getTileUrl, optionsCopy));
                    }
                    else{
                      console.error('No valid Z,Y,X GetTile URL found in TileJSON response. zyxGetTile is either null or an empty string');
                      return resolve(null);
                    }
                  });

                }
                else{
                  console.error('No valid TileJSON URL found in GetCapabilities XML.');
                  return resolve(null);
                }

              return false; // break loop
            });

            // set the base URL to be used by the GetFeatureInfo request (if no found url it will be null or an empty string)
            this.getFeatureInfoBaseURL = getFeatureInfoUrl;
            // set style extracted (used by the GetFeatureInfo request)
            this.styleFromXML = style;
            // set the GetFeatureInfo format
            this.getFeatureInfoFormat = featInfoFormat;
            // set the bounds of the layer
            this.boundsFromXML = bounds;
          }
          else{
            console.error('GetCapabilities XML is null. Cannot retrieve GetTile URL.');
            return resolve(null);
          }
        })
        .catch((e)=>{
          console.error('Failed to retrieve GetCapabilities');
        });

      } catch (e) {
        console.error('Layer not found', e);
        return resolve(null);
      }
    });
  }

  public setFeatureIdentifiable(itemGenerator?: FeatureDisplayItemGenerator): this {
    this.setLayerClickFeatureItemGenerator(itemGenerator ? itemGenerator : new WmtsFeatureDisplayItemGenerator(this));
    return this;
  }

  // TODO: these static funcs could do with being re-written in a class of their own
  // Used for getting layer/style elements from xml and tries without workspace in name too
  public getElementWithName(
    $srcXml: JQuery<JQuery.Node>,
    name: string,
    parentElementType: string,
  ): null | JQuery<Element> {
    name = name.trim();
    let $returnElement: null | JQuery<Element> = null;
    if (name.length > 0) {
      let $nameElement: JQuery<Element> = $srcXml.find(`${parentElementType}>Name:contains("${name}")`).first();
      // if not found try without workspace (part before ":" in "europe:SHEEC_1000_1899")
      if ($nameElement.length === 0) {
        // get part after colon
        const newName = name.split(':').pop();
        if (name !== newName) {
          $nameElement = $srcXml.find(`${parentElementType}>Name:contains("${newName}")`).first();
        }
      }
      $returnElement = $nameElement.length > 0 ? $nameElement.parent() : null;
    }
    return $returnElement;
  }

  /**
   * @returns promise of jQuery object of xml response
   */
  public refreshGetCapabilitiesXml(
    http: HttpClient,
    additionalParams = new Map<string, string>(),
  ): Promise<JQuery<XMLDocument>> {
    // set defaults
    const params = new Map<string, string>([
      ['SERVICE', 'WMTS'],
      ['REQUEST', 'GetCapabilities'],
    ]);
    // set any additional values (allows overriding)
    additionalParams.forEach((value: string, key: string) => {
      params.set(key, value);
    });

    const url =
      this.url +
      '?' +
      Array.from(params.keys())
        .filter((key) => null != params.get(key))
        .map((key) => `${key}=${params.get(key)}`)
        .join('&');

    this.getCapabilitiesPromise = http
      .get(url, { responseType: 'text' })
      .toPromise()
      .catch((error) => {
        throw error;
        // this.userNotificationService.sendErrorNotification('STOP', 2000);
      })
      .then((res: string) => {
        const xml = $.parseXML(res);
        this.getCapabilitiesXML = jQuery(xml);
        return this.getCapabilitiesXML;
      })
      .finally(() => {
        this.getCapabilitiesPromise = null;
      });
    return this.getCapabilitiesPromise;
  }

  public getCapabilitiesXml(http: HttpClient): Promise<JQuery<XMLDocument>> {
    switch (true) {
      case null != this.getCapabilitiesXML:
        return Promise.resolve(this.getCapabilitiesXML);
      case null != this.getCapabilitiesPromise:
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        return this.getCapabilitiesPromise!;
      default:
        return this.refreshGetCapabilitiesXml(http);
    }
  }

  public getLayerBboxFromGetCapabilitiesXml(layer: WmtsTileLayer, http: HttpClient, dataSearchConfigurablesServiceResource: DataSearchConfigurablesServiceResource, dataSearchConfigurablesServiceRegistry: DataSearchConfigurablesServiceRegistry){
    // YES, both the 'if' and the 'else' conditions are executing the same code! HOWEVER, for now, keeping the 2 conditions to distinguish between: table-triggered layer creation ('if' condition) and first/default-triggered creation ('else' conditioon).
    if(this.options.get('customURLTemplate') != null && this.options.get('customURLTemplate') !== ''){
      if(this.boundsFromXML != null && this.boundsFromXML.length > 0){
        // as a reminder: coordinates order at this point: South, West, North, East (the one Leaflet expects)
        const coordinatesArrToNumbersArr: Array<number> = this.boundsFromXML.map((coord: string) => Number(coord));
        void dataSearchConfigurablesServiceResource.updateLayerBbox(this.id, coordinatesArrToNumbersArr);
        return this.boundsFromXML;
      }
      else{
        return [];
      }
    }
    else{
      return Promise.resolve(
        this.getCapabilitiesXml(http)
        .then(($xml: JQuery<XMLDocument>)=>{
          const capabilities = $xml;
          const totalBoundsMap = new Map<string, Array<number>>();
          const totNumberOfLayers = capabilities.find('Layer').length;
          capabilities.find('Layer').each(function() {
            const layerEl = $(this);
            const identifier = layerEl.find('ows\\:Identifier, Identifier').first().text();
            // BOUNDS
            const bboxEl = layerEl.find('*').filter(function() {
              return this.localName.toLowerCase().includes('boundingbox');
            }).first();
            // defined as lon_min, lat_min in GetCapabilities XML
            const lowerBounds = bboxEl.find('ows\\:LowerCorner, LowerCorner').text().split(' ');
            // defined as lon_max, lat_max in GetCapabilities XML
            const upperBounds = bboxEl.find('ows\\:UpperCorner, UpperCorner').text().split(' ');

            // reordering bounds in this variable as expected from leaflet (eg.: bounds = [ [lat_min, lon_min], [lat_max, lon_max] ])
            const lowerBoundsInLeafletOrder =  [lowerBounds[1], lowerBounds[0]];
            const upperBoundsInLeafletOrder =  [upperBounds[1], upperBounds[0]];
            // final reordered South, West, North, East
            const boundsInLeafletOrder = [Number(lowerBoundsInLeafletOrder[0]), Number(lowerBoundsInLeafletOrder[1]), Number(upperBoundsInLeafletOrder[0]), Number(upperBoundsInLeafletOrder[1])];
            // finally assigning the bounds (/resources)
            totalBoundsMap.set(identifier, boundsInLeafletOrder);
            // finally assigning the bounds (/registry)
            /* void dataSearchConfigurablesServiceRegistry.updateLayerBbox(this.id, boundsInLeafletOrder); */
          });
          // if number of totbounds found equals number of layers, then update the bbox of the current layer
          if(totalBoundsMap.size === totNumberOfLayers){
            const totalBounds = this.getTotalBounds(totalBoundsMap);
            console.warn('S, W, N, E :', totalBounds);
            void dataSearchConfigurablesServiceResource.updateLayerBbox(this.id, totalBounds!);
          }
        })
      );
    }
  }

  public getTotalBounds(boundsMap: Map<string, Array<number>>): Array<number> | null {
    if (boundsMap.size === 0) {
      return null;
    }
    let south = Infinity;
    let west = Infinity;
    let north = -Infinity;
    let east = -Infinity;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_, [s, w, n, e]] of boundsMap) {
      if (s < south){
        south = s;
      }
      if (w < west){
        west = w;
      }
      if (n > north){
        north = n;
      }
      if (e > east){
        east = e;
      }
    }
    return [south, west, north, east];
  }

  public getLayerInfoForTableVisualization(layer: WmtsTileLayer, http: HttpClient, mapInteractionService: MapInteractionService, configurables: DataSearchConfigurablesServiceResource){
    // if layer creation was triggered from Table View, no point in continuing: everything that needed to be set was set during first layer creation!
    if(this.options.get('customURLTemplate') != null && this.options.get('customURLTemplate') !== ''){
      return ;
    }

    // already set bounds (if any, e.g.: i've just set the spatial filter and the creation of the layer has just been retriggered, at this point i will have them available)
    let alreadySetBounds: Array<number> | null = null;
    // checking if boundingBox filter set (i will filter data table according to the set boundingBox)
    const ls = new LocalStoragePersister();
    const lsDataSearchBounds = ls.getValue(LocalStorageVariables.LS_DATA_SEARCH_BOUNDS) as Array<number> | null;
    // if filter set (will load only those falling in the set bounds)
    if(lsDataSearchBounds != null){
      // these bounds come in order N, E, S, W
      alreadySetBounds = ls.getValue(LocalStorageVariables.LS_DATA_SEARCH_BOUNDS) as Array<number>;
    }

    const layerNames = layer.options.get('layers') != null ? layer.options.get<string>('layers')!.split(',') : [];

    return Promise.resolve(
      this.getCapabilitiesXml(http)
      .then(($xml: JQuery<XMLDocument>)=>{

        const layersMAP: Map<string, WMTSLayerTableData> = new Map<string, WMTSLayerTableData>();

        const layerTag = $xml.find('Layer');

        layerTag.each((index, element)=>{

          let isDefaultLayer: boolean | null = null;
          let layerID: string = '';

          // create a new ID: this will be used as ID if the layer is not the default one, otherwise the 'this.id' (the id of the distribution) will be used
            const newID = crypto.randomUUID();

            const title = $(element).find('ows\\:Title, Title').text();
            // Hey ! You're retrieving "Identifier" property  because that's what's used as {layer} param in WMTS requests!
            const layerIdentifier = $(element).find('> ows\\:Identifier, Identifier').text();

            const tileMatrixSet = $(element)
            .find('ows\\:TileMatrixSetLink, TileMatrixSetLink')
            .find('ows\\:TileMatrixSet, TileMatrixSet')
            .filter(function(){
              return $(this).text()  === layer.options.get(WMTSParameter.TILEMATRIXSET);
            }).text();

            // bounds
            // find first element containing BoundingBox (case insensitive)
            const bboxEl = $(element).find('*').filter(function() {
              return this.localName.toLowerCase().includes('boundingbox');
            }).first();
            // defined as lon_min, lat_min in GetCapabilities XML
            const lowerBounds = bboxEl.find('ows\\:LowerCorner, LowerCorner').text().split(' ');
            // defined as lon_max, lat_max in GetCapabilities XML
            const upperBounds = bboxEl.find('ows\\:UpperCorner, UpperCorner').text().split(' ');

            // reordering bounds in this variable as expected from leaflet (eg.: bounds = [ [lat_min, lon_min], [lat_max, lon_max] ])
            const lowerBoundsInLeafletOrder =  [lowerBounds[1], lowerBounds[0]];
            const upperBoundsInLeafletOrder =  [upperBounds[1], upperBounds[0]];
            // final reordered South, West, North, East
            const boundsInLeafletOrder = [lowerBoundsInLeafletOrder[0], lowerBoundsInLeafletOrder[1], upperBoundsInLeafletOrder[0], upperBoundsInLeafletOrder[1]];

            // if spatial filter set, filter out layers not intersecting with the set bounds
            if(alreadySetBounds != null && alreadySetBounds.length === 4){
              const mainBounds = new L.LatLngBounds(
                L.latLng(alreadySetBounds[2], alreadySetBounds[3]),
                L.latLng(alreadySetBounds[0], alreadySetBounds[1])
              );
              const layerSpecificBounds = new L.LatLngBounds(
                L.latLng(Number(boundsInLeafletOrder[0]), Number(boundsInLeafletOrder[1])),
                L.latLng(Number(boundsInLeafletOrder[2]), Number(boundsInLeafletOrder[3]))
              );
              // check if bounds of the current layer intersect with the spatial filter bounds -> if not so skip layer and go to next iteration/layer
              if(!mainBounds.intersects(layerSpecificBounds)){
                // set setWmtsLayersMapStorage to 'null' so that table know no data were found
                if(index === layerTag.length -1){
                  mapInteractionService.setWmtsLayersMapStorage(null);
                }
                return; // go to next iteration
              }
            }

            // Layer ID (the one that is used in map.component to create/remove the layer). So: if it's default layer use the 'configID' as ID, otherwise use the 'newID'.
            // checking on defaultPlaceHolderID just to establish this is the first iteration passing the alreadySetBounds check, so this first one will have 'this.id'
            if(this.defaultLayerPlaceholderID === 'placeholderID'){
              // clean up variable
              this.defaultLayerPlaceholderID = null;
              isDefaultLayer = true;
              layerID = this.id;
            }
            else{
              isDefaultLayer = false;
              layerID = newID;
            }

            // Abstract
            const abstract = $(element).find('ows\\:Abstract, Abstract').text() || '';

            // MetadataURL (the tag containing the link to metadata XML, e.g.: it might contain the '.zip' of the Data Product)
            const metadataUrl = $(element).find('ows\\:MetadataURL, MetadataURL').find('ows\\:OnlineResource, OnlineResource').attr('xlink:href') || '';


            // Style & LegendURL
            let layerStyle = '';
            let legendsURL = '';
            const defaultStyle = $(element).find('Style[isDefault="true"]').first();
            if (defaultStyle.length > 0) {
              const styleIdentifier = defaultStyle.find('ows\\:Identifier, Identifier').first().text();
              // assign styleIdentifier to style (it's used to replace the {style} parameter in the TileJSON URL retrieved a few lines below)
              const legendUrlLink = defaultStyle.find('> LegendURL').first().attr('xlink:href') || '';
              layerStyle = styleIdentifier;
              legendsURL = legendUrlLink;
            } else {
              // if no defaultStyle found, assigning first available style identifier
              console.warn('No Default Style Found. Applying first available style found');
              layerStyle = $(element).find('Style > ows\\:Identifier, Style > Identifier').first().text();
              legendsURL = $(element).find('Style > ows\\:LegendURL, Style > LegendURL').first().attr('xlink:href') || '';
            }
            // FeatureInfo URL Template
            const featureInfoTemplate =
            $(element).find('ResourceURL[resourceType="FeatureInfo"][format="application/json"]').attr('template') ||
            $(element).find('ResourceURL[resourceType="FeatureInfo"][format="text/plain"]').attr('template') ||
            $(element).find('ResourceURL[resourceType="FeatureInfo"][format="application/geo+json"]').attr('template') ||
            $(element).find('ResourceURL[resourceType="FeatureInfo"][format="text/html"]').attr('template') ||
            $(element).find('ResourceURL[resourceType="FeatureInfo"]').attr('template') ||
            '';

            // TileJSON URL Template
            const tileJSONTemplate = $(element).find('ResourceURL[resourceType="TileJSON"]').attr('template') || '';

            const WMTSLayerTableDataOBJ = {
              originatorConfig: layer.id, // uhmmm
              layerID: layerID,
              title: title,
              abstract: abstract,
              metadataUrl: metadataUrl,
              layerIdentifier: layerIdentifier,
              tileMatrixSet: tileMatrixSet,
              coordinates: boundsInLeafletOrder,
              tileJSONTemplate: tileJSONTemplate,
              featureInfoTemplate: featureInfoTemplate,
              style: layerStyle,
              legendsURL: legendsURL,
              tableRowPropertyId: layerID + '#' + index + '#',
              isDefaultLayer: isDefaultLayer,
            };

            // the 'legendsURL' class member gets assigned here. This is used both by default layer and by "customURL" layer (the logic is established in the createLegendsDefault() method)
            this.legendsURL = legendsURL.trim();

            layersMAP.set(layerID, WMTSLayerTableDataOBJ);

            // set the legend Map structure to be used in Legends creation
            const layerLegendOpt: LayerLegend = {
              href: this.legendsURL,
              legendLabel: layerIdentifier,
              tableRowPropertyId: layerID + '#' + index + '#',
            };
            this.legendsMap.set(layerID, layerLegendOpt);
        });

        if (layersMAP.size > 0) {
          // set the layersMapStructure in the mapInteractionService
          mapInteractionService.setWmtsLayersMapStorage(layersMAP);
        }

        layerNames.forEach((layerName: string)=>{
          const $layerElement = this.getElementWithName($xml, layerName, 'Layer');

          return $layerElement;
        });
      })
      .catch(()=>{
        console.error('Failed retrieving GetCapabilities');
      })
    );

  }

  public createLegendsDefault(layer: WmtsTileLayer, http: HttpClient): Promise<null | Array<Legend>> {
    // YES, both the 'if' and the 'else' conditions are executing the same code! HOWEVER, for now, keeping the 2 conditions to distinguish between: table-triggered layer creation ('if' condition) and first/default-triggered creation ('else' conditioon).
    if(this.options.get('customURLTemplate') != null && this.options.get('customURLTemplate') !== ''){
      return new Promise((resolve)=>{
        /* const newLegend = new Legend(layer.id, layer.name).setDisplayFunction(() => {
          const img = document.createElement('img');
          img.setAttribute('src', this.legendsURL);
          return img;
        }); */
        resolve([]);
      });
    }
    // Default layer
    else{
      return new Promise((resolve)=>{
        const arrayLegends: Legend[] = [];
        const arrayImageLegendItems: ImageLegendItem[] = [];
        if(this.legendsMap){
          const newLegend = new Legend(layer.id,layer.name);
          arrayLegends.push(newLegend);

          this.legendsMap.forEach((v, k)=>{

            // assigning the legendItems (which is: the 'sub-legends') to the 'Parent' legend
            const wrapper = document.createElement('span');

            const img = document.createElement('img');
            img.setAttribute('src', v.href);
            wrapper.appendChild(img);
            const newImageLegendItem = new ImageLegendItem(v.legendLabel, v.href, v.tableRowPropertyId);
            newImageLegendItem.setCssClasses('legend-display-stacked');
            arrayImageLegendItems.push(newImageLegendItem);
          });
          arrayLegends[0].setLegendItems(arrayImageLegendItems);
        }
        resolve(arrayLegends);
      });
    }

  }


  public checkSingleCrsCompatibility(
    http: HttpClient,
    crs: string,
    layerName?: string
  ): Promise<Array<{ layerName: string; crs: string; status: boolean }>> {
    return this.getCapabilitiesXml(http).then(($xml: JQuery<XMLDocument>) => {
      const results: Array<{ layerName: string; crs: string; status: boolean }> = [];

      // Normalize CRS for case-insensitive comparison
      const targetCrs = (crs || '').toUpperCase();

      // Root layer (<Capability><Layer>)
      const rootLayer = $xml.find('Capability > Layer').first();
      const rootCrsList = rootLayer
        .find('CRS, SRS')
        .map((_, el) => ($(el).text() || '').toUpperCase())
        .get();

      // --- Determine which layers to check ---
      // 1) if provided as a function argument
      // 2) if present in options (WMS "layers" param, may contain multiple values)
      // 3) fallback: take all layer names from GetCapabilities
      const fromOptions = this.options.get('layers');
      const optionNames =
        typeof fromOptions === 'string'
          ? fromOptions
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
          : [];

      const xmlNamesFallback = Array.from(
        new Set(
          $xml
            .find('Layer > Name')
            .map((_, el) => ($(el).text() || '').trim())
            .get()
            .filter(Boolean)
        )
      );

      const targetLayerNames = layerName
        ? [layerName]
        : optionNames.length > 0
          ? optionNames
          : xmlNamesFallback;

      // --- Check CRS for each target layer ---
      targetLayerNames.forEach(name => {
        let status = false;

        // Find the <Layer> element with that <Name>
        const $layerElement = this.getElementWithName($xml, name, 'Layer');

        if ($layerElement && $layerElement.length > 0) {
          const crsElements = $layerElement
            .find('CRS, SRS')
            .map((_, el) => ($(el).text() || '').toUpperCase())
            .get();

          // OK if declared on the layer or inherited from the root layer
          status = crsElements.includes(targetCrs) || rootCrsList.includes(targetCrs);
        } else {
          // If not found in the document, still try inheritance from the root layer
          status = rootCrsList.includes(targetCrs);
        }

        results.push({ layerName: name, crs: targetCrs, status });
      });

      return results;
    });
  }
}
