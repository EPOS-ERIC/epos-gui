import { JsonFeatureIdentifier, WmtsFeatureDisplayItemGenerator, WmtsFeatureFormat, WmtsTileLayer } from 'utility/eposLeaflet/eposLeaflet';

/** The `WMTSFeatureIdentifier` class is a TypeScript class that extends `WmsFeatureDisplayItemGenerator`
and is used to identify and display features on a WMTS tile layer. */
export class WMTSFeatureIdentifier extends WmtsFeatureDisplayItemGenerator {

  /**
   * This constructor initializes a WmsFeatureInfoControl object with a WmtsTileLayer and sets up
   * various parameters and format handlers.
   * @param {WmtsTileLayer} layer - The `layer` parameter is of type `WmtsTileLayer`. It is a protected
   * property that is passed to the constructor.
   */
  constructor(
    protected layer: WmtsTileLayer,
  ) {
    super(layer);

    const featureCallParams = new Map<string, string>();

    const mapString = layer.options.get('MAP');
    if (null != mapString) {
      featureCallParams.set('MAP', String(mapString));
    }

    this.setFeatureCallParams(featureCallParams);

    const getParams = () => {
      if (null != this.selectedFormat) {
        this.featureCallParams.set('info_format', this.selectedFormat);
      }
      return this.featureCallParams;
    };

    const jsonFeatureGenerator = new JsonFeatureIdentifier(
      this.layer,
      (thisLayer: WmtsTileLayer, clickEvent) =>
        WmtsFeatureDisplayItemGenerator.createUrl(thisLayer, clickEvent, getParams),
    ).setResultDetailsExtractor(this.featurePropertiesToMap.bind(this) as (featureDetails: Record<string, unknown>) => Map<string, string>);

    this.setFormatHandler(WmtsFeatureFormat.GEO_JSON, jsonFeatureGenerator);
    this.setFormatHandler(WmtsFeatureFormat.JSON, jsonFeatureGenerator);

  }

  /**
   * The function `featurePropertiesToMap` takes a feature object and converts its properties into a
   * map, with special handling for the "covjson_url" property.
   * @param feature - The `feature` parameter is an object that represents a feature in a map layer. It
   * contains properties that describe the feature, such as its name, location, and other attributes.
   * @returns a Map object containing key-value pairs. The keys are strings representing the property
   * names of the input feature object, and the values are strings representing the display values of
   * those properties.
   */
  protected featurePropertiesToMap(feature: Record<string, unknown>): Map<string, string> {
    const layerId = this.layer.id;
    const responsePropertiesObj = feature.properties as Record<string, unknown>;
    const returnMap = new Map<string, string>();

    // response keys array
    const respPropArray = Object.keys(responsePropertiesObj);
    // mapping the keys array with their indices
    const keyIndicesMap = new Map<string, number>();
    // populating the Map structure
    respPropArray.forEach((key: string, index: number) => {
      keyIndicesMap.set(key, index);
    });
    // getting the index of 'cosu' property (from this property on, properties will not be inserted in the popup).
    const cosuIndex = keyIndicesMap.get('cosu') ?? null;

    Object.keys(responsePropertiesObj).forEach((key: string, index: number) => {
      // default item display generator creates a vertical table from key-value pairs
      // and accepts html
      let displayValue = String(responsePropertiesObj[key]).toString().trim();

      // check covjson_url
      if (key === 'covjson_url') {

        // create Plot button
        key = 'Time series';
        displayValue = '<button id="timeseries_button" data-layerid="'
          + layerId +
          '" data-url="'
          + displayValue +
          '">View on graph</button>'
          + '<a href="' + displayValue + '" download target="_blank" rel="noopener noreferrer">'
          + '<button>Download</button></a>';
        returnMap.set(key, displayValue);
      }
      else {

        switch (true) {
          // turn urls into links
          case (displayValue.startsWith('http')):
            displayValue = `<a href="${displayValue}" target="_blank" rel="noopener noreferrer">${displayValue}</a>`;
            break;
        }
        if(cosuIndex && index > cosuIndex){
          // DO NOTHING (Do not add property)
        }
        else{
          // add property to popup
          returnMap.set(key, displayValue);
        }
      }
    });
    return returnMap;
  }
}
