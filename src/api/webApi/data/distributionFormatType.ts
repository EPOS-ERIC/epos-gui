import Mime from 'mime/Mime';

export class DistributionFormatType {

  // type WEB_SERVICE
  public static readonly APP_GEOJSON = 'application/geo+json';
  public static readonly APP_EPOS_GEOJSON = 'application/epos.geo+json';
  public static readonly APP_EPOS_TABLE_GEOJSON = 'application/epos.table.geo+json';
  public static readonly APP_EPOS_MAP_GEOJSON = 'application/epos.map.geo+json';
  public static readonly APP_OGC_WMS = 'application/vnd.ogc.wms_xml';
  public static readonly APP_OGC_WMTS = 'application/vnd.ogc.wmts_xml';
  public static readonly APP_COV_JSON = 'covjson';
  public static readonly APP_EPOS_COV_JSON = 'application/epos.covjson';
  public static readonly APP_EPOS_GRAPH_COV_JSON = 'application/epos.graph.covjson';

  // --- SOFTWARE FORMATS ---
  // Added to handle common software extensions
  public static readonly SW_IPYNB = 'IPYNB';
  public static readonly SW_PYTHON = 'PY'; // Extension .py mapped to uppercase
  public static readonly SW_PYTHON_FULL = 'PYTHON';
  public static readonly SW_ZIP = 'ZIP';
  public static readonly SW_DOCKER = 'DOCKERFILE';
  public static readonly SW_MARKDOWN = 'MD';
  public static readonly SW_MATLAB = 'M';
  public static readonly SW_R = 'R';

  // download formats so already data-search downloadable by way of type DOWNLOADABLE_FILE
  // public static readonly ZIP = 'zip';

  private static formats = new Map<string, unknown>();

  private static mappableFormats = [
    DistributionFormatType.APP_GEOJSON,
    DistributionFormatType.APP_EPOS_GEOJSON,
    DistributionFormatType.APP_OGC_WMS,
    DistributionFormatType.APP_OGC_WMTS,
    DistributionFormatType.APP_EPOS_MAP_GEOJSON,
    DistributionFormatType.APP_COV_JSON,
    DistributionFormatType.APP_EPOS_COV_JSON,
    // ...
  ];
  private static graphableFormats = [
    DistributionFormatType.APP_COV_JSON,
    DistributionFormatType.APP_EPOS_GRAPH_COV_JSON,
    DistributionFormatType.APP_EPOS_COV_JSON,
    // ...
  ];

  private static tabularableFormats = [
    DistributionFormatType.APP_EPOS_GEOJSON,
    DistributionFormatType.APP_EPOS_TABLE_GEOJSON,
    DistributionFormatType.APP_OGC_WMTS,
  ];

  private static nonDownloadableFormats: Array<string> = [
    // leaving it empty, keeping this array for potential future use
  ];

  public static isMappable(format: string): boolean {
    return this.in(format, this.mappableFormats);
  }

  public static isGraphable(format: string): boolean {
    return this.in(format, this.graphableFormats);
  }

  public static isDownloadable(format: string): boolean {
    // The current logic is "If it's not in the blacklist, it's downloadable".
    // Since the new software formats (IPYNB, PY, ZIP) are not in nonDownloadableFormats,
    // it will automatically return true.
    return !this.in(format, this.nonDownloadableFormats);
  }

  public static isTabularable(format: string): boolean {
    return this.in(format, this.tabularableFormats);
  }

  public static in(test: string, source: Array<string>): boolean {
    return (source.findIndex((item: string) => this.is(test, item)) > -1);
  }
  public static is(test: string, item: string): boolean {
    test = (test == null) ? '' : test;
    item = (item == null) ? '' : item;
    // starts with item string
    // escape regex special and / chars
    // TODO: review regex as eslint suggests a backslash isn't needed.  This may be correct, or may point to a different failure
    // eslint-disable-next-line no-useless-escape
    const regex = item.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
    return RegExp(`^${regex}`, 'i').test(test);
  }

  public static getEposMime(): Mime {
    const mimeMap = new Map<string, [string]>();
    // add types to file ext mappings here
    mimeMap.set(DistributionFormatType.APP_EPOS_GEOJSON, ['json']);

    // --- MAPPING SOFTWARE ---
    // This is useful if the downloadService needs to reconstruct the extension from the 'Format'
    mimeMap.set(DistributionFormatType.SW_IPYNB, ['ipynb']);
    mimeMap.set(DistributionFormatType.SW_PYTHON, ['py']);
    mimeMap.set(DistributionFormatType.SW_ZIP, ['zip']);
    mimeMap.set(DistributionFormatType.SW_MARKDOWN, ['md']);
    mimeMap.set(DistributionFormatType.SW_MATLAB, ['m']);
    mimeMap.set(DistributionFormatType.SW_R, ['r']);
    mimeMap.set(DistributionFormatType.SW_DOCKER, ['dockerfile']);

    // convert to mime objects
    const mimeObj = {};
    mimeMap.forEach((values, key) => {
      mimeObj[key] = values;
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return new Mime(mimeObj);
  }

}
