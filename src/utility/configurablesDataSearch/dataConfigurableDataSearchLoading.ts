import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { DistributionDetails } from 'api/webApi/data/distributionDetails.interface';
import { DistributionFormat } from 'api/webApi/data/distributionFormat.interface';
import { DistributionLevel } from 'api/webApi/data/distributionLevel.interface';
import { ParameterDefinitions } from 'api/webApi/data/parameterDefinitions.interface';
import { ParameterValue } from 'api/webApi/data/parameterValue.interface';
import { SpatialRange } from 'api/webApi/data/spatialRange.interface';
import { TemporalRange } from 'api/webApi/data/temporalRange.interface';
import { BehaviorSubject } from 'rxjs';
import { DataConfigurable } from 'utility/configurables/dataConfigurable.abstract';
import { DataConfigurableAction } from 'utility/configurables/dataConfigurableAction';
import { Style } from 'utility/styler/style';
import { DataConfigurableDataSearchI } from './dataConfigurableDataSearchI.interface';

// only used as a placeholder while calling out for the distribution details
// before making a real DataConfigurableDataSearch
export class DataConfigurableDataSearchLoading implements DataConfigurableDataSearchI {
  public readonly name = 'Loading';

  public readonly loading = true;

  /** An rxjs/BehaviorSubject holding the {@link Style} object for this configurable. */
  public readonly currentParamValues = new Array<ParameterValue>();

  public readonly isMappable = false;
  public readonly isGraphable = false;
  public readonly isDownloadable = false;
  public readonly isTabularable = false;
  public readonly context: string;

  public levels: Array<DistributionLevel>;

  public layerBbox: Array<number>;

  public readonly actions: null | Array<DataConfigurableAction> = null;
  public readonly showSpatialObs = new BehaviorSubject<boolean>(false).asObservable();

  private readonly pinned = false;
  private readonly selected = true;

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public readonly pinnedObs = new BehaviorSubject<boolean>(this.pinned).asObservable();
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public readonly selectedObs = new BehaviorSubject<boolean>(this.selected).asObservable();


  private readonly styleSource = new BehaviorSubject<null | Style>(null);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public readonly styleObs = this.styleSource.asObservable();

  constructor(
    public readonly id: string,
  ) {
  }
  public getDistributionDetails(): DistributionDetails {
    throw new Error('Method not implemented.');
  }
  public setValid(valid: boolean): this {
    return this;
  }
  public getMappableableFormats(): DistributionFormat[] {
    return [];
  }
  public getDownloadableFormats(): DistributionFormat[] {
    return [];
  }
  public getGraphableFormats(): DistributionFormat[] {
    return [];
  }
  public setNewParams(newParamValues: ParameterValue[]): this {
    return this;
  }
  public isSpatialLinked(): boolean {
    return false;
  }
  public setSpatialLinked(linked: boolean): this {
    return this;
  }
  public getCurrentSpatialBounds(): BoundingBox {
    throw new Error('Method not implemented.');
  }
  public getNewSpatialBounds(): BoundingBox {
    throw new Error('Method not implemented.');
  }
  public isTemporalLinked(): boolean {
    return false;
  }
  public setTemporalLinked(linked: boolean): this {
    throw new Error('Method not implemented.');
  }
  public getCurrentTemporalRange(): TemporalRange {
    throw new Error('Method not implemented.');
  }
  public getNewTemporalRange(): TemporalRange {
    throw new Error('Method not implemented.');
  }
  public setTriggerReloadFunc(func: (configurable: DataConfigurable) => void): this {
    throw new Error('Method not implemented.');
  }
  public reload(newConfigurable?: DataConfigurable): this {
    throw new Error('Method not implemented.');
  }
  public setShowSpatialCoverage(show: boolean): this {
    return this;
  }
  public getShowSpatialCoverage(): boolean {
    return false;
  }
  public getSpatialCoverage(): null | SpatialRange {
    return null;
  }
  public getParameterDefinitions(): ParameterDefinitions {
    throw new Error('Method not implemented.');
  }
  public getNewParameterValues(): ParameterValue[] {
    return [];
  }

  public isPinned(): boolean {
    return this.pinned;
  }
  public setPinned(pinned: boolean): this {
    return this;
  }

  public isSelected(): boolean {
    return this.selected;
  }
  public setSelected(selected: boolean): this {
    return this;
  }
  public setLoading(): this {
    throw new Error('Method not implemented.');
  }
  public updateLinkedTemporalParams(tempRange: TemporalRange, newParams = true): void {
    throw new Error('Method not implemented.');
  }

  /**
   * Sets the style in {@link #styleSource} if it is different from the current value.
   * @param style Style object.
   */
  public setStyle(style: null | Style): this {
    if (style !== this.getStyle()) {
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

  public getLevels(): Array<DistributionLevel> {
    return this.levels;
  }

  public setLevels(value: DistributionLevel[]): this {
    this.levels = value;
    return this;
  }

  public getLayerBbox(): Array<number> | null{
    return this.layerBbox;
  }

  public setLayerBbox(coords: Array<number>): this {
    this.layerBbox = coords;
    return this;
  }

  public isOnlyDownloadable(): boolean {
    throw new Error('Method not implemented.');
  }
}
