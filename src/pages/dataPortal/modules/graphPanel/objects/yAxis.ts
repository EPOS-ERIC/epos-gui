import { LayoutAxis } from 'plotly.js';
import { YAxisDisplaySide } from './yAxisDisplaySide.enum';
import { YAxisDisplayType } from './yAxisDisplayType.enum';
import { Trace } from './trace';

/**
 * Object representing the y-axis that needs to be generated for the plot.
 */
export class YAxis {

  /** The index of this y-axis in the complete list of y-axes. */
  private _index: number;
  /** The {@link YAxisDisplaySide} allocated to this y-axis. Only used with some {@link YAxisDisplayType}s. */
  private _displaySide: YAxisDisplaySide;
  /** The position of this y-axis. Only used with some {@link YAxisDisplayType}s. */
  private _displayPosition: number;

  /** Constructor */
  constructor(
    private readonly _yUnit: string,
    private readonly _yUnitLabel: string,
  ) { }

  /** String representing the units of this y-axis */
  get unit(): string { return this._yUnit; }
  /** String representing the label of the units of this y-axis */
  get unitLabel(): string { return this._yUnitLabel; }

  /** The key used to reference this y-axis. */
  get key(): string { return (this.index === 0) ? 'yaxis' : `yaxis${this.index + 1}`; }

  get displayPosition(): number {
    return this._displayPosition;
  }

  /** Returns the {@link #_index}. */
  get index(): number { return this._index; }

  /** Sets the {@link #_index}. */
  set index(index: number) { this._index = index; }

  set displaySide(displaySide: YAxisDisplaySide) {
    this._displaySide = displaySide;
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  get displaySide(): YAxisDisplaySide {
    return this._displaySide;
  }

  public setDisplayPosition(sideIndex: number, axisWidth: number): void {
    const positionOffset = sideIndex * axisWidth;
    const position = (this.displaySide === YAxisDisplaySide.LEFT)
      ? (0 + positionOffset)
      : (1 - positionOffset);

    this._displayPosition = position;
  }

  public getPlotlyObject(displaytype: YAxisDisplayType, totalYAxes: number, trace: Trace): Partial<LayoutAxis> {

    const tracktitle = this.unitLabel;

    let returnObject: Partial<LayoutAxis> = {
    };

    // get color style
    const style = trace.getStyle();
    if (style !== null) {
      returnObject = {
        ...returnObject,
        color: style.color1CssString
      };
    }

    switch (displaytype) {
      case (YAxisDisplayType.OVERLAY):
        returnObject = {
          ...returnObject,
          title: tracktitle,
          position: this.displayPosition,
          side: this.displaySide, // the side the title is of the y-axis values
          overlaying: (this.index === 0) ? undefined : 'y',
        };
        break;
      case (YAxisDisplayType.STACK):
        returnObject = {
          ...returnObject,
          title: tracktitle.length > 15 ? tracktitle.replace(/ /g, '<br>') : tracktitle,
          domain: [
            (1 / totalYAxes) * this.index,
            ((1 / totalYAxes) * (this.index + 1)) - 0.05,
          ],
        };
        break;
    }

    return returnObject;
  }
}
