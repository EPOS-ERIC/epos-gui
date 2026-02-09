import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SimpleParameterDefinition } from 'api/webApi/data/impl/simpleParameterDefinition';
import { SimpleParameterDefinitions } from 'api/webApi/data/impl/simpleParameterDefinitions';
import { ParameterDefinition } from 'api/webApi/data/parameterDefinition.interface';
import { ParameterValue } from 'api/webApi/data/parameterValue.interface';
import { DialogService } from 'components/dialog/dialog.service';
import { ParametersDialogService } from 'components/dialog/parametersDialog/parametersDialog.service';
import { DataConfigurationComponent } from 'pages/dataPortal/modules/dataConfiguration/dataConfiguration.component';
import { AnalysisConfigurablesService } from 'pages/dataPortal/services/analysisConfigurables.service';
import { BehaviorSubject } from 'rxjs';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { DataConfigurationType } from 'utility/configurables/dataConfigurationType.enum';
import { Tracker } from 'utility/tracker/tracker.service';

@Component({
  selector: 'app-configuration',
  templateUrl: '../../../dataConfiguration/dataConfiguration.component.html',
  styleUrls: ['../../../dataConfiguration/dataConfiguration.component.scss'],
})
export class ConfigurationComponent extends DataConfigurationComponent implements OnInit {

  public static ANALYSIS_RESOURCE_NAME = 'AnalysisResourceName';
  public static ANALYSIS_RESOURCE_DESC = 'AnalysisResourceDesc';
  @Input() extraParameterDefinitions: BehaviorSubject<null | Array<ParameterDefinition>>;
  @Input() extraParameterValues: BehaviorSubject<null | Array<ParameterValue>>;
  @Output() closePopup = new EventEmitter<string>();

  public formType: DataConfigurationType = DataConfigurationType.ANALYSIS;


  constructor(
    protected readonly cdr: ChangeDetectorRef,
    protected readonly dialogService: DialogService,
    protected readonly paramsDialogService: ParametersDialogService,
    protected readonly localStoragePersister: LocalStoragePersister,
    protected readonly analysisConfigurables: AnalysisConfigurablesService,
    protected readonly tracker: Tracker,
  ) {
    super(cdr, dialogService, paramsDialogService, localStoragePersister, analysisConfigurables, tracker);
  }


  public ngOnInit(): void {
    super.ngOnInit();

    const extraParameterDefinitionArray = this.extraParameterDefinitions.getValue() as Array<ParameterDefinition>;
    if (extraParameterDefinitionArray !== null) {
      // add resource name and description field def to parameters
      this.parameterDefinitions = SimpleParameterDefinitions.make(extraParameterDefinitionArray.concat(this.parameterDefinitions.getParameters()));
    }

    const extraParameterValueArray = this.extraParameterValues.getValue() as Array<ParameterValue>;
    if (extraParameterValueArray !== null && this.dataConfigurable !== null) {
      this.dataConfigurable.setNewParams(extraParameterValueArray);
      // add resource name and description value to parameters
      this.refreshParameterValues(this.dataConfigurable.getNewParameterValues());

      // reorder the form fields
      // put resource name and description first
      this.otherParameters.forEach((item: SimpleParameterDefinition, i) => {
        if (item.name === ConfigurationComponent.ANALYSIS_RESOURCE_DESC) {
          this.otherParameters.splice(i, 1);
          this.otherParameters.unshift(item);
        }
      });
      this.otherParameters.forEach((item: SimpleParameterDefinition, i) => {
        if (item.name === ConfigurationComponent.ANALYSIS_RESOURCE_NAME) {
          this.otherParameters.splice(i, 1);
          this.otherParameters.unshift(item);
        }
      });
    }
  }

  /**
 * The saveForm function closes a popup.
 */
  public saveForm(): void {
    this.closePopup.emit('saving');
  }

}
