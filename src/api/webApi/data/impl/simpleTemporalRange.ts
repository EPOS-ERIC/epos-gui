import { TemporalRange } from '../temporalRange.interface';
import { Moment, unitOfTime } from 'moment';
import { Confirm } from 'api/webApi/utility/preconditions';
import * as moment from 'moment';

/**
 * Temporal range.
 *
 * Can be 'closed' between two fixed datetimes.
 * Can be 'open' from a start datetime onwards.
 * Can be 'open' upto an end datetime.
 */
export class SimpleTemporalRange implements TemporalRange {
  private readonly lower: null | Moment;
  private readonly upper: null | Moment;

  private constructor(
    lower: null | Moment,
    upper: null | Moment
  ) {
    this.lower = (lower == null) ? null : moment.utc(lower);
    this.upper = (upper == null) ? null : moment.utc(upper);
  }

  public static isDifferent(bbox1: TemporalRange, bbox2: TemporalRange): boolean {
    return (bbox1.toFormattedString(null) !== bbox2.toFormattedString(null));
  }

  public static makeUnchecked(lower: null | Moment, upper: null | Moment): SimpleTemporalRange {

    return new SimpleTemporalRange(lower, upper);
  }

  public static makeBounded(start: Moment, end: Moment): SimpleTemporalRange {
    Confirm.requiresValid(start);
    Confirm.requiresValid(end);

    let lower = start;
    let upper = end;

    if (start.isAfter(end)) {
      // swap
      lower = end;
      upper = start;
    }

    return SimpleTemporalRange.makeUnchecked(lower, upper);
  }

  public static makeWithoutLowerBound(end: Moment): SimpleTemporalRange {
    Confirm.requiresValid(end);
    return new SimpleTemporalRange(null, end);
  }

  public static makeWithoutUpperBound(start: Moment): SimpleTemporalRange {
    Confirm.requiresValid(start);
    return new SimpleTemporalRange(start, null);
  }

  public static makeUnbounded(): SimpleTemporalRange {
    return new SimpleTemporalRange(null, null);
  }


  isUnbounded(): boolean {
    return this.lower == null && this.upper == null;
  }
  hasUpperBound(): boolean {
    return this.upper != null;
  }
  hasLowerBound(): boolean {
    return this.lower != null;
  }
  getLowerBound(): null | Moment {
    return this.lower;
  }
  getUpperBound(): null | Moment {
    return this.upper;
  }

  format(format: null | string = null): string {
    format = (null == format) ? 'YYYY-MM-DD hh:mm:ssZ' : format;
    return format;
  }

  public toFormattedString(format: null | string = null): string {
    format = this.format(format);
    let s = 'TemporalRange: ';
    s = s + ((null != this.lower) ? this.lower.format(format) : '...');
    s = s + ' to ';
    s = s + ((null != this.upper) ? this.upper.format(format) : '...');
    return s;
  }

  public toFormattedStringExtra(config: { format: null | string; separator: null | string; undefinedStr: null | string }): string {
    const format = this.format(config.format);
    const strSeparator: string = ((null != config.separator) ? config.separator : ' to ');
    const strUndefined: string = ((null != config.undefinedStr) ? config.undefinedStr : '...');
    let s: string;
    s = ((null != this.lower) ? this.lower.format(format) : strUndefined);
    s = s + strSeparator;
    s = s + ((null != this.upper) ? this.upper.format(format) : strUndefined);
    return s;
  }

  intersects(temporalRange: TemporalRange, granularity?: unitOfTime.StartOf): boolean {
    Confirm.requiresValid(temporalRange);

    const testLower = temporalRange.getLowerBound();
    const testUpper = temporalRange.getUpperBound();

    const thisLower = this.getLowerBound();
    const thisUpper = this.getUpperBound();

    let result = true;

    if (result && (null != testLower) && (null != thisUpper)) {
      result = testLower.isBefore(thisUpper, granularity);
    }

    if (result && (null != testUpper) && (null != thisLower)) {
      result = testUpper.isAfter(thisLower, granularity);
    }

    return result;
  }
}
