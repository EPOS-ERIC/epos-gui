import { Component, Input, HostListener, ElementRef } from '@angular/core';
import { Trace } from '../objects/trace';
import { YAxis } from '../objects/yAxis';
import { YAxisDisplaySide } from '../objects/yAxisDisplaySide.enum';
import { YAxisDisplayType } from '../objects/yAxisDisplayType.enum';
import { Config, Data, Layout } from 'plotly.js';
/**
 * Wrapper for the visualization graphing functionality using plotly
 * {@link https://plotly.com/javascript/}.
 *
 */
@Component({
  selector: 'app-data-graph-display',
  templateUrl: './graphDisplay.component.html',
  styleUrls: ['./graphDisplay.component.scss']
})
export class GraphDisplayComponent {

  @Input() plotlyVHeight: number | boolean = false;

  /** Variable representing data, passed into plotly component. */
  public data: Array<Data>;
  /** Variable representing layout, passed into plotly component. */
  public layout: Partial<Layout>;
  /** Variable representing configuration, passed into plotly component. */
  public config = {
    responsive: true,
  } as Config;

  /** Space to reserve for y-axes when in [OVERLAY display mode]{@link YAxisDisplayType#OVERLAY} */
  private readonly AXIS_WIDTH = 0.15;

  /** Array of {@link Trace} objects currently displayed. */
  private currentTraces = new Array<Trace>();
  /** Array of {@link YAxis} objects used by the display */
  private currentYAxes = new Array<YAxis>();
  /** The currently selected {@link YAxisDisplayType} value. */
  private _selectedDisplayType = YAxisDisplayType.STACK;

  /** Minimum height of a y-axis */
  private readonly MIN_SINGLE_AXIS_HEIGHT = 125;
  /** Minimum height of the component */
  private readonly MIN_COMPONENT_HEIGHT = 400;

  /** Input setter for the Array of {@link Trace} objects that will be displayed. */
  @Input()
  set traces(traces: Array<Trace>) {
    if (null != traces) {
      this.updateGraph(traces);
    }
  }

  /** The currently selected {@link YAxisDisplayType} value. */
  @Input()
  set selectedDisplayType(displayType: YAxisDisplayType) {
    this._selectedDisplayType = displayType;
    this.refreshGraph();

  }

  /**
   * When window resizes reevaluate height
   */
  @HostListener('window:resize', ['$event'])
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  onResize(event) {
    this.updatePlotHeight();
  }

  /** Constructor. */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  constructor(
    private readonly componentRef: ElementRef,
    // private readonly dataVisualizationService: DataVisualizationService,
  ) {
    this.layout = this.getLayoutObject();
  }

  /** Called when the selected {@link #traces} are updated. */
  private updateGraph(traces: Array<Trace>): void {
    if (traces != null) {
      // check if any traces removed
      if (
        (this.currentTraces.length !== traces.length) // the length has changed
        || !this.currentTraces.every((thisTrace: Trace) => { // anything has been removed
          return traces.includes(thisTrace);
        })
      ) {
        this.currentTraces = traces;
        this.refreshGraph();

      }
    }
  }

  /**
   * This method builds and returns a plotly [layout]{@link https://plotly.com/javascript/reference/#layout}
   * object using the {@link #__selectedDisplayType}, {@link #currentYAxes} and {@link #currentTraces}.
   */
  private getLayoutObject(): Partial<Layout> {
    let returnObject: Partial<Layout> = {
      autosize: true,
      height: this.getWrapperHeight(),
      margin: {
        // l: 60,  // space for axis?
        // r: 0,
        b: 80,  // space for axis
        t: 40,  //  might need more when there's a title
        pad: 4
      },
    };

    switch (this._selectedDisplayType) {
      case (YAxisDisplayType.STACK):
        returnObject = {
          ...returnObject,
          grid: {
            rows: this.currentTraces.length,
            columns: 1,
            pattern: 'independent',
          }
        };
        break;
      case (YAxisDisplayType.OVERLAY): {
        const leftYAxisCount = this.currentYAxes.filter(yAxis => yAxis.displaySide === YAxisDisplaySide.LEFT).length;
        const leftYAxisWidth = leftYAxisCount * this.AXIS_WIDTH;
        const rightYAxisWidth = (this.currentYAxes.length - leftYAxisCount) * this.AXIS_WIDTH;
        returnObject = {
          ...returnObject,
          xaxis: {
            domain: [leftYAxisWidth, 1 - rightYAxisWidth],
          }
        };
        break;
      }
    }

    this.currentYAxes.forEach((yAxis: YAxis, index: number) => {
      returnObject[yAxis.key] = yAxis.getPlotlyObject(this._selectedDisplayType, this.currentYAxes.length, this.currentTraces[index]);
    });

    return returnObject;
  }

  /**
   * Updates the height of the plot.  Called if the height of the panel changes.
   */
  private updatePlotHeight(): void {
    if (null != this.layout) {
      this.layout = {
        ...this.layout,
        height: this.getWrapperHeight(),
      };
    }
  }

  /**
   * Returns the new height that the plot is going to be, based on panel height
   * and what we're trying to show.
   */
  private getWrapperHeight(): number {
    let minHeight = this.MIN_COMPONENT_HEIGHT;
    if (YAxisDisplayType.STACK === this._selectedDisplayType) {
      minHeight = Math.max(minHeight, this.currentYAxes.length * this.MIN_SINGLE_AXIS_HEIGHT);
    }
    const availableHeight = (null != this.componentRef)
      ? (this.componentRef.nativeElement as HTMLElement).clientHeight
      : this.MIN_COMPONENT_HEIGHT;
    return Math.max(minHeight, availableHeight);
  }

  /**
   * y-axes are cached in the {@link #currentYAxes} variable with their side set so that
   * adding/removing plots doesn't move them around.  This method updates that cache, updating
   * some axis attributes as it goes, for display purposes.
   */
  private resolveYAxisChanges(): void {
    // get unique array of needed yaxes.
    let newYAxes = this.currentTraces.map(trace => trace.yAxis);
    newYAxes = newYAxes.filter((yAxis: YAxis, index: number) => {
      return (newYAxes.indexOf(yAxis) === index);
    });

    // remove any no longer needed
    this.currentYAxes = this.currentYAxes.filter(yAxis => (newYAxes.includes(yAxis)));

    // add any new axes
    newYAxes
      .filter((yAxis: YAxis) => (!this.currentYAxes.includes(yAxis)))
      .forEach((yAxis: YAxis) => {
        const currentLeftAxesCount = this.currentYAxes
          .filter(thisAxis => (thisAxis.displaySide === YAxisDisplaySide.LEFT))
          .length;
        const currentRightAxesCount = this.currentYAxes
          .filter(thisAxis => (thisAxis.displaySide === YAxisDisplaySide.RIGHT))
          .length;

        yAxis.displaySide = (currentLeftAxesCount > currentRightAxesCount)
          ? YAxisDisplaySide.RIGHT
          : YAxisDisplaySide.LEFT;

        this.currentYAxes.push(yAxis);
      });

    // update offsets and indices
    let leftCount = 0;
    let rightCount = 0;
    this.currentYAxes.forEach((yAxis: YAxis, index: number) => {
      if (yAxis.displaySide === YAxisDisplaySide.LEFT) {
        yAxis.setDisplayPosition(leftCount++, this.AXIS_WIDTH);
      } else {
        yAxis.setDisplayPosition(rightCount++, this.AXIS_WIDTH);
      }
      yAxis.index = index;
    });
  }

  /** Updates the {@link #data} and {@link #layout} variables to change the display. */
  private refreshGraph(): void {
      this.resolveYAxisChanges();
      this.data = this.currentTraces
        .map(trace => trace.getPlotlyTrace())
        .filter(trace => (null != trace)) as Array<Trace>;
      this.layout = this.getLayoutObject();
    }
}

