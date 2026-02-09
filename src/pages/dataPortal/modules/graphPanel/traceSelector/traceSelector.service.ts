import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class TraceSelectorService {

  private traceSelectedSrc = new Subject<[string, string | null, boolean]>();
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public traceSelectedObs = this.traceSelectedSrc.asObservable();

  /**
   * The function setTraceSelector updates the selection status of a trace for a specific layer.
   * @param {string} layerId - LayerId is a string parameter that represents the identifier of a
   * specific layer in the application.
   * @param {string} trace - The `trace` parameter in the `setTraceSelector` method is a string that
   * represents a specific trace or identifier within a layer. It is used to uniquely identify a trace
   * within the specified layer.
   * @param {boolean} selected - The `selected` parameter is a boolean value that indicates whether the
   * trace is selected or not. If `selected` is `true`, it means the trace is selected; if `selected`
   * is `false`, it means the trace is not selected.
   */
  public setTraceSelector(layerId: string, trace: string, selected: boolean): void {
    this.traceSelectedSrc.next([layerId, trace, selected]);
  }
}
