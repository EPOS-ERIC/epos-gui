import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { DistributionDetails } from 'api/webApi/data/distributionDetails.interface';
import { DistributionFormat } from 'api/webApi/data/distributionFormat.interface';
import { ParameterDefinitions } from 'api/webApi/data/parameterDefinitions.interface';
import { ParameterValue } from 'api/webApi/data/parameterValue.interface';
import { SpatialRange } from 'api/webApi/data/spatialRange.interface';
import { TemporalRange } from 'api/webApi/data/temporalRange.interface';
import { Observable } from 'rxjs';
import { Stylable } from 'utility/styler/stylable.interface';
import { Style } from 'utility/styler/style';
import { DataConfigurable } from './dataConfigurable.abstract';
import { DataConfigurableAction } from './dataConfigurableAction';

export interface DataConfigurableI extends Stylable {
  id: string;
  name: string;
  loading: boolean;
  styleObs: Observable<null | Style>;
  currentParamValues: Array<ParameterValue>;
  readonly actions: null | Array<DataConfigurableAction>;

  readonly showSpatialObs: Observable<boolean>;

  isMappable: boolean;
  isGraphable: boolean;
  isDownloadable: boolean;
  isTabularable: boolean;

  context: string;

  /**
   * Retrieves the {@link DistributionDetails} that this object was created with.
   */
  getDistributionDetails(): DistributionDetails;

  /**
   * Sets the internal {@link #valid} variable before calling {@link #updateActionsEnabledStatus}.
   * @param valid Whether this object is valid or not.
   */
  setValid(valid: boolean): this;

  /**
   * Sets the internal {@link #loading} variable before calling {@link #updateActionsEnabledStatus}.
   * @param valid Whether this object is loading or not.
   */
  setLoading(loading: boolean): this;

  /**
   * Returns an Array of {@link DistributionFormat}s available on this configurable, that are
   * classified as mappable.
   */
  getMappableableFormats(): Array<DistributionFormat>;
  /**
   * Returns an Array of {@link DistributionFormat}s available on this configurable, that are
   * classified as downloadable.
   */
  getDownloadableFormats(): Array<DistributionFormat>;

  /**
   * Returns an Array of {@link DistributionFormat}s available on this configurable, that are
   * classified as graphable.
   */
  getGraphableFormats(): Array<DistributionFormat>;

  /**
   * Sets the {@link #newParamValues} variable. Also:
   * - re-evaluates the {@link #changed} variable
   * - re-evaluates the {@link #sameAsDefaults} variable
   * - calls the {@link #updateActionsEnabledStatus} function to re-evaluate the action statuses
   * @param newParamValues New values to set.
   */
  setNewParams(newParamValues: Array<ParameterValue>): this;

  /** returns the value of the the {@link #spatialLinked} variable. */
  isSpatialLinked(): boolean;
  /**
   * Sets the value of the the {@link #spatialLinked} variable and calls {@link reload}.
   * @param linked Whether spatially linked or not.
   */
  setSpatialLinked(linked: boolean): this;
  getCurrentSpatialBounds(): BoundingBox;
  getNewSpatialBounds(): BoundingBox;

  isTemporalLinked(): boolean;
  setTemporalLinked(linked: boolean): this;
  getCurrentTemporalRange(): TemporalRange;
  getNewTemporalRange(): TemporalRange;

  setTriggerReloadFunc(func: (configurable: DataConfigurable) => void): this;

  reload(newConfigurable?: DataConfigurable): this;

  setShowSpatialCoverage(show: boolean): this;

  getShowSpatialCoverage(): boolean;

  getSpatialCoverage(): null | SpatialRange;

  /**
   * Retrieves the {@link ParameterDefinitions} from the {@link DistributionDetails} that this
   * object was created with.
   */
  getParameterDefinitions(): ParameterDefinitions;
  /**
   * Retrieves the {@link #newParamValues} variable.
   */
  getNewParameterValues(): Array<ParameterValue>;

  isOnlyDownloadable(): boolean;
}
