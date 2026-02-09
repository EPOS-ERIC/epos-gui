import { AuthenticatedClickService } from 'services/authenticatedClick.service';
import { ExecutionService } from 'services/execution.service';
import { AuthenticatedLink } from './authenticatedLink';
import { ObjectHelper } from './objectHelper';
import { PopupProperty, PopupPropertyType } from './popupProperty';

export class JsonHelper {

  public static readonly NO_DATA = '--';
  public static readonly ATTR_PREFIX = '@epos';
  public static readonly EXTERNAL_LINK_ATTR = this.ATTR_PREFIX + '_links';
  public static readonly MAP_KEYS_ATTR = this.ATTR_PREFIX + '_map_keys';
  public static readonly DATA_KEY_ATTR = this.ATTR_PREFIX + '_data_keys';
  public static readonly STYLE_ATTR = this.ATTR_PREFIX + '_style';
  public static readonly STYLE_ID_ATTR = this.ATTR_PREFIX + '_style_lookup_id';
  public static readonly TYPE_ATTR = this.ATTR_PREFIX + '_type';
  public static readonly LABEL_ATTR = this.ATTR_PREFIX + '_label_key';

  /**
   * If the object has a property named this.LABEL_ATTR, use that property's value as the key to get
   * the label.  If not, try 'name', 'title', and 'label' in that order.  If none of those work, return
   * the defaultLabel
   * @param properties - The object that contains the label.
   * @param [defaultLabel] - The label to use if no label is found in the properties.
   * @returns The label of the object.
   */
  public static getLabelFromProperties(properties: Record<string, unknown>, defaultLabel = ''): string {

    let label: null | string = null;

    // Try to get the this.LABEL_ATTR
    const labelKey = ObjectHelper.getObjectValue<string>(properties, this.LABEL_ATTR, false);
    if (ObjectHelper.isValidString(labelKey, true)) {
      const temp = ObjectHelper.getObjectValue<string>(properties, labelKey!, false);
      if (ObjectHelper.isValidString(temp, true)) {
        label = temp!.trim();
      }
    }

    // If the this.LABEL_ATTR doesn't result in a good label, try:  name, title, label
    if (!ObjectHelper.isValidString(label, true)) {

      const tryTheseProperties: Array<string> = ['name', 'title', 'label'];

      // Loop through all object keys and compare them to the 'tryProperty'
      tryTheseProperties.every((tryProperty: string) => {
        const tryPropLower = tryProperty.toLowerCase();
        const objKey = Object.keys(properties).find((key: string) => (key.toLowerCase() === tryPropLower));
        if (null != objKey) {
          const temp = ObjectHelper.getObjectValue<string>(properties, objKey, false);

          // If label is good, that's what will be used
          if (ObjectHelper.isValidString(temp, true)) {
            label = temp!.trim();
          }
        }
        return (null == label); // loop till it is set
      });
    }

    return label ?? defaultLabel;
  }

  public static createExternalLinksAsHTMLProperties(links: Array<Record<string, unknown>>, onlyUrl = false, downloadsDialog = false): Array<PopupProperty> {
    const linkPropertiesToUse: Array<PopupProperty> = [];

    // "href": "https://www.etc.etc",
    // "label": "Download",
    // "type": "application/pdf"

    links.forEach((link: Record<string, unknown>) => {
      const href = ObjectHelper.getObjectValue<string>(link, 'href');
      const label = ObjectHelper.getObjectValue<string>(link, 'label');
      const group = ObjectHelper.getObjectValue<string>(link, 'group');
      const type = ObjectHelper.getObjectValue<string>(link, 'type');

      // optional
      const authenticatedDownload = (true === ObjectHelper.getObjectValue(link, 'authenticatedDownload'));

      if (ObjectHelper.isValidString(href) && ObjectHelper.isValidString(label)) {

        if (authenticatedDownload) {
          linkPropertiesToUse.push(
            new PopupProperty(group === null? 'Download' : group!, [href!.trim()], PopupPropertyType.AUTHENTICATED_DOWNLOAD, label!)
          );
        } else { // normal link (could be a non-authenticated download, might just be a link)
          linkPropertiesToUse.push(new PopupProperty(group === null || downloadsDialog ? label! : group!, [onlyUrl ? href! : this.makeLink(href!, label!)]).setFormatType(type ?? ''));
        }
      }
    });
    return linkPropertiesToUse;
  }

  public static makeLink(href: string, label: string) {
    return `<a target="_blank" href="${href.trim()}">${label.trim()}</a>`;
  }

  public static identifyLinksWithinPrimitives(primitives: Array<string | number | boolean>): Array<number | boolean | string> {
    return primitives.map(p => {
      if (typeof p === 'string' && p.trim().toLowerCase().startsWith('http')) {
        const html = JsonHelper.makeLink(p, p);
        return html;
      } else {
        return p;
      }
    });
  }

  public static toTitleAndHref(name: string, value: Record<string, unknown>): null | PopupProperty {
    const title = ObjectHelper.getObjectValue<string>(value, '@title', false);
    const href = ObjectHelper.getObjectValue<string>(value, '@href', false);

    if (ObjectHelper.isValidString(title) && ObjectHelper.isValidString(href)) {
      const html = JsonHelper.makeLink(href!, title!);
      const prop = new PopupProperty(name, [html]);

      return prop;
    }

    return null;
  }

  public static popupClick(ev: MouseEvent,
    executionService: ExecutionService,
    authenticatedClickService: AuthenticatedClickService,
    property?: PopupProperty
  ): void {
    // respond to popup click events
    const target = ev.target as HTMLElement;
    if (null != target) {

      const link = (null != property)
        ? String(property.values[0]).valueOf()
        : AuthenticatedLink.getUrlFromElement(target);

      const filename = (null != property)
        ? property.authenticatedDownloadFileName
        : AuthenticatedLink.getFilenameFromElement(target);

      // Authenticated download
      if (((null != property) && (PopupPropertyType.AUTHENTICATED_DOWNLOAD === property.type))
        || (AuthenticatedLink.isAuthenticatedLink(target))) {
        if (authenticatedClickService.authenticatedClick()) {

          // open link
          if (null != link) {
            void executionService.doAuthenticatedDownload(link, filename);
          }
        }
      } else if ((null != property) && (PopupPropertyType.SIMPLE === property.type)) {
        if (null != link) {
          void executionService.doDownload(link, filename);
        }
      }
    }
  }

  /**
 * It takes a GeoJSON feature's properties object and returns a string of HTML that can be used to
 * populate a popup
 * @param propertiesObj - The properties object from the GeoJSON feature.
 * @param [layerName] - The name of the layer.
 * @returns A string of HTML
 */
  public static getPopupContentFromProperties(propertiesObj: Record<string, unknown>, layerName = ''): string {
    const propertiesToUse = this.getPropertiesToUse(propertiesObj, this.MAP_KEYS_ATTR);
    return this.createDetailsTableHtml(layerName, propertiesToUse);
  }

  public static createDetailsTableHtml(headline: string, propertiesKeyToUse: Array<PopupProperty>, linkName = 'View on Table', linkClass = 'showOnTable'): string {
    let response = '';
    if (ObjectHelper.isValidString(headline)) {
      response += '<h5 class="popup-title"';

      // find property identify
      const propertyId = propertiesKeyToUse.find((p: PopupProperty) => {
        return p.isIdentify === true;
      });
      if (propertyId !== undefined && propertyId?.values.length === 1) {
        response += ' data-id="' + propertyId?.values[0].toString() + '"';
      }

      response += `>${headline}</h5>`;
    }

    response += '<div class="' + linkClass + '"><i class="fas fa-table" aria-hidden="true"></i> ' + linkName + '</div>';

    response += '<table class="layer-popup-table">';
    propertiesKeyToUse.forEach((property: PopupProperty) => {
      response += '<tr';

      if (property.name === PopupProperty.PROPERTY_ID) {
        response += ' class="hidden"';
      }

      response += '>';

      if (property.type === PopupPropertyType.IMAGE) {
        response += `<th>${property.description}</th>`;
      } else {
        response += `<th>${property.name}</th>`;
      }

      response += this.popupPropertyValueToTableCell(property);
      response += '</tr>';
    });
    response += '</table>';
    return response;
  }

  /**
 * Extracts data from an object based on a one of the pobject parameters defining the keys to use.
 *
 * EXAMPLE NEEDED
 *
 * @param propertiesObj source object to extract data from
 * @param keysObjectId the key of the parameter that defines what to extract.
 */
  public static getPropertiesToUse(propertiesObj: Record<string, unknown>, keysObjectId: string): Array<PopupProperty> {
    const mapKeys = ObjectHelper.getObjectArray<string>(propertiesObj, keysObjectId, false);

    // if mapKeys defined add PROPERTY_ID key
    if (propertiesObj[PopupProperty.PROPERTY_ID] !== undefined && mapKeys.length > 0 && !mapKeys.includes(PopupProperty.PROPERTY_ID)) {
      mapKeys.push(PopupProperty.PROPERTY_ID);
    }

    // add eventually IMAGES key if there's an image in external link
    const listImages: Array<PopupProperty> = [];
    if (propertiesObj[this.EXTERNAL_LINK_ATTR] !== undefined) {
      const listImagesTmp = this.createExternalLinksAsHTMLProperties(propertiesObj[this.EXTERNAL_LINK_ATTR] as Array<Record<string, unknown>>, true);

      listImagesTmp.forEach((imageTmp: PopupProperty) => {
        if (imageTmp.formatType === 'image/jpeg') {
          imageTmp.setType(PopupPropertyType.IMAGE)
            .setDescription(imageTmp.name);

          imageTmp.name = PopupProperty.IMAGES;
          listImages.push(imageTmp);

          if (mapKeys.length > 0 && !mapKeys.includes(PopupProperty.IMAGES)) {
            mapKeys.unshift(PopupProperty.IMAGES);
          }
        }
      });
    }

    const propertiesToUse: Array<PopupProperty> = [];

    if (ObjectHelper.isValidArray(mapKeys)) {
      // There are specific property keys to use for the map popup
      mapKeys.forEach(key => {
        if (ObjectHelper.isValidString(key)) {
          const value = ObjectHelper.getObjectValue(propertiesObj, key, false);

          if (null == value) {

            // if there are images
            if (key === PopupProperty.IMAGES && listImages.length > 0) {
              propertiesToUse.push(...listImages);
            }

          } else if (key.startsWith(this.EXTERNAL_LINK_ATTR)) { // Special case for links
            const linkProperties = this.createExternalLinksAsHTMLProperties(value as Array<Record<string, unknown>>);
            propertiesToUse.push(...linkProperties);
          } else { // Normal case
            const primitives: Array<number | boolean | string> = ObjectHelper.toPrimitiveArray(value);
            const primitivesWithLinksIdentified = this.identifyLinksWithinPrimitives(primitives);
            const titleAndHref = this.toTitleAndHref(key, value as Record<string, unknown>);

            if (titleAndHref != null) {
              propertiesToUse.push(titleAndHref);
            } else if (primitivesWithLinksIdentified.length > 0) {
              propertiesToUse.push(new PopupProperty(key, primitivesWithLinksIdentified));
            }
          }
        }
      });

    }

    // If no suitable keys or values found use all property keys & values, except those starting with this.ATTR_PREFIX, for the map popup
    if (propertiesToUse.length === 0) {

      Object.keys(propertiesObj)
        .filter((key: string) => (!key.toLowerCase().startsWith(this.ATTR_PREFIX))) // Filter out this.ATTR_PREFIX
        .forEach((key: string) => {
          const value = ObjectHelper.getObjectValue(propertiesObj, key, false);
          if (value != null) {
            const primitives: Array<number | boolean | string> = ObjectHelper.toPrimitiveArray(value);
            const primitivesWithLinksIdentified = this.identifyLinksWithinPrimitives(primitives);
            const titleAndHref = this.toTitleAndHref(key, value as Record<string, unknown>);

            if (titleAndHref != null) {
              propertiesToUse.push(titleAndHref);
            } else if (primitivesWithLinksIdentified.length > 0) {
              propertiesToUse.push(new PopupProperty(key, primitivesWithLinksIdentified));
            }
          }
        });
    }

    return propertiesToUse;
  }

  public static popupPropertyValueToTableCell(property: PopupProperty): string {
    const valueToHTMLString = (val: unknown): string => {
      switch (property.type) {
        case (PopupPropertyType.AUTHENTICATED_DOWNLOAD):
          return AuthenticatedLink.getElementHTMLFromPopupProperty(property);

        case (PopupPropertyType.IMAGE):
          return '<img class="openGallery" data-caption="' + property.description + '" src="' + property.values[0] + '" style="width: 80%; border: 2px solid grey; cursor: pointer;" title="Open images slideshow"></img>';
        default: return String(val);
      }
    };
    let response = '';
    if (property.isSingleValue) {
      property.values.forEach(val => {
        response += `<td>${valueToHTMLString(val)}</td>`;
      });
    } else {
      let innerTable = '<td><table>';
      property.values.forEach(val => {
        innerTable += `<tr><td>${valueToHTMLString(val)}</td></tr>`;
      });
      innerTable += '</table></td>';
      response += innerTable;
    }
    return response;
  }

}
