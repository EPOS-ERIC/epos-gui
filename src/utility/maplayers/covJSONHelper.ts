import { JsonHelper } from './jsonHelper';

export class CovJSONHelper extends JsonHelper {

  public static getPopupContentFromProperties(propertiesObj: Record<string, unknown>, layerName = ''): string {
    const propertiesToUse = this.getPropertiesToUse(propertiesObj, this.MAP_KEYS_ATTR);
    return this.createDetailsTableHtml(layerName, propertiesToUse, 'View on Graph', 'showOnGraph');
  }

}
