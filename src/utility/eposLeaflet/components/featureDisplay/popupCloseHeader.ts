import 'jquery';

/** The `PopupCloseHeader` class adds a close button to a given HTML element and returns the modified
element. */
export class PopupCloseHeader {
  /**
   * The function adds a close button to a given HTML element and returns the modified element.
   * @param {HTMLElement} content - The content parameter is an HTMLElement that represents the content
   * of a popup. It can be any HTML element such as a div, span, or paragraph.
   * @param closeFunc - The `closeFunc` parameter is a function that will be called when the close
   * button is clicked. It is a callback function that you can define and pass to the
   * `addToContentElement` function.
   * @returns The `content` element with a header containing a close button is being returned.
   */
  public static addToContentElement(content: HTMLElement, closeFunc: () => void): HTMLElement {
    const $header = jQuery('<div class="popup-close-header"></div>');
    const $closeButton = jQuery(
      '<a class="leaflet-popup-close-button" href="javascript:void(0)" style="outline: none;">×</a>',
    )[0];
    $closeButton.addEventListener('click', () => closeFunc());

    $header.append($closeButton);

    jQuery(content).prepend($header);
    return content;
  }
}
