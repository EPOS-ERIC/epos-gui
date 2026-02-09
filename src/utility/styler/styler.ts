import { Style } from './style';
import { Stylable } from './stylable.interface';
import { CONTEXT_FACILITY } from 'api/api.service.factory';

/** The `Styler` class assigns styles to objects based on a list of available styles and reference
items. */
export class Styler {
  private readonly styles: Array<Style>;

  /**
   * The constructor function initializes an object with an array of styles, assigning default styles if
   * none are provided.
   * @param {null | Array<Style>} [styles=null] - The `styles` parameter is an optional array of `Style`
   * objects. It can be `null` or an array of `Style` objects.
   */
  constructor(
    styles: null | Array<Style> = null,
  ) {
    let styleIdStringPrefix: string;
    if (null == styles) {
      styleIdStringPrefix = 'styler_default_id_';
      this.styles = defaultStyles.slice();
    } else {
      styleIdStringPrefix = 'style_id_';
      this.styles = styles.slice();
    }
    this.styles.forEach((style: Style, index: number) => {
      if (null == style.getId()) {
        style.setId(styleIdStringPrefix + index.toString());
      }
    });

  }

  /**
   * The function assigns a style to a given item, either by selecting a new style from a list of
   * available styles or by replacing the current style with a corresponding style from the list.
   * @param {Stylable} thisItem - The object to which the style will be assigned. It should implement the
   * `Stylable` interface.
   * @param refItems - refItems is an array of Stylable objects that are used as reference items for
   * filtering the available styles.
   */
  public assignStyle(thisItem: Stylable, refItems: Array<Stylable>): void {
    if (null != thisItem) {
      const currentStyle = thisItem.getStyle();
      if (null == currentStyle) {
        // set a new one
        const availableStyles = this.filterUsedStyles(this.styles, refItems);
        const selectedItem = 0;
        thisItem.setStyle(availableStyles[selectedItem]);
      } else {
        // if the style's id is the same as one of this object's styles, replace it
        // this just maintains consistency, especially after local storage caching
        const correspondingStyle = this.styles.find((style: Style) => (currentStyle.getId() === style.getId()));
        if (null != correspondingStyle) {
          thisItem.setStyle(correspondingStyle);
        }
      }
    }
  }

  private filterUsedStyles(availableStyles: Array<Style>, refItems: Array<Stylable>): Array<Style> {
    const filteredStyles = availableStyles.filter((style: Style) => {
      const styleId = style.getId();
      // try to find where this style is already used
      const foundUsedStyleItem = refItems.find((refItem: Stylable) => {
        // return true if it's a match
        const itemStyle = (null == refItem) ? null : refItem.getStyle();
        return ((null != itemStyle) && (itemStyle.getId() === styleId));
      });
      return (null == foundUsedStyleItem);
    });
    if (filteredStyles.length > 0) {
      return filteredStyles;
    } else {
      console.log('Styler: No available styles left!');
      return availableStyles;
    }
  }

}

/** The `defaultStyles` array is a collection of default styles that can be used in the application.
Each style is represented by an instance of the `Style` class, which takes two parameters: the
background color and the text color. */
export const defaultStyles = [
  // new Style('1e90ff', 'ffffff'), // DODGERBLUE, WHITE
  // new Style('9acd32', 'ffffff'), // YELLOWGREEN, WHITE
  new Style('9400d3', 'ffffff'), // DARKVIOLET, WHITE
  new Style('ffa500', 'ffffff'), // ORANGE, WHITE
  new Style('ffff00', '000000'), // YELLOW, BLACK
  new Style('cd5c5c', 'ffffff'), // INDIANRED, WHITE
  // new Style('00ced1', 'ffffff'), // DARKTURQUOISE, WHITE
  new Style('dcdcdc', '000000'), // GAINSBORO, BLACK
  new Style('000080', 'ffffff'), // NAVY, WHITE
  // new Style('008000', 'ffffff'), // GREEN, WHITE
  new Style('dda0dd', 'ffffff'), // PLUM, WHITE
  new Style('d2691e', 'ffffff'), // CHOCOLATE, WHITE
  new Style('ffa07a', 'ffffff'), // LIGHTSALMON, WHITE
  new Style('0000ff', 'ffffff'), // BLUE, WHITE
  // new Style('5f9ea0', 'ffffff'), // CADETBLUE, WHITE
  new Style('ff00ff', 'ffffff'), // MAGENTA, WHITE
  // new Style('808000', 'ffffff'), // OLIVE, WHITE
  new Style('ffebcd', '000000'), // BLANCHEDALMOND, BLACK
  new Style('000000', 'ffffff'), // BLACK, WHITE
  new Style('b22222', 'ffffff'), // FIREBRICK, WHITE
];

export const graphDefaultStyles = [
  new Style('1f77b4', 'ffffff'), // blue, WHITE
  new Style('ff7f0e', 'ffffff'), // orange, WHITE
  new Style('2ca02c', 'ffffff'), // green, WHITE
  new Style('d62728', 'ffffff'), // red, WHITE
  new Style('9400d3', 'ffffff'), // DARKVIOLET, WHITE
  new Style('ffa500', 'ffffff'), // ORANGE, WHITE
  new Style('cd5c5c', 'ffffff'), // INDIANRED, WHITE
  new Style('000080', 'ffffff'), // NAVY, WHITE
  new Style('dda0dd', 'ffffff'), // PLUM, WHITE
  new Style('d2691e', 'ffffff'), // CHOCOLATE, WHITE
  new Style('ffa07a', 'ffffff'), // LIGHTSALMON, WHITE
  new Style('0000ff', 'ffffff'), // BLUE, WHITE
  new Style('ff00ff', 'ffffff'), // MAGENTA, WHITE
  new Style('ffebcd', '000000'), // BLANCHEDALMOND, BLACK
  new Style('000000', 'ffffff'), // BLACK, WHITE
  new Style('b22222', 'ffffff'), // FIREBRICK, WHITE
];

/** The `FaMarkerOption` interface defines the structure of an object that represents a marker icon
option. It has two properties: `id`, which is a string representing the unique identifier of the
marker icon option, and `value`, which is an array of strings representing the classes or values
needed to display the marker icon. This interface is used to define the structure of the
`defaultMarkerIcons` array, which contains a collection of marker icon options. */
export interface FaMarkerOption {

  /** The line `id: string;` is defining a property called `id` in the `FaMarkerOption` interface. The
  `id` property is of type `string`, which means it can hold a string value. This property represents
  the unique identifier of a marker icon option. */
  id: string;

  /** The line `value: Array<string>;` is defining a property called `value` in the `FaMarkerOption`
  interface. The `value` property is of type `Array<string>`, which means it can hold an array of
  string values. This property represents the classes or values needed to display the marker icon. */
  value: Array<string>;

  /** The line `context?: string;` in the `FaMarkerOption` interface is defining an optional property
  called `context`. */
  context?: string;

}

/** The code is defining an array called `defaultMarkerIcons` which contains a collection of marker icon
options. Each marker icon option is represented by an object with two properties: `id` and `value`. */
export const defaultMarkerIcons: Array<FaMarkerOption> = [
  { id: 'far-circle', value: ['far', 'fa-circle'] },
  { id: 'fas-circle', value: ['fas', 'fa-circle'] },
  { id: 'far-star', value: ['far', 'fa-star'] },
  { id: 'fas-star', value: ['fas', 'fa-star'] },
  { id: 'far-square', value: ['far', 'fa-square'] },
  { id: 'fas-square', value: ['fas', 'fa-square'] },
  { id: 'fas-caret-up', value: ['fas', 'fa-caret-up'] },
  { id: 'fas-caret-down', value: ['fas', 'fa-caret-down'] },
  { id: 'fas-map-pin', value: ['fas', 'fa-map-pin'] },
  { id: 'fas-flask', value: ['fas', 'fa-flask'], context: CONTEXT_FACILITY },
  { id: 'fas-computer', value: ['fas', 'fa-computer'], context: CONTEXT_FACILITY },
  { id: 'fas-microscope', value: ['fas', 'fa-microscope'], context: CONTEXT_FACILITY },
  { id: 'fas-car', value: ['fas', 'fa-car'], context: CONTEXT_FACILITY },
  { id: 'fas-maskface', value: ['fas', 'fa-mask-face'], context: CONTEXT_FACILITY },
];
