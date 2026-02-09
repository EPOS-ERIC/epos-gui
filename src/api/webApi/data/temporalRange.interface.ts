import { Moment, unitOfTime } from 'moment';

export interface TemporalRange {

  isUnbounded(): boolean;
  hasUpperBound(): boolean;
  hasLowerBound(): boolean;

  getLowerBound(): null | Moment;
  getUpperBound(): null | Moment;

  /**
   * Does this temporal range intersect with the specified one.
   * @param temporalRange
   * @param precision the level of granularity  e.g.  year month week isoWeek day hour minute second
   */
  intersects(temporalRange: TemporalRange, granularity?: unitOfTime.StartOf): boolean;

  toFormattedString(format: null | string): string;
  toFormattedStringExtra(config: { format: null | string; separator: null | string; undefinedStr: null | string }): string;
}
