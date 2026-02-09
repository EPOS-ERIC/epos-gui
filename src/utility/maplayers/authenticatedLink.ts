import { PopupProperty, PopupPropertyType } from './popupProperty';

/** The AuthenticatedLink class provides methods for checking if a link is authenticated, retrieving the
URL and filename from an element, and generating HTML for an authenticated download link. */
export class AuthenticatedLink {

  /**
   * The function checks if an element has an authenticated link based on its dataset.
   * @param {HTMLElement | EventTarget} element - The `element` parameter can be either an
   * `HTMLElement` or an `EventTarget`.
   * @returns a boolean value.
   */
  public static isAuthenticatedLink(element: HTMLElement | EventTarget): boolean {
    const elementData = (element as HTMLElement).dataset;
    return ('true' === elementData.authenticatedLink);
  }

  /**
   * The function `getUrlFromElement` returns the URL from the `href` attribute of an HTML element if
   * it is an authenticated link, otherwise it returns null.
   * @param {HTMLElement | EventTarget} element - The `element` parameter can be either an
   * `HTMLElement` or an `EventTarget`.
   * @returns either a string representing the URL or null.
   */
  public static getUrlFromElement(element: HTMLElement | EventTarget): null | string {
    const elementData = (element as HTMLElement).dataset;
    return (this.isAuthenticatedLink)
      ? elementData.href ?? null
      : null;
  }

  /**
   * The function `getFilenameFromElement` returns the filename from the dataset of an HTML element if
   * the link is authenticated, otherwise it returns null.
   * @param {HTMLElement | EventTarget} element - The `element` parameter can be either an
   * `HTMLElement` or an `EventTarget`.
   * @returns either a string representing the filename or null.
   */
  public static getFilenameFromElement(element: HTMLElement | EventTarget): null | string {
    const elementData = (element as HTMLElement).dataset;
    return (this.isAuthenticatedLink)
      ? elementData.filename ?? null
      : null;
  }

  /**
   * The function `getElementHTMLFromPopupProperty` returns an HTML string containing links with
   * authenticated download properties based on the given `PopupProperty` object.
   * @param {PopupProperty} prop - The parameter `prop` is of type `PopupProperty`.
   * @returns a string.
   */
  public static getElementHTMLFromPopupProperty(prop: PopupProperty): string {
    return (PopupPropertyType.AUTHENTICATED_DOWNLOAD !== prop.type)
      ? ''
      : prop.values
        .map((val) => {
          const filename = prop.authenticatedDownloadFileName;
          return '<a href="#" onclick="return false;"' // just looks like a link
            + 'data-authenticated-link="true"'
            + `data-href="${String(val)}"`
            + `data-filename="${filename}"`
            + `>${filename}</a>`;
        })
        .join('');
  }

}
