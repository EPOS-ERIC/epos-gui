import { Component, OnInit, Output, EventEmitter, Input, ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { DataConfigurable } from 'utility/configurables/dataConfigurable.abstract';
import { ExecutionService } from 'services/execution.service';
import { Trace } from './objects/trace';
import { DistributionFormatType } from 'api/webApi/data/distributionFormatType';
import { CovJsonData } from './objects/data/covJsonData';
import { YAxisDisplayType } from './objects/yAxisDisplayType.enum';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';
import { ResultsPanelService } from 'pages/dataPortal/services/resultsPanel.service';
import { DataConfigurableDataSearch } from 'utility/configurablesDataSearch/dataConfigurableDataSearch';
import { DataSearchConfigurablesServiceResource } from '../dataPanel/services/dataSearchConfigurables.service';
import { ApiService } from 'api/api.service';
import { TraceSelectorService } from './traceSelector/traceSelector.service';
import { NotificationService } from 'components/notification/notification.service';
import { DataConfigurableDataSearchI } from 'utility/configurablesDataSearch/dataConfigurableDataSearchI.interface';
import { DataConfigurableI } from 'utility/configurables/dataConfigurableI.interface';
import { MapInteractionService } from 'utility/eposLeaflet/services/mapInteraction.service';

/**
 * Wrapper for the visualization graphing functionality.
 * Creates a list of {@link Trace}s from graphable {@link DataConfigurable} objects.
 *
 * Watches the Input {@link #dataConfigurablesArraySource}, filters the items that are "graphable",
 * and passes those to the {@link TraceSelector} component.
 *
 * Selected traces from the {@link TraceSelector} component are passed back here rto be relayed
 * to the {@link GraphDisplay} components;
 */
@Unsubscriber('subscriptions')
@Component({
  selector: 'app-graph-panel',
  templateUrl: './graphPanel.component.html',
  styleUrls: ['./graphPanel.component.scss'],
})
export class GraphPanelComponent implements OnInit {

  @Input() plotlyVHeight: number | boolean = false;

  /** The full Array of {@link DataConfigurables} from the pinned and selected items. */
  /** Output observable to close the sidenav from the graph visulisation component */
  @Output() closeSideNav = new EventEmitter<void>();

  /** A Map associating a {@link DataConfigurable} with the {@link Trace}s that were derived from it. */
  public currentTraces = new Map<DataConfigurableDataSearch, null | Array<Trace>>();
  /** The {@link Trace}s that have been selected in the {@link TraceSelector} component. */
  public selectedTraces = new Array<Trace>();
  /** Whether the loading spinner should show */
  public loading = false;

  public selectedId: null | string;

  /** Local variable allowing the display access to the {@link YAxisDisplayType} Enumerator. */
  public readonly DISPLAY_TYPES = YAxisDisplayType;
  /** The currently selected {@link YAxisDisplayType} value. */
  public selectedDisplayType = YAxisDisplayType.STACK;

  /** Variable for keeping track of subscriptions, which are cleaned up by Unsubscriber */
  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();
  private dataConfigurablesArraySource = new BehaviorSubject<Array<DataConfigurableDataSearchI>>([]);

  /** Constructor. */
  constructor(
    private readonly executionService: ExecutionService,
    private readonly panelsEvent: PanelsEmitterService,
    private readonly resultPanelService: ResultsPanelService,
    private readonly notificationService: NotificationService,
    private readonly configurables: DataSearchConfigurablesServiceResource,
    private readonly apiService: ApiService,
    private readonly traceSelector: TraceSelectorService,
    private readonly cd: ChangeDetectorRef,
    private readonly mapInteractionService: MapInteractionService
  ) {
  }

  /**
   * Calls {@link #initSubscriptions}.
   */
  public ngOnInit(): void {
    this.initSubscriptions();
  }

  /**
   * Called when {@link Trace}s are selected or deselected in the {@link TraceSelector} component.
   * @param traces An Array of the currently selected {@link Trace} objects.
   */
  public setSelectedTraces(traces: Array<Trace>): void {
    this.selectedTraces = traces;
  }

  public setLoading(loading: boolean): void {
    this.loading = loading;
    this.cd.detectChanges();
  }

  /**
   * Called by the display to update the {@link selectedDisplayType} and change the
   * display type.
   */
  public setDisplayType(changeEvent: MatButtonToggleChange): void {
    this.selectedDisplayType = changeEvent.value as YAxisDisplayType;
  }

  /**
   * Called when user clicks on close button in template and emits
   * observable which is listened out for on data page.
   */
  public closeNav(): void {
    this.closeSideNav.emit();
  }

  /**
   * Starts watching the input {@link DataConfigurable}s and filters the ones that
   * can be used in the graph.  Also, watches for display changes to th
   */
  private initSubscriptions(): void {
    this.subscriptions.push(

      this.configurables.watchAll().subscribe(() => {
        this.updateConfigs();
      }),

      this.dataConfigurablesArraySource.subscribe((dataConfigurables: Array<DataConfigurableI>) => {

        if (dataConfigurables != null) {
          const graphableConfigurables = dataConfigurables.filter((thisConfig: DataConfigurable) => {
            return thisConfig.isGraphable;
          });

          // remove the configurables that have been remove in the interface
          Array.from(this.currentTraces.keys()).forEach((thisConfig: DataConfigurableDataSearch) => {
            if (!graphableConfigurables.includes(thisConfig)) {
              this.currentTraces.delete(thisConfig);
            }
          });

          graphableConfigurables.forEach((thisConfig: DataConfigurableDataSearch) => {
            if (!Array.from(this.currentTraces.keys()).includes(thisConfig)) {
              // set to null instead of empty array to indicate waiting for data response
              this.currentTraces.set(thisConfig, null);
              void this.fetchDataAndExtractTracesFromConfigurable(thisConfig)
                .then((traces: Array<Trace>) => {
                  this.currentTraces.set(thisConfig, traces);
                  this.triggerChangedTraces();
                });
            }
          });
          this.triggerChangedTraces();

          this.resultPanelService.setCounterGraph(graphableConfigurables.length);
          this.loading = false;

        }
      }),
      this.panelsEvent.invokeGraphPanelOpen.subscribe((itemId: string) => {
        this.selectedId = itemId;
      }),
      this.panelsEvent.timeSeriesPopupLayerIdUrlObs.subscribe((value: [string, string | null]) => {
        const id = value[0];
        const url = value[1];

        let thisConfig = this.configurables.get(id);

        // if at this point configurable is 'null' and we are triggering Graph execution from a WMTS sub-layer, assign the 'originatorConfigurable' as Config
        const wmtsLayerStorage = this.mapInteractionService.wmtsLayerStorage.value;
        if(thisConfig == null && wmtsLayerStorage && wmtsLayerStorage.has(id)){
          const originatorConfig = wmtsLayerStorage.get(id)?.originatorConfig;
          if(originatorConfig != null){
            thisConfig = this.configurables.get(originatorConfig);
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-shadow
        const graphableConfigurables = this.configurables.getAll().filter((thisConfig) => {
          return thisConfig.isGraphable;
        });

        if (url !== null) {
          void this.apiService.executeUrl(url).then((data) => {
            this.loading = true;
            void data.text().then((json) => {
              const traces = new CovJsonData(id).createTraces(JSON.parse(json) as Record<string, unknown>);

              this.currentTraces.set(thisConfig as DataConfigurableDataSearch, traces);
              this.triggerChangedTraces();

              this.resultPanelService.setCounterGraph(graphableConfigurables.length + 1);

              this.panelsEvent.graphPanelOpen(id, false);

              setTimeout(() => { this.traceSelector.setTraceSelector(id, traces[0].id, true); }, 100);

            });
          });
        } else {
          this.currentTraces.delete(thisConfig as DataConfigurableDataSearch);
          this.resultPanelService.setCounterGraph(graphableConfigurables.length - 1);
        }
      }),
    );
  }

  /**
* Updates the visulisation configurables array source with the selected item, or an empty array if nothing is
* selected
*/
  private updateConfigs(): void {
    const allConfigurables = this.configurables.getAll().slice();
    this.ensureReloadFuncSet(allConfigurables);
    this.dataConfigurablesArraySource.next(allConfigurables);
  }

  private ensureReloadFuncSet(configurables: Array<DataConfigurableDataSearchI>): void {
    // ensure reset func set
    configurables.forEach((configurable: DataConfigurableDataSearchI) => {
      if (configurable instanceof DataConfigurableDataSearch) {
        configurable.setTriggerReloadFunc((configurableToUpdate: DataConfigurableDataSearch) => {
          this.configurables.replaceOrAdd(configurableToUpdate, true);
        });
      }
    });
  }

  /**
   * Called when the {@link currentTraces} are updated to trigger updating of the
   * {@link TraceSelector} and {@link GraphDisplay} components;
   */
  private triggerChangedTraces(): void {
    const newMap = new Map<DataConfigurableDataSearch, Array<Trace>>();
    Array.from(this.currentTraces.keys()).forEach((configurable: DataConfigurableDataSearch) => {
      this.loading = (this.loading || (null == this.currentTraces.get(configurable)));
      newMap.set(configurable, this.currentTraces.get(configurable)!);
    });
    this.currentTraces = newMap;
  }

  /**
   * Calls the {@link ExecutionService#executeDistributionFormat} then converts the data
   * into {@link Trace}s, which are returned in a promise.
   * @param dataConfigurable A {@link DataConfigurable} that is the source of data
   * displayable on the graph.
   */
  private fetchDataAndExtractTracesFromConfigurable(dataConfigurable: DataConfigurable): Promise<Array<Trace>> {
    const distributionFormat = dataConfigurable.getGraphableFormats()[0];

    // call out and fetch data
    return this.executionService.executeDistributionFormat(
      dataConfigurable.getDistributionDetails(),
      distributionFormat,
      dataConfigurable.getParameterDefinitions(),
      dataConfigurable.currentParamValues.slice()
    ).then((data: unknown) => {
      let traces = new Array<Trace>();

      switch (true) {
        case (DistributionFormatType.is(distributionFormat.getFormat(), DistributionFormatType.APP_EPOS_COV_JSON)):
        case (DistributionFormatType.is(distributionFormat.getFormat(), DistributionFormatType.APP_EPOS_GRAPH_COV_JSON)):
        case (DistributionFormatType.is(distributionFormat.getFormat(), DistributionFormatType.APP_COV_JSON)):
          traces = new CovJsonData(dataConfigurable.id).createTraces(data as Record<string, unknown>);

          // no data
          if (traces.length === 0 && this.configurables.getSelected()?.id === dataConfigurable.id) {
            this.sendWarning(dataConfigurable.id);
          }

          break;
        default: console.warn('Unexpected data format for traces', distributionFormat.getFormat());
      }

      return traces;
    })

      .catch((e) => {
        this.sendWarning(dataConfigurable.id);
        return [];
      });

  }

  private sendWarning(id: string): void {
    this.notificationService.sendDistributionNotification({
      id: id,
      title: 'Warning',
      message: NotificationService.MESSAGE_NO_DATA,
      type: NotificationService.TYPE_WARNING as string,
      showAgain: false,
    });
  }
}
