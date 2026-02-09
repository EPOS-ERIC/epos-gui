import { ModelItem } from './modelItem';
import moment from 'moment-es6';
import { TemporalRange } from 'api/webApi/data/temporalRange.interface';
import { SimpleTemporalRange } from 'api/webApi/data/impl/simpleTemporalRange';

/**
 * A {@link ModelItem} that holds a {@link TemporalRange}.
 *
 * Persists as strings.
 */
export class TemporalRangeMI extends ModelItem<TemporalRange> {

  constructor(
    persist = false,
  ) {
    super(SimpleTemporalRange.makeUnbounded());
    if (persist) {
      this.setPersistFunctions(
        (modelItem: ModelItem<TemporalRange>) => this.convertToPersistanceFormat(modelItem),
        (modelItem: ModelItem<TemporalRange>, value: [string, string]) => this.convertFromPersistanceFormat(value),
      );
    }

    this.persistableOnConfigurables = true;
  }

  private convertToPersistanceFormat(modelItem: ModelItem<TemporalRange>): [null | string, null | string] {
    const lower = modelItem.get().getLowerBound();
    const upper = modelItem.get().getUpperBound();
    return [
      (lower != null) ? lower.format() : null,
      (upper != null) ? upper.format() : null,
    ];
  }

  private convertFromPersistanceFormat(value: [string, string]): Promise<TemporalRange> {
    return Promise.resolve(
      (value == null)
        ? SimpleTemporalRange.makeUnbounded()
        : SimpleTemporalRange.makeUnchecked(
          (value[0] == null) ? null : moment.utc(value[0]),
          (value[1] == null) ? null : moment.utc(value[1]),
        )
    );
  }
}
