import { AfterViewInit, ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { OnAttachDetach } from 'decorators/onAttachDetach.decorator';
import { Subscription, BehaviorSubject, } from 'rxjs';
import { ParameterValue } from 'api/webApi/data/parameterValue.interface';
import { ParameterDefinition } from 'api/webApi/data/parameterDefinition.interface';
import { ParameterType } from 'api/webApi/data/parameterType.enum';
import moment from 'moment-es6';
import { SimpleParameterValue } from 'api/webApi/data/impl/simpleParameterValue';
import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { TemporalRange } from 'api/webApi/data/temporalRange.interface';
import { SimpleTemporalRange } from 'api/webApi/data/impl/simpleTemporalRange';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ParameterDefinitions } from 'api/webApi/data/parameterDefinitions.interface';
import { SimpleBoundingBox } from 'api/webApi/data/impl/simpleBoundingBox';
import { NgForm } from '@angular/forms';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { DataConfigurableI } from 'utility/configurables/dataConfigurableI.interface';
import { DataConfigurableActionType } from 'utility/configurables/dataConfigurableAction';
import { DialogService } from 'components/dialog/dialog.service';
import { ParametersDialogService } from 'components/dialog/parametersDialog/parametersDialog.service';
import { ParameterProperty } from 'api/webApi/data/parameterProperty.enum';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { Environment } from 'api/webApi/data/environments/environment.interface';
import { AnalysisConfigurablesService } from 'pages/dataPortal/services/analysisConfigurables.service';
import { DataConfigurationType } from 'utility/configurables/dataConfigurationType.enum';
import { Tracker } from 'utility/tracker/tracker.service';
import { TrackerAction, TrackerCategory } from 'utility/tracker/tracker.enum';



@OnAttachDetach('onAttachComponents')
@Unsubscriber('subscriptions')
@Component({
  selector: 'app-data-configuration',
  templateUrl: './dataConfiguration.component.html',
  styleUrls: ['./dataConfiguration.component.scss'],
})
export class DataConfigurationComponent implements OnInit, AfterViewInit {

  @Input() dataConfigurableSource: BehaviorSubject<null | DataConfigurableI>;
  @Input() showExpandButton: boolean;
  @ViewChild('thisForm', { static: true }) form!: NgForm;

  public readonly PARAMETER_TYPE_ENUM = ParameterType;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  public readonly PARAMETER_OUTPUT_FORMAT_PROPERTY = ParameterProperty.OUTPUT_FORMAT;

  public readonly DATA_CONFIGURATION_TYPE = DataConfigurationType;

  public dataConfigurable: null | DataConfigurableI = null;
  public dataConfigurableActionType = DataConfigurableActionType;
  public isOnlyDownloadable = false;

  public otherParameters = new Array<ParameterDefinition>();
  public currentValues: Record<string, unknown> = {};

  public showLoading = true;

  public spatialBounds: null | BoundingBox;
  public spatialBoundslDisabled = false;

  public hasTemporalRange = false;
  public temporalRangeSource = new BehaviorSubject<TemporalRange>(SimpleTemporalRange.makeUnbounded());
  public temporalControlDisabledSource = new BehaviorSubject<boolean>(false);

  public totPar: number;
  public totParValue: number;
  public showApplyButton = false;

  public environmentSelected: Environment | null = null;

  public serviceDocumentation: string;

  public formType: DataConfigurationType = DataConfigurationType.DATA;

  public searchTerms: { [key: string]: string } = {};
  public filteredAllowedValues: { [key: string]: string[] } = {};

  protected parameterDefinitions: ParameterDefinitions;

  private updateTimeout: NodeJS.Timeout;

  private readonly subscriptions = new Array<Subscription>();

  constructor(
    protected readonly cdr: ChangeDetectorRef,
    protected readonly dialogService: DialogService,
    protected readonly paramsDialogService: ParametersDialogService,
    protected readonly localStoragePersister: LocalStoragePersister,
    protected readonly analysisConfigurables: AnalysisConfigurablesService,
    protected readonly tracker: Tracker,
  ) {
  }

  public ngOnInit(): void {

    this.subscriptions.push(
      this.dataConfigurableSource.subscribe(() => {
        this.resetInputs();
      }),
      this.analysisConfigurables.triggerEnvironmentSelectionObs.subscribe((environment: Environment | null) => {
        this.environmentSelected = environment;
      })
    );
  }

  public ngAfterViewInit(): void {
    this.subscriptions.push(
      this.form.valueChanges!.subscribe((value) => {
        this.updateConfigurableValues();

      }),
      this.form.statusChanges!.subscribe((status) => {
        const valid = ('VALID' === status);
        if (null != this.dataConfigurable) {
          this.dataConfigurable.setValid(valid);
        }
        this.updateConfigurableValues();
      })
    );
    this.paramsDialogService.setDataConfiguration(this.dataConfigurableSource);

    if (this.formType !== null) {
      this.temporalControlDisabledSource.next(false);
      this.spatialBoundslDisabled = false;
    }
  }



  public resetInputs(): void {
    this.dataConfigurable = this.dataConfigurableSource.getValue();

    this.showLoading = (this.dataConfigurable == null);

    if (null != this.dataConfigurable) {

      this.isOnlyDownloadable = this.dataConfigurable.isOnlyDownloadable();

      this.parameterDefinitions = this.dataConfigurable.getParameterDefinitions();

      this.initSpatialControl(this.dataConfigurable);
      this.initTemporalControl(this.dataConfigurable);
      this.initParameters(this.dataConfigurable);

      const distributionDetails = this.dataConfigurable.getDistributionDetails();
      this.serviceDocumentation = distributionDetails.getDocumentation().trim();

      // saves the last selected distribution
      this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, distributionDetails.getIdentifier(), false, LocalStorageVariables.LS_LAST_SELECTED_ID);

      this.updateConfigurableValues();

      this.showLoading = false;
    }
  }

  public changeBBox(bbox?: BoundingBox): void {
    this.spatialBounds = (null == bbox) ? SimpleBoundingBox.makeUnbounded() : bbox;
    this.updateConfigurableValues();
  }

  public spatialLinkToggle(change: MatSlideToggleChange): void {
    this.dataConfigurable!.setSpatialLinked(!change.checked);
  }

  public temporalLinkToggle(change: MatSlideToggleChange): void {
    this.dataConfigurable!.setTemporalLinked(!change.checked);
  }

  public openParametersDialog(): void {

    // track
    this.tracker.trackEvent(TrackerCategory.DISTRIBUTION, TrackerAction.EXPAND_PARAMETERS, this.dataConfigurable?.getDistributionDetails().getDomainCode() + Tracker.TARCKER_DATA_SEPARATION + this.dataConfigurable?.getDistributionDetails().getName());


    const elemPosition = document.getElementById('distributionListTable')!.getBoundingClientRect();

    void this.dialogService.openParametersDialog(
      this.dataConfigurable?.getDistributionDetails().getIdentifier(),
      '50vw',
      '100px',
      String(elemPosition.right + 45) + 'px',
      DataConfigurationType.DATA,
      this.dataConfigurable?.getDistributionDetails().getName()
    ).then(() => {
      this.updateConfigurableValues();
    });
  }

  public openServiceDocumentation(): void {
    // track
    this.tracker.trackEvent(TrackerCategory.DISTRIBUTION, TrackerAction.OPEN_DOCUMENTATION, this.dataConfigurable?.getDistributionDetails().getDomainCode() + Tracker.TARCKER_DATA_SEPARATION + this.dataConfigurable?.getDistributionDetails().getName());

    window.open(this.serviceDocumentation, '_blank');
  }

  public openDownloadsDialog(): void {

    // track
    this.tracker.trackEvent(TrackerCategory.DISTRIBUTION, TrackerAction.OPEN_DOWNLOAD, this.dataConfigurable?.getDistributionDetails().getDomainCode() + Tracker.TARCKER_DATA_SEPARATION + this.dataConfigurable?.getDistributionDetails().getName());

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    void this.dialogService.openDownloadsDialog(
      this.dataConfigurable,
      '50vw',
    );
  }

  public openAddToEnvDialog(): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    void this.dialogService.openAddToEnvDialog(
      this.dataConfigurable,
      '50vw',
    );
  }

// When the user types in the search bar inside a card, this funciton is called, which then
// calls searchValuesinAdSearch to filter the allowed values based on the search term, and finally updates
// the filteredAllowedValues for that parameter definition so that the user sees the filtered list.
public onSearchInput(paramDef: ParameterDefinition, event: Event): void {
  const inputElement = event.target as HTMLInputElement;
  const value = inputElement.value;
  this.searchTerms[paramDef.name] = value.toLowerCase();
  this.filteredAllowedValues[paramDef.name] = this.searchValuesinAdSearch(paramDef);
  this.cdr.detectChanges();
}

// this method is used so that when the dropdown is oppended, the search input is focused automatically, this is optional feature
public onSelectOpened(paramDef: ParameterDefinition): void {
  this.searchTerms[paramDef.name] = '';
  this.filteredAllowedValues[paramDef.name] = paramDef.allowedValues;

  // this focuses the search input inside the dropdown
    const inputs = document.querySelectorAll('.mat-option-search');
    const input = Array.from(inputs).find(el =>
      (el as HTMLInputElement).placeholder === 'Search...'
    ) as HTMLInputElement;
    if (input) {input.focus();}
}
// when the card or dropdown is closed, reset the search bar
public onSelectClosed(paramDef: ParameterDefinition): void {
  this.searchTerms[paramDef.name] = '';
  this.filteredAllowedValues[paramDef.name] = paramDef.allowedValues;
}
// this method filters the allowed values of a parameter definition based on the search term entered by the user
// the filter uses includes not starstwith
public searchValuesinAdSearch(paramDef: ParameterDefinition): string[] {
  const term = (this.searchTerms[paramDef.name] || '').toLowerCase().trim();

  if (!term) {return paramDef.allowedValues;}
  const filtered = paramDef.allowedValues.filter(v => {
    const valueStr = (v || '').toString().toLowerCase();
    return valueStr.includes(term);
  });
  return filtered;
}
  /**
   * The saveForm function closes a popup.
   */
  protected saveForm(): void {
  }

  protected refreshParameterValues(paramValues: Array<SimpleParameterValue>): void {

    const otherParams = this.parameterDefinitions.getOtherParameters();
    this.otherParameters = ((null != otherParams) ? otherParams : [])
      .sort((a: ParameterDefinition, b: ParameterDefinition) => {
        if (a.optional !== b.optional) {
          return (a.optional ? 1 : -1);
        } else {
          return (a.label < b.label ? -1 : 1);
        }
      });
    this.otherParameters.forEach(param => {
      if (Array.isArray(param.allowedValues)) {
        param.allowedValues.sort((a, b) =>
          a.toString().localeCompare(b.toString(), undefined, { sensitivity: 'base' })
        );
      }
    });
    paramValues.forEach((paramVal: ParameterValue) => {
      const paramDef = this.otherParameters.find(def => (def.name === paramVal.name));

      if (null != paramDef) {
        if (paramDef.multipleValue === 'true') {
          this.currentValues[paramVal.name] = (this.stringToValue(paramDef, paramVal.value) as string).split(',');
        } else {
          this.currentValues[paramVal.name] = this.stringToValue(paramDef, paramVal.value);
        }
      }
    });
  }

  private initParameters(dataConfigurable: DataConfigurableI): void {
    const paramValues: Array<SimpleParameterValue> = [];

    // reloads the parameters of the last selected distribution
    const lastSelectedId = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_LAST_SELECTED_ID);
    if (lastSelectedId === dataConfigurable?.id) {
      paramValues.push(...dataConfigurable.currentParamValues.slice());
    }

    paramValues.push(...dataConfigurable.getNewParameterValues().slice());

    // update values
    this.currentValues = {};
    this.otherParameters = [];

    // ensure changes take effect
    this.cdr.detectChanges();

    this.refreshParameterValues(paramValues);
  }

  private initSpatialControl(dataConfigurable: DataConfigurableI): void {
    this.spatialBounds = (this.parameterDefinitions.hasSpatialParameters())
      ? dataConfigurable.getNewSpatialBounds()
      : null;

    this.spatialBoundslDisabled = dataConfigurable.isSpatialLinked();
  }

  private initTemporalControl(dataConfigurable: DataConfigurableI): void {
    this.hasTemporalRange = this.parameterDefinitions.hasTemporalParameters();
    if (this.hasTemporalRange) {
      this.temporalRangeSource.next(dataConfigurable.getNewTemporalRange());
      this.subscriptions.push(
        this.temporalRangeSource.subscribe(() => {
          this.updateConfigurableValues();
        })
      );
      this.temporalControlDisabledSource.next(dataConfigurable.isTemporalLinked());
    }
  }

  private updateConfigurableValues(): void {
    clearTimeout(this.updateTimeout);
    this.updateTimeout = setTimeout(() => {

      this.totParValue = 0;
      this.totPar = 0;
      if (this.dataConfigurable != null) {
        const paramValues = new Array<ParameterValue>();

        this.otherParameters.forEach((paramDef: ParameterDefinition) => {
          const control = this.form.control.get(paramDef.name);
          if (null != control) {

            const value = this.valueToString(paramDef, control.value);

            if (paramDef.type === ParameterType.BOOLEAN) {
              if (value === 'true') {
                this.totParValue++;
              }
            } else {
              if (value !== '' && paramDef.readOnlyValue !== 'true' && paramDef.property !== this.PARAMETER_OUTPUT_FORMAT_PROPERTY) {
                this.totParValue++;
              }
            }

            paramValues.push(new SimpleParameterValue(paramDef.name, value));
          }

          if (paramDef.readOnlyValue !== 'true' && paramDef.property !== this.PARAMETER_OUTPUT_FORMAT_PROPERTY) {
            this.totPar++;
            this.showApplyButton = true;
          }
        });

        if (null != this.spatialBounds) {
          this.parameterDefinitions.updateSpatialParamsUsingBounds(this.spatialBounds, paramValues);

          this.totPar++;
          this.showApplyButton = true;

          if (this.spatialBounds.isBounded()) {
            this.totParValue++;
          }
        }

        if (this.hasTemporalRange) {
          this.parameterDefinitions.updateTemporalParamsUsingRange(this.temporalRangeSource.getValue(), paramValues);

          this.totPar++;
          this.showApplyButton = true;

          const temporalRangeParams = this.dataConfigurable.getNewTemporalRange();
          if (!temporalRangeParams.isUnbounded()) {
            this.totParValue++;
          }

        }

        this.dataConfigurable.setNewParams(paramValues);
      }

    }, 50);
  }

  private valueToString(def: ParameterDefinition, value: unknown): string {
    let returnVal;
    switch (def.type) {
      case (ParameterType.DATE):
      case (ParameterType.DATETIME):
        returnVal = (null === value) ? '' : moment.utc(value as moment.MomentInput).format(def.format);
        break;
      case (ParameterType.BOOLEAN):
        returnVal = (value === true) ? 'true' : 'false';
        break;
      default: returnVal = value;
    }

    // TODO lint: check the adding of this String func call
    return String(returnVal ?? '');// convert nullish to empty string
  }

  private stringToValue(def: ParameterDefinition, value: string): unknown {
    let returnVal;
    switch (def.type) {
      case (ParameterType.DATE):
      case (ParameterType.DATETIME):
        returnVal = ('' === value) ? null : moment.utc(value, def.format);
        break;
      case (ParameterType.BOOLEAN):
        returnVal = (value.toLowerCase() === 'true') ? true : false;
        break;
      default: returnVal = value;
    }
    return returnVal;
  }

}
