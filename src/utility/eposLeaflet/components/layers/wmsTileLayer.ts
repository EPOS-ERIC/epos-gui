import * as L from 'leaflet';
 import { HttpClient } from '@angular/common/http';
 import { Legend } from '../controls/legendControl/legend';
 import { TileLayer } from './tileLayer';
 import { FeatureDisplayItemGenerator } from '../featureDisplay/featureDisplayItemGenerator';
 import { WmsFeatureDisplayItemGenerator } from './wmsFeatureDisplayItemGenerator';
 import 'jquery';
 import { MapLayer } from './mapLayer.abstract';
 import { DataSearchConfigurablesServiceResource } from 'pages/dataPortal/modules/dataPanel/services/dataSearchConfigurables.service';
 import { DataSearchConfigurablesServiceRegistry } from 'pages/dataPortal/modules/registryPanel/services/dataSearchConfigurables.service';

 /*
 export interface WmsTileLayerOptions {
   layers: string;
   format?: string;
   transparent?: boolean;
   version?: string;
   zIndex?: number;
   opacity?: number;
 }*/

 // options: http://leafletjs.com/reference-1.2.0.html#tilelayer-wms
 export class WmsTileLayer extends TileLayer {
  public crsCheckReady?: Promise<void>;
  public crsCompatibilityResults: Array<{ layerName: string; crs: string; status: boolean }> = [];
  public checkCrsCompatibility?: (crs: string) => Promise<Array<{ layerName: string; crs: string; status: boolean }>>;


   protected getCapabilitiesXML: JQuery<XMLDocument>;
   protected getCapabilitiesPromise: null | Promise<JQuery<XMLDocument>>;


   constructor(id: string, name?: string) {
     super(id, name);
     // Default options
     this.options.setOptions({
       format: 'image/png',
       transparent: true,
       pane: id,
     });

     this.setLegendCreatorFunction(this.createLegendsDefault.bind(this) as (layer: MapLayer, http: HttpClient) => Promise<null | Array<Legend>>);
     // eslint-disable-next-line @typescript-eslint/no-unsafe-call
     this.setLayerBboxRetrieverFunction(this.getLayerBboxFromGetCapabilitiesXml.bind(this) as (layer: MapLayer, http: HttpClient) => Promise<null | Array<number>>);
   }

   public getLeafletLayer(): Promise<null | L.Layer> {
     return new Promise((resolve) => {
       try {
         // use copy
         const options = {
           ...this.options.getAll(),
         };

         // make any option alterations that are required
         const optionsCopy = {};
         Object.keys(options).forEach((key: string) => {
           switch (true) {
             // we don't want bbx being set by anything other than client
             case key.toLowerCase() === 'bbox':
               break;
             // remove extra custom options
             case key.startsWith('customLayerOption'):
               break;
             default:
               optionsCopy[key] = options[key];
               break;
           }
         });
         return resolve(L.tileLayer.wms(this.url, optionsCopy));
       } catch (e) {
         // TODO send user an error?
         console.error('Layer not found');
         return resolve(null);
       }
     });
   }

   public setUrl(url: string): this {
     // strip any query params off
     super.setUrl(url.replace(/\?.*$/, ''));
     return this;
   }

   public setFeatureIdentifiable(itemGenerator?: FeatureDisplayItemGenerator): this {
     this.setLayerClickFeatureItemGenerator(itemGenerator ? itemGenerator : new WmsFeatureDisplayItemGenerator(this));
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
     // defaults to 1.1.1 as leaflet appears to.
     const version: string = this.options.get('version') ?? '1.1.1';

     // set defaults
      const params = new Map<string, string>([
        ['service', 'WMS'],
        ['request', 'GetCapabilities'],
        ['version', version],
      ]);

      const token = this.options.get('token');
      if (token != null && String(token).trim() !== '') {
        params.set('token', String(token));
      }

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

   public getLayerBboxFromGetCapabilitiesXml(layer: WmsTileLayer, http: HttpClient, dataSearchConfigurablesServiceResource: DataSearchConfigurablesServiceResource, dataSearchConfigurablesServiceRegistry: DataSearchConfigurablesServiceRegistry){
     const layerNames = layer.options.get('layers') != null ? layer.options.get<string>('layers')!.split(',') : [];
     return Promise.resolve(
       this.getCapabilitiesXml(http)
       .then(($xml: JQuery<XMLDocument>)=>{
         layerNames.forEach((layerName: string)=>{
           const $layerElement = this.getElementWithName($xml, layerName, 'Layer');

           const westBbox = $layerElement!.find('EX_GeographicBoundingBox > westBoundLongitude').text();
           const eastBbox = $layerElement!.find('EX_GeographicBoundingBox > eastBoundLongitude').text();
           const southBbox = $layerElement!.find('EX_GeographicBoundingBox > southBoundLatitude').text();
           const northBbox = $layerElement!.find('EX_GeographicBoundingBox > northBoundLatitude').text();

           const coordinates: Array<number> = [Number(northBbox), Number(eastBbox), Number(southBbox), Number(westBbox)];

           // eslint-disable-next-line @typescript-eslint/no-unsafe-call
           void dataSearchConfigurablesServiceResource.updateLayerBbox(this.id, coordinates);
           // eslint-disable-next-line @typescript-eslint/no-unsafe-call
           void dataSearchConfigurablesServiceRegistry.updateLayerBbox(this.id, coordinates);

           return $layerElement;
         });
       })
     );

   }

   public createLegendsDefault(layer: WmsTileLayer, http: HttpClient): Promise<null | Array<Legend>> {
     const layerNames = layer.options.get('layers') != null ? layer.options.get<string>('layers')!.split(',') : [];
     const styleNames = layer.options.get('styles') != null ? layer.options.get<string>('styles')!.split(',') : [];

     return Promise.resolve<null | Array<Legend>>(
       this.getCapabilitiesXml(http)
         .then(($xml: JQuery<XMLDocument>) => {
           const legends = new Array<Legend>();

           layerNames.forEach((layerName: string) => {
             const $layerElement = this.getElementWithName($xml, layerName, 'Layer');

             if (null != $layerElement) {
               const $styleElements = new Array<JQuery<Element>>();
               styleNames.forEach((styleName: string) => {
                 const $styleElement = this.getElementWithName($layerElement, styleName, 'Style');
                 if (null != $styleElement) {
                   $styleElements.push($styleElement);
                 }
               });
               // if no matching style elements just get the first one
               if ($styleElements.length === 0) {
                 $styleElements.push($layerElement.find('Style').first());
               }
               $styleElements.forEach(($styleElement) => {
                 const $titleElement = $styleElement.find('Title').first();
                 const $onlineResourceElement = $styleElement.find('OnlineResource').first();

                 if ($onlineResourceElement.length > 0) {
                   let href = $onlineResourceElement.attr('xlink:href') || '';
                   if (href != null && href.trim().length > 0) {

                     // high quality image
                     href = href.concat('&scale=1&legend_options=fontAntiAliasing:true');

                     const name =
                       $titleElement.length === 0
                         ? layer.name
                         : `<span>${layer.name}</span><span class="multilayer-specific-name">${String(
                           $titleElement.html(),
                         )}</span>`;
                     legends.push(
                       new Legend(layer.id, name).setDisplayFunction(() => {
                         const img = document.createElement('img');
                         img.setAttribute('src', href);
                         return img;
                       }),
                     );
                   }
                 }
               });
             }
           });
           return legends;
         })
         .catch((message) => {
           console.log('No WMS legend found', message);
           return null;
         }),
     );
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
