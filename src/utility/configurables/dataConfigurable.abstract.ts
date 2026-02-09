import { ParameterValue } from 'api/webApi/data/parameterValue.interface';
import { DataConfigurableAction } from './dataConfigurableAction';
import { DistributionDetails } from 'api/webApi/data/distributionDetails.interface';
import { Style } from 'utility/styler/style';
import { Observable, BehaviorSubject } from 'rxjs';
import { SpatialRange } from 'api/webApi/data/spatialRange.interface';
import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { TemporalRange } from 'api/webApi/data/temporalRange.interface';
import { ParameterDefinitions } from 'api/webApi/data/parameterDefinitions.interface';
import { DistributionFormat } from 'api/webApi/data/distributionFormat.interface';
import { DataConfigurableI } from './dataConfigurableI.interface';
import { DistributionType } from 'api/webApi/data/distributionType.enum';

/**
 * This is the base class of all configurable items; items that represents the
 * configuration that is applied to a search result (Distribution) in order to retrieve data.
 *
 */
export abstract class DataConfigurable implements DataConfigurableI {
  /** Copied from {@link DistributionDetails#isMappable} */
  public readonly isMappable: boolean;
  /** Copied from {@link DistributionDetails#isDownloadable} */
  public readonly isDownloadable: boolean;
  /** Copied from {@link DistributionDetails#isGraphable} */
  public readonly isGraphable: boolean;
  /** Copied from {@link DistributionDetails#isTabularable} */
  public readonly isTabularable: boolean;

  public readonly context: string;

  /** Whether all {@link #newParamValues} are valid or not. */
  public valid = true;
  /** Whether any of the {@link #newParamValues} have changed or not. */
  public changed = false;
  /** Whether all of the {@link #newParamValues} are the same as the defaults or not. */
  public sameAsDefaults = true;
  /** Whether the {@link #newParamValues} are in the process of being applied or not. */
  public loading = false;

  /** An array of {@link DataConfigurableAction}s that can be applied to this configurable. */
  public readonly actions: null | Array<DataConfigurableAction>;
  /**
   * An array of {@link ParameterValue} objects representing values that have been applied to
   * any visualizations etc.
   */
  public readonly currentParamValues: Array<ParameterValue>;

  /** the object's identifier. */
  public readonly id: string;

  public readonly uid:  string;
  /** the object's name. */
  public readonly name: string;

  /** The {@link ParameterDefinitions} retrieved from a {@link DistributionDetails} item. */
  private readonly parameterDefinitions: ParameterDefinitions;

  /** Whether a user has selected to show the spatial coverage for this item or not. */
  private readonly showSpatialCoverageSrc = new BehaviorSubject<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public showSpatialObs = this.showSpatialCoverageSrc.asObservable();

  /** An rxjs/BehaviorSubject holding the {@link Style} object for this configurable. */
  private readonly styleSource = new BehaviorSubject<null | Style>(null);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public readonly styleObs = this.styleSource.asObservable();

  /** A function that will trigger a reload of visual representations of this object. */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  protected triggerReloadFunc: (configurable: DataConfigurable) => void;

  /**
   * An array of {@link ParameterValue} objects that have been changed and have not yet been
   * applied to any visualizations etc.
   */
  private newParamValues: Array<ParameterValue>;

  /** Whether any spatial parameter values in this configuration are linked to page-wide values. */
  private spatialLinked = false;
  /** Whether any temporal parameter values in this configuration are linked to page-wide values. */
  private temporalLinked = false;


  /**
   * Initialises the object, spatially and temporally linking if possible.
   * @param distributionDetails The detailed search result (distribution) object that a
   * configuration is applied to.
   * @param paramValues An array of initial parameter values.
   * @param spatialOverrides Overriding spatial parameter values.
   * @param temporalOverrides Overriding temporal parameter values.
   */
  constructor(
    /** The detailed search result (distribution) object that a configuration is applied to. */
    public readonly distributionDetails: DistributionDetails,
    paramValues: Array<ParameterValue>,
    spatialOverrides?: BoundingBox,
    temporalOverrides?: TemporalRange,
  ) {
    this.id = distributionDetails.getIdentifier();
    this.uid = distributionDetails.getUid();
    this.name = distributionDetails.getName();
    this.isMappable = distributionDetails.isMappable;
    this.isGraphable = distributionDetails.isGraphable;
    this.isDownloadable = distributionDetails.isDownloadable;
    this.isTabularable = distributionDetails.isTabularable;

    this.parameterDefinitions = distributionDetails.getParameters();

    // we set to linked by default, if it's possible to link them

    this.spatialLinked = this.parameterDefinitions.hasSpatialParameters();
    if (this.spatialLinked && (null != spatialOverrides)) {
      paramValues = this.parameterDefinitions.updateSpatialParamsUsingBounds(spatialOverrides, paramValues);
    }

    this.temporalLinked = this.parameterDefinitions.hasTemporalParameters();
    if (this.temporalLinked && (null != temporalOverrides)) {
      paramValues = this.parameterDefinitions.updateTemporalParamsUsingRange(temporalOverrides, paramValues);
    }

    this.currentParamValues = paramValues.slice();
    this.setNewParams(paramValues.slice());

  }

  /**
   * Retrieves the {@link DistributionDetails} that this object was created with.
   */
  public getDistributionDetails(): DistributionDetails {
    return this.distributionDetails;
  }

  /**
   * Sets the internal {@link #valid} variable before calling {@link #updateActionsEnabledStatus}.
   * @param valid Whether this object is valid or not.
   */
  public setValid(valid: boolean): this {
    this.valid = valid;
    this.updateActionsEnabledStatus();
    return this;
  }

  /**
   * Sets the internal {@link #loading} variable before calling {@link #updateActionsEnabledStatus}.
   * @param valid Whether this object is loading or not.
   */
  public setLoading(loading: boolean): this {
    this.loading = loading;
    this.updateActionsEnabledStatus();
    return this;
  }

  /**
   * Returns an Array of {@link DistributionFormat}s available on this configurable, that are
   * classified as mappable.
   */
  public getMappableableFormats(): Array<DistributionFormat> {
    return this.distributionDetails.getMappableFormats();
  }
  /**
   * Returns an Array of {@link DistributionFormat}s available on this configurable, that are
   * classified as downloadable.
   */
  public getDownloadableFormats(): Array<DistributionFormat> {
    return this.distributionDetails.getDownloadableFormats();
  }

  /**
   * Returns an Array of {@link DistributionFormat}s available on this configurable, that are
   * classified as graphable.
   */
  public getGraphableFormats(): Array<DistributionFormat> {
    return this.distributionDetails.getGraphableFormats();
  }

  /**
   * The function `setStyle` updates the style of an element if it is different from the current style
   * or if forced to do so.
   * @param {null | Style} style - The `style` parameter in the `setStyle` method can be either `null`
   * or an object of type `Style`.
   * @param [force=false] - The `force` parameter in the `setStyle` method is a boolean parameter with
   * a default value of `false`. It is used to determine whether the style should be set even if it is
   * the same as the current style. If `force` is set to `true`, the style will be
   * @returns The method `setStyle` is returning `this`, which allows for method chaining.
   */
  public setStyle(style: null | Style, force = false): this {
    if (style !== this.getStyle() || force) {
      this.styleSource.next(style);
    }
    return this;
  }
  /**
   * Returns the style in {@link #styleSource}.
   */
  public getStyle(): null | Style {
    return this.styleSource.getValue();
  }
  /**
   * Returns an rxjs/Observable object from {@link #styleSource}, containing the current
   * {@link style}.
   * @deprecated use styleobs instead
   */
  public watchStyle(): Observable<null | Style> {
    return this.styleSource.asObservable();
  }

  /**
   * The function `setNewParams` updates parameter values and related properties, and returns the
   * instance for chaining.
   * @param newParamValues - An array of new parameter values that will be used to update the current
   * parameter values.
   * @returns The `setNewParams` method is returning `this`, which refers to the current instance of
   * the class.
   */
  public setNewParams(newParamValues: Array<ParameterValue>): this {
    this.newParamValues = newParamValues.slice();
    this.changed = !this.paramValuesSame(this.currentParamValues, this.newParamValues);
    this.sameAsDefaults = this.paramsSameAsDefaults();
    this.updateActionsEnabledStatus();

    return this;
  }

  /** returns the value of the the {@link #spatialLinked} variable. */
  public isSpatialLinked(): boolean {
    return this.spatialLinked;
  }
  /**
   * Sets the value of the the {@link #spatialLinked} variable and calls {@link reload}.
   * @param linked Whether spatially linked or not.
   */
  public setSpatialLinked(linked: boolean): this {
    this.spatialLinked = linked;
    this.reload();
    return this;
  }
  public getCurrentSpatialBounds(): BoundingBox {
    return this.parameterDefinitions.getSpatialBounds(Array.from(this.currentParamValues.values()));
  }
  public getNewSpatialBounds(): BoundingBox {
    return this.parameterDefinitions.getSpatialBounds(this.newParamValues);
  }

  public isTemporalLinked(): boolean {
    return this.temporalLinked;
  }
  public setTemporalLinked(linked: boolean): this {
    this.temporalLinked = linked;
    this.reload();
    return this;
  }
  public getCurrentTemporalRange(): TemporalRange {
    return this.parameterDefinitions.getTemporalRange(Array.from(this.currentParamValues.values()));
  }
  public getNewTemporalRange(): TemporalRange {
    return this.parameterDefinitions.getTemporalRange(this.newParamValues);
  }

  public setTriggerReloadFunc(func: (configurable: DataConfigurable) => void): this {
    this.triggerReloadFunc = func;
    return this;
  }

  /**
   * The `reload` function in TypeScript triggers a reload with optional new configuration after a
   * delay.
   * @param {DataConfigurable} [newConfigurable] - The `newConfigurable` parameter in the `reload`
   * method is an optional parameter of type `DataConfigurable`. It is used to provide a new
   * configuration for reloading data. If a `newConfigurable` object is provided, it will be used for
   * reloading data; otherwise, the method will
   * @returns The `reload` method is returning `this`, which refers to the instance of the class on
   * which the method is being called.
   */
  public reload(newConfigurable?: DataConfigurable): this {
    if (null == this.triggerReloadFunc) {
    } else {
      setTimeout(() => {
        this.triggerReloadFunc((newConfigurable == null) ? this : newConfigurable);
      }, 0);
    }
    return this;
  }

  public setShowSpatialCoverage(show: boolean): this {
    this.showSpatialCoverageSrc.next(show);
    this.reload();
    return this;
  }

  public getShowSpatialCoverage(): boolean {
    return this.showSpatialCoverageSrc.value;
  }

  public getSpatialCoverage(): null | SpatialRange {
    return this.distributionDetails.getSpatialRange();
  }

  /**
   * Retrieves the {@link ParameterDefinitions} from the {@link DistributionDetails} that this
   * object was created with.
   */
  public getParameterDefinitions(): ParameterDefinitions {
    return this.parameterDefinitions;
  }
  /**
   * Retrieves the {@link #newParamValues} variable.
   */
  public getNewParameterValues(): Array<ParameterValue> {
    return this.newParamValues;
  }

  public isOnlyDownloadable(): boolean {
    return this.getDistributionDetails().getType() === DistributionType.DOWNLOADABLE_FILE;
  }

  /**
   * Sets the {@link #newParamValues} variable to a copy of the {@link #currentParamValues}
   * variable, as it was after initialisation.
   */
  protected resetParameterValues(): void {
    this.setNewParams(this.currentParamValues.slice());
  }
  /**
   * Sets the {@link #newParamValues} variable to the default values obtained from the
   * {@link #distributionDetails} object.
   */
  protected setParameterValuesToDefaults(): void {
    let updatedParamValues = this.distributionDetails.getParameters().getDefaultParameterValues();

    if (this.isSpatialLinked()) {
      updatedParamValues = this.parameterDefinitions.updateSpatialParamsUsingBounds(this.getCurrentSpatialBounds(), updatedParamValues);
    }
    if (this.isTemporalLinked()) {
      updatedParamValues = this.parameterDefinitions.updateTemporalParamsUsingRange(this.getCurrentTemporalRange(), updatedParamValues);
    }
    this.setNewParams(updatedParamValues);
  }

  /**
   * Calls the {@link DataConfigurableAction#updateEnabledStatus} function on all {@link #actions}
   * using the {@link #valid}, {@link #changed} and {@link #loading} values.
   */
  protected updateActionsEnabledStatus(): void {
    if (null != this.actions) {
      this.actions.forEach((action: DataConfigurableAction) => {
        action.updateEnabledStatus(this.valid, this.changed, this.loading);
      });
    }
  }
  /**
   * Calls the {@link DataConfigurableAction#updateVisibleStatus} function on all {@link #actions}.
   */
  protected evaluateActionVisibility(): void {
    if (null != this.actions) {
      this.actions.forEach((action: DataConfigurableAction) => {
        action.updateVisibleStatus();
      });
    }
  }
  /**
   * This function compares two Arrays of {@link ParameterValue}s.
   * @param params1 First set of ParameterValues.
   * @param params2 Second set of ParameterValues.
   * @return true if all values in params1 are equivalent to the item with the same key in params2.
   * As default value on param definitions are now set to "" on init if not set,
   * ths number of param values should be constant.
   */
  protected paramValuesSame(params1: Array<ParameterValue>, params2: Array<ParameterValue>): boolean {
    const allSame = params1.every((param1: ParameterValue) => {
      const paramDef = this.parameterDefinitions.getParameter(param1.name);
      const param2 = params2.find((thisParam: ParameterValue) => (param1.name === thisParam.name));
      const param2Value = (param2 != null) ? param2.value : '';
      let same = true;
      if (paramDef !== undefined) {
        same = paramDef.areValuesSame(param1.value, param2Value);
      }
      return same;
    });
    return allSame;
  }
  protected paramsSameAsDefaults(): boolean {
    let returnVal = true;
    const paramDefs = this.getParameterDefinitions();
    if (null != paramDefs) {
      let paramValues = paramDefs.getDefaultParameterValues();
      if (this.isSpatialLinked()) {
        // filter out spatial values
        paramValues = paramDefs.filterOutSpatialParamValues(paramValues);
      }
      if (this.isTemporalLinked()) {
        // filter out spatial values
        paramValues = paramDefs.filterOutTemporalParamValues(paramValues);
      }

      returnVal = this.paramValuesSame(paramValues, this.getNewParameterValues());
    }
    return returnVal;
  }

}
