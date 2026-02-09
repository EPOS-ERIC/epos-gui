import { Injector } from '@angular/core';
import { FeatureDisplayItem } from './featureDisplayItem';
import 'jquery';
import { UrlToLinkPipe } from 'pipes/urlToLink.pipe';
import { JsonHelper } from 'utility/maplayers/jsonHelper';
import { MapInteractionService } from 'utility/eposLeaflet/services/mapInteraction.service';
import { PopupProperty } from 'utility/maplayers/popupProperty';

export class PaginatedFeatures {

  /** The line `public static readonly CSS_CLASS = 'paginated-features';` is declaring a public static
  readonly property named `CSS_CLASS` with the value `'paginated-features'`. This property is used to
  define the CSS class name for the paginated features component. */
  public static readonly CSS_CLASS = 'paginated-features';

  /** The line `public static readonly WRAPPER_CSS_CLASS = PaginatedFeatures.CSS_CLASS + '-wrapper';` is
  declaring a public static readonly property named `WRAPPER_CSS_CLASS`. This property is used to
  define the CSS class name for the wrapper element of the paginated features component. It is created
  by concatenating the value of `CSS_CLASS` (which is `'paginated-features'`) with the string
  `'-wrapper'`. So the value of `WRAPPER_CSS_CLASS` will be `'paginated-features-wrapper'`. */
  public static readonly WRAPPER_CSS_CLASS = PaginatedFeatures.CSS_CLASS + '-wrapper';

  /** The line `protected currentSlide = 0;` is declaring a protected instance variable named
  `currentSlide` and initializing it with the value `0`. This variable is used to keep track of the
  currently selected slide in the paginated features component. By default, the first slide (index 0)
  is selected. */
  protected currentSlide = 0;

  /** The line `protected slides = new Array<HTMLElement>();` is declaring a protected instance variable
  named `slides` and initializing it with an empty array of type `HTMLElement`. This variable is used
  to store the HTML elements that represent each slide in the paginated features component. */
  protected slides = new Array<HTMLElement>();

  /** The line `protected content: HTMLElement;` is declaring a protected instance variable named
  `content` of type `HTMLElement`. This variable is used to store the HTML element that represents the
  content of the paginated features component. It is initialized as `undefined` and will be assigned a
  value later in the code. */
  protected content: HTMLElement;

  /** The line `protected slideWrapper: HTMLElement;` is declaring a protected instance variable named
  `slideWrapper` of type `HTMLElement`. This variable is used to store the HTML element that
  represents the wrapper for the slides in the paginated features component. It is initialized as
  `undefined` and will be assigned a value later in the code. */
  protected slideWrapper: HTMLElement;

  /** The line `protected navText: HTMLElement;` is declaring a protected instance variable named
  `navText` of type `HTMLElement`. This variable is used to store the HTML element that represents the
  navigation text in the paginated features component. It is initialized as `undefined` and will be
  assigned a value later in the code. */
  protected navText: HTMLElement;

  /** The line `protected prevButts: HTMLElement;` is declaring a protected instance variable named
  `prevButts` of type `HTMLElement`. This variable is used to store the HTML element that represents
  the previous button in the navigation of the paginated features component. It is initialized as
  `undefined` and will be assigned a value later in the code. */
  protected prevButts: HTMLElement;

  /** The line `protected nextButts: HTMLElement;` is declaring a protected instance variable named
  `nextButts` of type `HTMLElement`. This variable is used to store the HTML element that represents
  the next button in the navigation of the paginated features component. It is initialized as
  `undefined` and will be assigned a value later in the code. */
  protected nextButts: HTMLElement;

  /** The line `protected urlToLinkPipe: UrlToLinkPipe;` is declaring a protected instance variable named
  `urlToLinkPipe` of type `UrlToLinkPipe`. This variable is used to store an instance of the
  `UrlToLinkPipe` class, which is a custom pipe used for transforming URLs into clickable links. It is
  injected into the `PaginatedFeatures` class through the constructor using Angular's dependency
  injection mechanism. */
  protected urlToLinkPipe: UrlToLinkPipe;

  /** The above code is declaring a protected variable called "mapInteractionService" of type
  "MapInteractionService". */
  protected mapInteractionService: MapInteractionService;

  /**
   * The constructor initializes the leafletMap, featureItemsPromise, and injector properties, and
   * assigns the UrlToLinkPipe instance obtained from the injector to the urlToLinkPipe property.
   * @param leafletMap - The `leafletMap` parameter is an instance of the Leaflet Map object. It
   * represents the map that will be displayed on the webpage.
   * @param featureItemsPromise - The `featureItemsPromise` parameter is a Promise that resolves to an
   * array of `FeatureDisplayItem` objects.
   * @param {Injector} injector - The `injector` parameter is an instance of the `Injector` class. It
   * is used to dynamically retrieve instances of services or other dependencies from the Angular
   * dependency injection system. In this case, it is used to get an instance of the `UrlToLinkPipe`
   * pipe.
   */
  constructor(
    protected leafletMap: L.Map,
    protected featureItemsPromise: Promise<Array<FeatureDisplayItem>>,
    protected injector: Injector,
  ) {
    this.urlToLinkPipe = this.injector.get<UrlToLinkPipe>(UrlToLinkPipe);
    this.mapInteractionService = this.injector.get<MapInteractionService>(MapInteractionService);
  }

  /**
   * The function `getDisplayItem` creates a div element with a loading spinner, adds slides to it,
   * creates navigation buttons, and returns the div element if there are slides, otherwise it returns
   * null.
   * @returns a Promise that resolves to either an HTMLElement or null.
   */
  public getDisplayItem(): Promise<null | HTMLElement> {
    // Create the div which holds the header and content
    // Initially set to display loading spinner
    this.content = jQuery(`<div class="${PaginatedFeatures.CSS_CLASS}"></div>`)[0];

    this.slideWrapper = jQuery(
      '<div class="slide-wrapper pretty-scroll limit-size"><i class="spinner fas fa-spinner fa-pulse"></i></div>',
    )[0];
    jQuery(this.content).append(this.slideWrapper);
    // take out of flow to ensure function returns immediately
    return this.createSlides().then(() => {
      // add slides
      this.slides.forEach((slide) => jQuery(this.slideWrapper).append(slide));

      jQuery(this.content).append(this.createNavigation());

      if (this.slides.length > 0) {
        this.changeSlide();
        return this.content;
      } else {
        return null;
      }
    });
  }

  /**
   * The function `createSlides` loops through a list of feature items, filters out hidden features,
   * and creates slides with clickable content for each visible feature.
   * @returns The function `createSlides()` returns a Promise that resolves to `void`.
   */
  protected createSlides(): Promise<void> {
    // loops through all the features
    return this.featureItemsPromise.then((featureItems: Array<FeatureDisplayItem>) => {

      if (featureItems !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        this.slides = featureItems
          .map((featureItem: FeatureDisplayItem) => {
            let slide: null | HTMLElement = null;
            if (null != featureItem) {

              const featureObject = featureItem.featureObject as FeaturePropertiesDisplayItem;

              if (featureObject !== null) {

                Object.entries(featureObject.properties).map((property) => {

                  if (property[1] !== null && property[1] !== undefined && typeof property[1] !== 'string' && typeof property[1] !== 'number') {
                    if (Object.keys(property[1])[0] === '@href') {
                      const href = property[1]['@href'] as string;
                      const title = property[1]['@title'] as string;
                      const link = `<a href="${href}" target="_blank">${title}</a>`;

                      featureObject.properties[property[0]] = link;
                    } else {
                      if (property[0].lastIndexOf(JsonHelper.ATTR_PREFIX) === 0) {
                        featureObject.properties[property[0]] = property[1];
                      } else {
                        featureObject.properties[property[0]] = this.jsonToRow(property[1], '', 0);
                      }
                    }
                  }
                });

              }

              let markerIsInMap = true;
              // if the popup needs to be hidden due to the "propertyHiddenOnMap" feature
              if (featureObject !== null && this.mapInteractionService.propertyHiddenOnMap.includes(featureObject.properties[PopupProperty.PROPERTY_ID] as string)) {
                markerIsInMap = false;
              }

              const featureDisplayContent = featureItem.getContent();
              if (null != featureDisplayContent && markerIsInMap) {
                slide = jQuery('<div class="slide"></div>')[0];
                if (null != featureItem.click) {
                  slide.addEventListener('click', (event) => {
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                    featureItem.click!(event);
                  });
                }

                if (featureDisplayContent instanceof HTMLElement) {
                  jQuery(slide).append(featureDisplayContent);
                } else {
                  jQuery(slide).html(String(featureDisplayContent));
                }
              }
            }

            return slide;
          })
          .filter((slide) => slide != null) as Array<HTMLElement>;
      }
    });
  }

  /**
   * The function creates a navigation element with previous and next buttons, and returns it as a
   * jQuery object.
   * @returns a jQuery object representing the navigation element.
   */
  protected createNavigation(): JQuery {
    // nav
    const nav = jQuery(`
            <div class="slide-navigation">
              <span class="nav nav-prev disable"></span>
              <span class="nav-text"></span>
              <span class="nav nav-next disable"></span>
            </div>
          `);
    this.navText = jQuery(nav).find('.nav-text')[0];
    this.prevButts = jQuery(nav).find('.nav.nav-prev')[0];
    this.nextButts = jQuery(nav).find('.nav.nav-next')[0];

    const orderOfMagnitude = this.slides.length.toString().length;
    const magnitudeStrings = ['One', 'Ten', 'One Hundred', 'One Thousand'];

    const makeButtons = (wrapper: HTMLElement, iconClassString: string, isnext: boolean) => {
      const navString = isnext ? 'Forward' : 'Back';
      const dataCyString = isnext ? 'popup-next-slide' : 'popup-prev-slide';
      for (let i = 0; i < orderOfMagnitude; i++) {
        const butt = jQuery(`<span class="nav-butt" title="${navString} ${magnitudeStrings[i]}" data-cy="${dataCyString}"></span>`);
        butt.on('click', () => this.changeSlide(isnext, Math.pow(10, i)));
        for (let j = 0; j <= i; j++) {
          butt.append(jQuery(`<i class="${iconClassString}"></i>`));
        }
        jQuery(wrapper).append(butt);
      }
    };
    makeButtons(this.prevButts, 'fas fa-chevron-left', false);
    makeButtons(this.nextButts, 'fas fa-chevron-right', true);
    return nav;
  }

  /**
   * The function changes the selected slide based on the given parameters and updates the navigation
   * text accordingly.
   * @param {boolean} [next] - A boolean value indicating whether to move to the next slide or not. If
   * true, it will move to the next slide. If false, it will move to the previous slide. If not
   * provided, it will default to true.
   * @param [howMuch=1] - The `howMuch` parameter is used to determine how many slides to move forward
   * or backward. By default, it is set to 1, which means it will move to the next slide. However, you
   * can specify a different value to move multiple slides at once. For example, if you set
   */
  protected changeSlide(next?: boolean, howMuch = 1): void {
    let slideToSelect = this.currentSlide;
    slideToSelect = next === true ? slideToSelect + howMuch : slideToSelect;
    slideToSelect = next === false ? slideToSelect - howMuch : slideToSelect;
    slideToSelect = slideToSelect < 0 ? 0 : slideToSelect;
    slideToSelect = slideToSelect > this.slides.length - 1 ? this.slides.length - 1 : slideToSelect;
    if (slideToSelect === this.slides.length - 1) {
      jQuery(this.nextButts).addClass('disable');
    } else {
      jQuery(this.nextButts).removeClass('disable');
    }
    if (slideToSelect === 0) {
      jQuery(this.prevButts).addClass('disable');
    } else {
      jQuery(this.prevButts).removeClass('disable');
    }

    // deselect old slide
    jQuery(this.slideWrapper).find('.slide.selected').removeClass('selected');
    // select new slide, targets the div id which is set by looping through all the marker layers
    jQuery(this.slideWrapper)
      .find(`.slide:nth-of-type(${slideToSelect + 1})`)
      .addClass('selected');

    jQuery(this.navText).html(`${slideToSelect + 1} of ${this.slides.length}`);

    this.currentSlide = slideToSelect;
  }

  /**
   * The function `jsonToRow` takes a JSON object and converts it into an HTML string with nested
   * paragraphs and indentation.
   * @param {object} json - The `json` parameter is an object that represents a JSON data structure. It
   * can contain nested objects and arrays.
   * @param [result] - The `result` parameter is a string that stores the result of converting the JSON
   * object to rows of HTML code.
   * @param [level=0] - The `level` parameter is used to keep track of the indentation level in the
   * resulting string. It is incremented when a nested object is encountered, and decremented when the
   * nested object has been processed. This helps in maintaining the correct indentation for nested
   * objects in the resulting string.
   * @returns a string representation of the JSON object, with each key-value pair formatted as an HTML
   * paragraph element. The values are transformed using the `urlToLinkPipe.transform` method before
   * being added to the result string.
   */
  private jsonToRow(json: object, result = '', level = 0): string {

    const keys = Object.keys(json);
    const values = Object.values(json);

    keys.forEach((k, i) => {

      if (typeof values[i] === 'string') {

        result += '<p style="margin: 0px">';

        for (let t = 0; t < level; t++) {
          result += '<span>&nbsp&nbsp</span>';
        }

        result += k + ': ' + this.urlToLinkPipe.transform(values[i] as string, 'link', 'no-word-break') + '</p>';
      } else {
        level++;
        result = this.jsonToRow(values[i] as object, result, level);
      }
    });

    return result;
  }
}

/** The above code is defining an interface called `FeaturePropertiesDisplayItem` in TypeScript. This
interface is used to define the structure and properties of an object that represents a display item
for a feature. */
interface FeaturePropertiesDisplayItem {

  /** The above code is declaring a variable named "geometry" with the type "unknown". */
  geometry: unknown;

  /** The above code is written in TypeScript and declares a variable `id` of type `string`. */
  id: string;

  /** The above code is declaring a TypeScript class or interface with a property called "properties"
  which is an array of strings. */
  properties: Array<string>;
}
