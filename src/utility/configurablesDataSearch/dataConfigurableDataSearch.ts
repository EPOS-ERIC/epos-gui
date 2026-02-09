import { ParameterValue } from 'api/webApi/data/parameterValue.interface';
import { DistributionDetails } from 'api/webApi/data/distributionDetails.interface';
import { Injector } from '@angular/core';
import { DataConfigurableAction, DataConfigurableActionType } from 'utility/configurables/dataConfigurableAction';
import { SearchService } from 'services/search.service';
import { SimpleParameterValue } from 'api/webApi/data/impl/simpleParameterValue';
import { Style } from 'utility/styler/style';
import { DataConfigurableParamValues } from 'utility/configurables/dataConfigurableParamValues';
import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { TemporalRange } from 'api/webApi/data/temporalRange.interface';
import { SimpleBoundingBox } from 'api/webApi/data/impl/simpleBoundingBox';
import { SimpleTemporalRange } from 'api/webApi/data/impl/simpleTemporalRange';
import { ExecutionService } from 'services/execution.service';
import { BehaviorSubject } from 'rxjs';
import { DataConfigurableDataSearchI } from './dataConfigurableDataSearchI.interface';
import { DistributionLevel } from 'api/webApi/data/distributionLevel.interface';
import { SimpleDistributionLevel } from 'api/webApi/data/impl/SimpleDistributionLevel';
import { NotificationService } from 'services/notification.service';
import { Tracker } from 'utility/tracker/tracker.service';
import { TrackerAction, TrackerCategory } from 'utility/tracker/tracker.enum';


export class DataConfigurableDataSearch
  extends DataConfigurableParamValues
  implements DataConfigurableDataSearchI {

  public readonly isDataConfigurableDataSearchLoading: boolean;
  public readonly actions: Array<DataConfigurableAction>;
  public levels: Array<DistributionLevel>;
  public uid: string;
  private readonly pinnedSrc = new BehaviorSubject<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public pinnedObs = this.pinnedSrc.asObservable();


  private layerBboxSrc = new BehaviorSubject<number[] | null>(null);


  private readonly selectedSrc = new BehaviorSubject<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public selectedObs = this.selectedSrc.asObservable();

  constructor(
    injector: Injector,
    distributionDetails: DistributionDetails,
    paramValues: Array<ParameterValue>,
    spatialOverrides?: BoundingBox,
    temporalOverrides?: TemporalRange,
  ) {
    super(injector, distributionDetails, paramValues, spatialOverrides, temporalOverrides);


    const copyUrlAction = new DataConfigurableAction(
      'Copy URL',
      () => this.doCopyUrlAction(),
      () => (!this.changed && this.valid),
    );
    copyUrlAction.setActionTypeAction(DataConfigurableActionType.LINK);

    // set up actions
    this.actions = [
      copyUrlAction,
      new DataConfigurableAction(
        'Set to defaults',
        () => this.doSetToDefaultsAction(),
        () => (!this.loading && !this.sameAsDefaults),
      ),
      new DataConfigurableAction(
        'Apply',
        () => this.doApplyAction(this.getNewParameterValues()),
        () => (!this.loading && this.changed && this.valid),
      ),
    ];

    this.evaluateActionVisibility();
  }
  // should be kept in sync with object "toSimpleObject" method
  public static makeFromSimpleObject(
    object: Record<string, unknown>,
    injector: Injector,
    context: string,
  ): Promise<null | DataConfigurableDataSearch> {
    const searchService = injector.get(SearchService);
    return Promise.resolve<null | DataConfigurableDataSearch>(searchService.getDetailsById(String(object.id), context)
      .then((dist: DistributionDetails) => {
        const paramValues = (object.paramValues as Array<Record<string, unknown>>)
          .map((obj: Record<string, unknown>) => new SimpleParameterValue(String(obj.name), String(obj.value)));
        const layerBbox: Array<number> = [];
        const levels = (object.levels as Array<Record<string, unknown>>)
          .map((obj: Record<string, unknown>) => new SimpleDistributionLevel(Number(obj.id), String(obj.value)));
        return new DataConfigurableDataSearch(injector, dist, paramValues)
          .setStyle(Style.makeFromSimpleObject(object.style as Record<string, string | number>))
          .setPinned(!!object.pinned)
          .setSelected(!!object.selected)
          .setSpatialLinked(!!object.spatialLinked)
          .setTemporalLinked(!!object.temporalLinked)
          .setShowSpatialCoverage(!!object.showSpatialCoverage)
          .setLevels(levels)
          .setLayerBbox(layerBbox);
      })
      .catch(() => null)
    );
  }

  public setLayerBbox(layerBbox: Array<number> | null){
    this.layerBboxSrc.next(layerBbox);
    return this;
  }
  public getLayerBbox(){
    return this.layerBboxSrc.value;
  }


  public isPinned(): boolean {
    return this.pinnedSrc.value;
  }
  public setPinned(pinned: boolean): this {
    this.pinnedSrc.next(pinned);
    return this;
  }

  public setLevels(levels: Array<DistributionLevel>): this {
    this.levels = levels;
    return this;
  }

  public getLevels(): Array<DistributionLevel> {
    return this.levels;
  }

  public isSelected(): boolean {
    return this.selectedSrc.value;
  }
  public setSelected(selected: boolean): this {
    this.selectedSrc.next(selected);
    return this;
  }
public getUid(): string {
  return this.uid;
}


  public updateLinkedSpatialParams(boundingBox: BoundingBox, newParams = true): void {
    if (this.isSpatialLinked()) {
      const paramDefs = this.getParameterDefinitions();
      const updatedNewParams = paramDefs.updateSpatialParamsUsingBounds(boundingBox, this.getNewParameterValues());
      if (newParams || (!SimpleBoundingBox.isDifferent(this.getCurrentSpatialBounds(), boundingBox))) {
        this.setNewParams(updatedNewParams);
      } else {
        const updatedCurrentParams = paramDefs.updateSpatialParamsUsingBounds(boundingBox, this.currentParamValues.slice());
        this.doApplyAction(updatedCurrentParams, updatedNewParams);
      }
    }
  }

  public updateLinkedTemporalParams(tempRange: TemporalRange, newParams = true): void {
    if (this.isTemporalLinked()) {
      const paramDefs = this.getParameterDefinitions();
      const updatedNewParams = paramDefs.updateTemporalParamsUsingRange(tempRange, this.getNewParameterValues());
      if (newParams || (!SimpleTemporalRange.isDifferent(this.getCurrentTemporalRange(), tempRange))) {
        this.setNewParams(updatedNewParams);
      } else {
        const updatedCurrentParams = paramDefs.updateTemporalParamsUsingRange(tempRange, this.currentParamValues.slice());
        this.doApplyAction(updatedCurrentParams, updatedNewParams);
      }
    }
  }

  // should be kept in sync with static "makeFromSimpleObject" method
  public toSimpleObject(): Record<string, unknown> {
    return {
      id: this.id,
      paramValues: this.currentParamValues.slice(),
      style: this.getStyle(),
      pinned: this.isPinned(),
      selected: this.isSelected(),
      spatialLinked: this.isSpatialLinked(),
      temporalLinked: this.isTemporalLinked(),
      showSpatialCoverage: this.getShowSpatialCoverage(),
      levels: this.getLevels(),
      layerBbox: this.getLayerBbox(),
      uid: this.uid,
    };
  }

  /**
   * The function `getOriginatorUrl` returns a promise that resolves to either `null` or a string
   * representing the originator URL.
   * @param [fromNewParamValue=false] - The `fromNewParamValue` parameter is a boolean value that
   * indicates whether to use the new parameter values or the current parameter values. If
   * `fromNewParamValue` is `true`, the method will use the new parameter values; otherwise, it will use
   * the current parameter values.
   * @returns a Promise that resolves to either null or a string.
   */
  public getOriginatorUrl(fromNewParamValue = false): Promise<null | string> {
    const exe = this.injector.get(ExecutionService);

    const paramValues = fromNewParamValue ? this.getNewParameterValues().slice() : this.currentParamValues.slice();
    return exe.getOriginatorUrl(this.distributionDetails, this.getParameterDefinitions(), paramValues);
  }

  /**
   * The function `doApplyAction` sets loading to true, creates a new `DataConfigurableDataSearch`
   * object with updated parameters, and reloads the data with the new configuration.
   * @param newCurrentParams - The `newCurrentParams` parameter is an array of `ParameterValue` objects
   * that are used as input for the `doApplyAction` method.
   * @param [newNewParams] - The `newNewParams` parameter in the `doApplyAction` method is an optional
   * array of `ParameterValue` objects. It is used to update the parameters of a
   * `DataConfigurableDataSearch` instance along with the `newCurrentParams`. If `newNewParams` is
   * provided, it
   * @returns The method `doApplyAction` is returning an instance of `DataConfigurableDataSearch`.
   */
  protected doApplyAction(
    newCurrentParams: Array<ParameterValue>,
    newNewParams?: Array<ParameterValue>,
  ): DataConfigurableDataSearch {
    this.setLoading(true);

    const tracker = this.injector.get(Tracker);
    tracker.trackEvent(TrackerCategory.DISTRIBUTION, TrackerAction.APPLY_PARAMETERS, this.distributionDetails.getDomainCode() + Tracker.TARCKER_DATA_SEPARATION + this.distributionDetails.getName());

    const newConfigurable = new DataConfigurableDataSearch(
      this.injector,
      this.distributionDetails,
      newCurrentParams,
    )
      .setStyle(this.getStyle())
      .setPinned(this.isPinned())
      .setSelected(this.isSelected())
      .setSpatialLinked(this.isSpatialLinked())
      .setTemporalLinked(this.isTemporalLinked())
      .setShowSpatialCoverage(this.getShowSpatialCoverage())
      .setLevels(this.getLevels())
      .setLayerBbox(this.getLayerBbox());

    if (null != newNewParams) {
      newConfigurable.setNewParams(newNewParams);
    }

    this.reload(newConfigurable);

    return newConfigurable;
  }

  private doSetToDefaultsAction(): void {
    this.setParameterValuesToDefaults();
    this.reload();
  }

  private doCopyUrlAction(): void {
    if ((null != this.distributionDetails) && (null != this.injector)) {

      void this.getOriginatorUrl()
        .then(url => {
          this.copyToClipboardWithDelay(url);
        });
    }

  }


  private copyToClipboardWithDelay(text: null | string): void {
    console.log(text);

    if (null != text) {
      // try to add to clipboard (fails in some ie)
      setTimeout(() => {

        let success = false;
        try {
          success = this.copyToClipboard(text);
        } finally {
          if (null != this.injector) {
            const notifier = this.injector.get(NotificationService);
            if (success) {
              notifier.sendNotification('Successfully copied URL', 'x', NotificationService.TYPE_SUCCESS, 5000);
            } else {
              notifier.sendNotification('Failed to copy URL', 'x', NotificationService.TYPE_ERROR, 5000);
            }
          }
        }
      }, 100);
    }
  }

  private copyToClipboard(val: string): boolean {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    const success = document.execCommand('copy');
    document.body.removeChild(selBox);
    return success;
  }

}
