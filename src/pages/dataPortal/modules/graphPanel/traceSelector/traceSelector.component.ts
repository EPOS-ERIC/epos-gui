import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { DataConfigurable } from 'utility/configurables/dataConfigurable.abstract';
import { Trace } from '../objects/trace';
import { Styler, graphDefaultStyles } from 'utility/styler/styler';
import { YAxis } from '../objects/yAxis';
import { Subscription } from 'rxjs';
import { DataConfigurableDataSearch } from 'utility/configurablesDataSearch/dataConfigurableDataSearch';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';
import { TraceSelectorService } from './traceSelector.service';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { DataSearchConfigurablesServiceResource } from '../../dataPanel/services/dataSearchConfigurables.service';



/**
 * Allows a user to select which traces to display on the associated graph.
 */
@Unsubscriber('subscriptions')
@Component({
  selector: 'app-data-trace-selector',
  templateUrl: './traceSelector.component.html',
  styleUrls: ['./traceSelector.component.scss']
})
export class TraceSelectorComponent implements OnInit {
  /** An EventEmitter that allows changes in the selected items to be passed to the parent */
  @Output() selectedTraces = new EventEmitter<Array<Trace>>();

  @Output() loading = new EventEmitter<boolean>();

  /** The `traceSelectorExpanded` variable is a boolean flag that determines whether the trace selector
  component is expanded or collapsed. It is used to control the visibility of the trace selector in
  the user interface. */
  public traceSelectorExpanded: boolean;

  /**
   * A Record associating a {@link DataConfigurable} id with the {@link Trace}s that were derived from it.
   */
  public traceRecord: Record<string, null | Array<Trace>>;

  /** {@link DataConfigurable} associated with traces.  Used for iterating through in the display */
  public configurables = new Array<DataConfigurableDataSearch>();

  /** Used in the display to disable the add buttons when the trace count limit is reached. */
  public addIsDisabled = false;

  /** Array of the currently selected {@link Trace} objects. */
  public _selectedTraces: Record<string, Trace> = {};

  // Pending IDs to restore once traces are available
  private pendingRestoreIds = new Set<string>();

  /**
   * Setter that sets {@link #traceMap} then calls {@link #updateDistributionPlotList}.
   */
  @Input() set traceMap(traceMap: Map<DataConfigurableDataSearch, null | Array<Trace>>) {
    this.updateDistributionPlotList(traceMap);
  }

  /**
   * {@link Style} objects assigned to and used in the display of selected traces.
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  private readonly TRACE_STYLES = graphDefaultStyles;

  /** Maximum number of {@link Trace}s that can be selected at one time. */
  // eslint-disable-next-line @typescript-eslint/member-ordering, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  public readonly MAX_SELECTED_TOGGLES = this.TRACE_STYLES.length;

  /** {@link Styler} object used to manage assigning {@link Style}s to {@link Trace}s. */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  private readonly styler = new Styler(this.TRACE_STYLES);

  /** Variable for keeping track of subscriptions, which are cleaned up by Unsubscriber */
  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  constructor(
    private readonly panelsEvent: PanelsEmitterService,
    private readonly traceSelector: TraceSelectorService,
    private readonly localStoragePersister: LocalStoragePersister,
    private readonly dataSearchConfService: DataSearchConfigurablesServiceResource,
  ) {
    this.traceSelectorExpanded = false;

    try {
      const saved = this.localStoragePersister.getValue(
        LocalStorageVariables.LS_CONFIGURABLES,
        LocalStorageVariables.LS_DATA_TRACES_SELECTED
      ) as string;
      const ids = JSON.parse(saved ?? '[]') as string[];
      this.pendingRestoreIds = new Set(ids);
    } catch {
      this.pendingRestoreIds.clear();
    }
  }


  public ngOnInit(): void {
    this.subscriptions.push(

      // open and close traceSelector when open and close right bottom sidenav
      this.panelsEvent.invokeGraphPanel.subscribe((sidenavStatus: boolean) => {
        this.traceSelectorExpanded = sidenavStatus;
      }),

      // select trace for specific layerId (used by timeseries popup button)
      this.traceSelector.traceSelectedObs.subscribe((traceSelector) => {
        const layerId = traceSelector[0];
        const traceId = traceSelector[1] ?? '';
        const selected = traceSelector[2] ?? true;
        const trace = this.traceRecord[layerId]?.filter(traceObj => (traceObj.id === traceId));
        if (trace !== undefined && trace.length > 0) {
          this.setSelected(trace[0], selected);
        }

      }),

    );
  }


  /** Returns an ARray of {@link Trace} objects associated with the passed in {@link YAxis} object. */
  public getTracesForYAxis(yAxis: YAxis): Array<Trace> {
    return Object.values(this._selectedTraces).filter(thisTrace => (thisTrace.yAxis === yAxis));
  }

  /**
   * The function `selectTrace` sets the trace selector for a specific layer and trace
   * based on the selected boolean value.
   * @param {string} layerId - LayerId is a string that represents the identifier of a specific layer
   * in the application.
   * @param {Trace} trace - The `trace` parameter is an object that likely contains information about a
   * trace, such as its id, name, type, or other relevant data.
   * @param {boolean} selected - The `selected` parameter in the `selectTrace` function is
   * a boolean value that indicates whether the trace should be selected or not. If `selected` is
   * `true`, the trace will be selected; if `selected` is `false`, the trace will be deselected.
   */
  public selectTrace(layerId: string, trace: Trace, selected: boolean): void {
    this.traceSelector.setTraceSelector(layerId, trace.id, selected);
  }


  /**
   * Selects or deselects a {@link Trace} from the current selection.
   *
   * UI selection is always updated immediately. Persistence to localStorage
   * is performed by filtering the current selection so that only traces whose
   * `originatingConfigurableId` is among the favourite (pinned) configurables
   * stored in LS_DATA_SEARCH_CONFIGURABLES are saved.
   *
   * @param trace    The Trace object.
   * @param selected true to select (add), false to remove (deselect).
   * @param yAxis    Optional Y-axis to share with the selection.
   */
  public setSelected(trace: Trace, selected: boolean, yAxis?: YAxis): void {
    if (selected && this.addIsDisabled) {
      return;
    }

    // Remove if it already exists (so re-select replaces cleanly)
    const existing = this._selectedTraces[trace.id];
    if (existing) {
      delete this._selectedTraces[trace.id];
      existing.setStyle(null);
      existing.yAxis = null;
    }

    // Add if requested
    if (selected) {
      // add the trace
      this._selectedTraces[trace.id] = trace;
      // set styling
      this.styler.assignStyle(trace, Object.values(this._selectedTraces));
      // set yaxis
      trace.yAxis = (null == yAxis) ? trace.generateYAxis() : yAxis;
    }
    // Update UI outputs
    this.setSelectedTraces(Object.values(this._selectedTraces));
  }


  /**
   * Re-persist the currently selected traces to localStorage, keeping only those
   * whose `originatingConfigurableId` belongs to the favourite (pinned) configurables
   * stored in LS_DATA_SEARCH_CONFIGURABLES.
   *
   * IMPORTANT: Do NOT overwrite LS_DATA_TRACES_SELECTED if favourites aren't loaded yet.
   */
    private persistSelectedTracesByFavourites(): void {
    // Collect the IDs of all currently selected Trace objects.
    const allSelectedTraceIds = Object.values(this._selectedTraces).map(t => t.id);

    // Persist all collected IDs to localStorage under LS_DATA_TRACES_SELECTED.
    this.localStoragePersister.set(
      LocalStorageVariables.LS_CONFIGURABLES,
      JSON.stringify(allSelectedTraceIds),
      false,
      LocalStorageVariables.LS_DATA_TRACES_SELECTED
    );
  }


  /** Called after the {@link #traceRecord} variable changes to update the component. */
  /** Called after the {@link #traceRecord} variable changes to update the component. */
  private updateDistributionPlotList(
    traceMap: Map<DataConfigurableDataSearch, null | Array<Trace>>
  ): void {

    // 1) Snapshot previous state (used to detect new data additions)
    const prevTraceRecord = this.traceRecord ? { ...this.traceRecord } : {};

    // 2) Rebuild current state (configurableId -> traces/null)
    this.traceRecord = {};
    traceMap.forEach((traces: null | Array<Trace>, config: DataConfigurable) => {
      this.traceRecord[config.id] = traces;
    });

    // List of configurables in the new state
    const newConfigurables = Array.from(traceMap.keys());
    const allTraces = this.getAllTraces(this.traceRecord);

    // 3) Refresh selected traces:
    //    - If a new instance with the same IDs exists, transfer Y-axis and style.
    //    - If the configurable is still loading (traces == null), keep the old version temporarily.
    const newSelectedTraces = Object.values(this._selectedTraces)
      .map((prevSelected: Trace) => {
        let traceToKeep = allTraces.find((t: Trace) => {
          const sameTrace =
            t.originatingConfigurableId === prevSelected.originatingConfigurableId &&
            t.id === prevSelected.id;

          if (sameTrace) {
            t.yAxis = prevSelected.yAxis;
            t.setStyle(prevSelected.getStyle());
          }
          return sameTrace;
        });

        if (!traceToKeep) {
          const confExists = this.dataSearchConfService
            .getAll()
            .some(conf => conf.id === prevSelected.originatingConfigurableId);

          if (
            prevSelected != null &&
            this.traceRecord[prevSelected.originatingConfigurableId] == null &&
            confExists
          ) {
            traceToKeep = prevSelected;
          }
        }

        return traceToKeep;
      })
      .filter((t): t is Trace => t != null);

    this.setSelectedTraces(newSelectedTraces as Array<Trace>);
    this.configurables = newConfigurables;

    // 5) Auto-expand the trace selector if sidenav is open and new data arrived
    if (this.isRightSidenavOpen() && this.hasNewDataAdded(prevTraceRecord, this.traceRecord)) {
      setTimeout(() => { this.traceSelectorExpanded = true; }, 500);
    }

    // 6) Restore previously persisted selections when their traces become available
    this.restorePendingSelections();

    // 7) Spinner: show ONLY if there are still traces being loaded (null entries)
    const stillHasNull = Object.values(this.traceRecord).some(v => v === null);
    this.loading.emit(stillHasNull);
  }

  /**
   * Checks whether the right-bottom sidenav is currently open.
   */
  private isRightSidenavOpen(): boolean {
    return this.localStoragePersister.getValue(
      LocalStorageVariables.LS_CONFIGURABLES,
      LocalStorageVariables.LS_RIGHT_BOTTOM_SIDENAV
    ) === 'true';
  }

  /**
   * Restores pending trace selections as soon as their data is available.
   */
  private restorePendingSelections(): void {
    if (this.pendingRestoreIds.size === 0) { return; }

    const restorable = this.getAllTraces(this.traceRecord)
      .filter(t => this.pendingRestoreIds.has(t.id));

    if (restorable.length > 0) {
      restorable.forEach(t => {
        if (!this._selectedTraces[t.id]) {
          t.yAxis = t.yAxis ?? t.generateYAxis();
          this.styler.assignStyle(t, Object.values(this._selectedTraces));
          this._selectedTraces[t.id] = t;
        }
        this.pendingRestoreIds.delete(t.id);
      });
      this.setSelectedTraces(Object.values(this._selectedTraces));
    }
  }

  /**
   * Checks if new trace data has been added compared to the previous state.
   * A "new addition" means:
   * - A previously null/undefined configurable now has > 0 traces.
   * - A configurable has more traces than before.
   */
  private hasNewDataAdded(
    prevTraceRecord: Record<string, null | Array<Trace>>,
    currTraceRecord: Record<string, null | Array<Trace>>
  ): boolean {
    for (const [id, curr] of Object.entries(currTraceRecord)) {
      const prev = prevTraceRecord[id];
      const prevLen = Array.isArray(prev) ? prev.length : 0;
      const currLen = Array.isArray(curr) ? curr.length : 0;

      if ((prev == null && currLen > 0) || (currLen > prevLen)) {
        return true;
      }
    }
    return false;
  }

  /** Emits the updated list of selected {@link Trace}s, via {@link #selectedTraces}. */
  private setSelectedTraces(selectedTraces: Array<Trace>): void {
    this.addIsDisabled = (selectedTraces.length === this.MAX_SELECTED_TOGGLES);
    // creates new array with slice to trigger change
    this.selectedTraces.emit(selectedTraces.slice());

    // refresh the variable to trigger change detection
    const traceRecord = {};
    selectedTraces.forEach(trace => traceRecord[trace.id] = trace);
    this._selectedTraces = {
      ...traceRecord,
    };
    // Persist filtered by favourites (pinned configurables)
    this.persistSelectedTracesByFavourites();
  }

  /**
   * Returns an Array of all the traces in the values of the passed in Map object.
   * @param traceMap
   */
  private getAllTraces(traceRecord: Record<string, null | Array<Trace>>): Array<Trace> {
    const traceArrays = Object.values(traceRecord).filter(array => (null != array)) as Array<Array<Trace>>;
    return new Array<Trace>().concat(...traceArrays);
  }

}
