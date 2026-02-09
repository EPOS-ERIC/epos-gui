import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { Observable, BehaviorSubject } from 'rxjs';
import { Legend } from './legend';
import { LegendDisplay } from './legendDisplay.interface';
import { StackedLegendDisplay } from './stackedLegendDisplay';
import { AbstractControl } from '../abstractControl/abstractControl';
import { MapLayer } from '../../layers/mapLayer.abstract';

/** The `LegendControl` class is responsible for managing and displaying legends for map layers in a
graphical user interface. */
export class LegendControl extends AbstractControl {

  /** The line `protected legendDisplay: LegendDisplay = new StackedLegendDisplay();` is declaring a
  protected property `legendDisplay` of type `LegendDisplay` and initializing it with a new instance
  of the `StackedLegendDisplay` class. This property is used to determine the display style of the
  legend in a graphical user interface. By default, it is set to use a stacked legend display. */
  protected legendDisplay: LegendDisplay = new StackedLegendDisplay();

  /** The line `protected legendHeader: HTMLElement;` is declaring a protected property `legendHeader` of
  type `HTMLElement`. This property is used to store a reference to the HTML element that represents
  the header section of the legend control in a graphical user interface. It will be used to
  manipulate and update the header content of the legend control. */
  protected legendHeader: HTMLElement;

  /** The line `protected legendContent: HTMLElement;` is declaring a protected property `legendContent`
  of type `HTMLElement`. This property is used to store a reference to the HTML element that
  represents the content section of the legend control in a graphical user interface. It will be used
  to manipulate and update the content of the legend control. */
  protected legendContent: HTMLElement;

  /** The line `protected http: HttpClient;` is declaring a protected property `http` of type
  `HttpClient`. This property is used to store an instance of the `HttpClient` class, which is used to
  make HTTP requests. It allows the `LegendControl` class to make HTTP requests to retrieve legend
  data for visible layers. */
  protected http: HttpClient;

  /** The line `protected layers = new Array<MapLayer>();` is declaring a protected property `layers` and
  initializing it with an empty array of `MapLayer` objects. This property is used to store the layers
  for which legends need to be displayed. It allows the `LegendControl` class to keep track of the
  layers and update the legends accordingly. */
  protected layers = new Array<MapLayer>();

  /** The line `protected currentLegendArraySource = new BehaviorSubject<Array<Legend>>(new
  Array<Legend>());` is declaring a protected property `currentLegendArraySource` and initializing it
  with a new instance of the `BehaviorSubject` class. */
  protected currentLegendArraySource = new BehaviorSubject<Array<Legend>>(new Array<Legend>());

  /** The line `protected selectedLegend: Legend;` is declaring a protected property `selectedLegend` of
  type `Legend`. This property is used to store the currently selected legend in the legend control.
  It can be used to keep track of the selected legend and perform actions based on the selected
  legend, such as displaying additional information or applying filters to the map layers. */
  protected selectedLegend: Legend;

  /**
   * The function sets the legend display property and returns the instance of the class.
   * @param {LegendDisplay} legendDisplay - The `legendDisplay` parameter is of type `LegendDisplay`.
   * It is used to set the display of a legend in a graphical user interface.
   * @returns The method is returning the current instance of the class.
   */
  public setDisplay(legendDisplay: LegendDisplay): this {
    this.legendDisplay = legendDisplay;
    return this;
  }

  /**
   * The function sets the HttpClient for the current object.
   * @param {HttpClient} http - The parameter "http" is of type HttpClient.
   */
  public setHttpClient(http: HttpClient): void {
    this.http = http;
  }

  /**
   * The function returns the control container element.
   * @returns The method is returning an HTMLElement.
   */
  public onAdd(): HTMLElement {
    return this.getControlContainer();
  }

  /**
   * The `init` function sets up a display updater that watches for changes in legends and updates the
   * legend display accordingly.
   */
  public init(): void {
    // set up display updater
    this.watchLegends().subscribe(() => {
      this.legendDisplay.displayLegend(
        this.getLegends(),
        (contentElement: HTMLElement, headerElements?: Array<HTMLElement>) => {
          this.setControlContent(contentElement, headerElements);
        },
      );
    });
  }

  /**
   * The function updates the layers of a map and then updates the legends.
   * @param layers - The `layers` parameter is an array of `MapLayer` objects.
   */
  public updateLayers(layers: Array<MapLayer>): void {
    this.layers = layers;
    this.updateLegends();
  }

  /**
   * The function sets the legends array to a new value or an empty array if the input is null.
   * @param legends - An array of Legend objects.
   * @returns The method is returning the result of the `next()` method call on the
   * `currentLegendArraySource` object.
   */
  public setLegends(legends: Array<Legend>): void {
    return this.currentLegendArraySource.next(legends != null ? legends : new Array<Legend>());
  }

  /**
   * The function returns an array of Legend objects.
   * @returns An array of Legend objects.
   */
  public getLegends(): Array<Legend> {
    return this.currentLegendArraySource.getValue();
  }

  /**
   * The function returns an Observable that emits an array of Legend objects.
   * @returns An Observable of an array of Legend objects is being returned.
   */
  public watchLegends(): Observable<Array<Legend>> {
    return this.currentLegendArraySource.asObservable();
  }

  /**
   * The `removeLegends` function removes legends associated with a specific layer.
   * @param {string} layerId - The `layerId` parameter is a string that represents the ID of the layer
   * for which the legends need to be removed.
   */
  public removeLegends(layerId: string): void {
    const legendsArray = this.getLegends().filter((legendData: Legend) => {
      return legendData.layerId !== layerId;
    });
    this.setLegends(legendsArray);
  }

  /**
   * The function `setControlContent` sets the content and header elements of a legend control.
   * @param {HTMLElement} contentElement - The contentElement parameter is an HTMLElement that
   * represents the content to be displayed in the control. It will be appended to the legendContent
   * element.
   * @param headerElements - An array of HTMLElements that will be added as header elements in the
   * legend section.
   */
  public setControlContent(contentElement: HTMLElement, headerElements = new Array<HTMLElement>()): void {
    if (this.legendContent != null) {
      while (this.legendContent.childElementCount > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        this.legendContent.removeChild(this.legendContent.lastChild!);
      }
      this.legendContent.appendChild(contentElement);
    }

    if (this.legendHeader != null) {
      while (this.legendHeader.childElementCount > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        this.legendHeader.removeChild(this.legendHeader.lastChild!);
      }
      if (this.getLegends().length > 0) {
        headerElements.forEach((element: HTMLElement) => {
          this.legendHeader.appendChild(element);
        });
      } else {
        const titleDisplay = document.createElement('div');
        titleDisplay.innerHTML = 'No Legends';
        titleDisplay.classList.add('legend-title');
        this.legendHeader.appendChild(titleDisplay);
      }
    }
  }

  /**
   * The function "updateLegends" retrieves legend data for visible layers and updates the legends
   * accordingly.
   */
  protected updateLegends(): void {
    const legendPromiseArray = Array<Promise<null | Array<Legend>>>();
    // get legend data for visible layers
    this.layers.forEach((layer: MapLayer) => {
      if (!layer.hidden.get()) {
        const layerLegendArray = this.getLegends().filter((legendData: Legend) => {
          return legendData.layerId === layer.id;
        });
        if (layerLegendArray.length === 0) {
          // fetch by calling
          legendPromiseArray.push(layer.getLegendData(this.http));
        } else {
          // populate from previous data
          legendPromiseArray.push(Promise.resolve(layerLegendArray));
        }
      }
    });
    void Promise.all(legendPromiseArray).then((layerLegendArrayArray: Array<Array<Legend>>) => {
      let flattenedLegendArray = new Array<Legend>();
      layerLegendArrayArray.forEach((thisLayerLegendArray: Array<Legend>) => {
        if (thisLayerLegendArray != null) {
          flattenedLegendArray = flattenedLegendArray.concat(
            thisLayerLegendArray.filter((legend: Legend) => legend != null),
          );
        }
      });
      this.setLegends(flattenedLegendArray);
    });
  }

  /**
   * The function creates a control container element for a legend display in a TypeScript application.
   * @returns The method `getControlContainer()` is returning an HTMLElement.
   */
  protected getControlContainer(): HTMLElement {
    const contentWrapper = L.DomUtil.create('div');
    contentWrapper.classList.add('legend-wrapper');
    contentWrapper.classList.add(this.legendDisplay.cssClassName);

    this.legendHeader = document.createElement('div');
    this.legendHeader.classList.add('legend-header');
    contentWrapper.appendChild(this.legendHeader);

    this.legendContent = document.createElement('div');
    this.legendContent.classList.add('legend-content');
    this.legendContent.classList.add('pretty-scroll');
    contentWrapper.appendChild(this.legendContent);

    return super.getControlContainer('legend-control', 'fas fa-th-list', 'Legends', contentWrapper);
  }
}
