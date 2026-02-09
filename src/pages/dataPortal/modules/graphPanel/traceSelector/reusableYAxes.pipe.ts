import { Pipe, PipeTransform } from '@angular/core';
import { Trace } from '../objects/trace';
import { YAxis } from '../objects/yAxis';

@Pipe({
  name: 'reusableYAxes',
})
export class ReusableYAxesPipe implements PipeTransform {
  transform(
    selectedTraces: Record<string, Trace>,
    trace: Trace,
  ): Array<YAxis> {
    return this.getReusableYAxes(trace, selectedTraces);
  }

  /** Returns any current {@link YAxis} objects that can be re-used by the passed in {@link Trace}. */
  private getReusableYAxes(trace: Trace, selectedTraces: Record<string, Trace>): Array<YAxis> {
    const axes = ((null == selectedTraces) || (null == trace))
      ? new Array<YAxis>()
      : Object.values(selectedTraces).map((thisTrace: Trace) => {
        return ((null != thisTrace.yAxis) && (trace.yUnit === thisTrace.yAxis.unit))
          ? thisTrace.yAxis
          : null;
      })
        .filter(yAxis => (null != yAxis)) // filter nulls
        .filter((yAxis: YAxis, index: number, array: Array<YAxis>) => {
          // filter to make unique
          return (array.indexOf(yAxis) === index);
        });
    return axes as Array<YAxis>;
  }
}
