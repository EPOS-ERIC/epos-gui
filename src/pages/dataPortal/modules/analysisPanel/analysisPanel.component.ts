import { Component, OnInit } from '@angular/core';
import { AaaiService } from 'api/aaai.service';
import { AAAIUser } from 'api/aaai/aaaiUser.interface';
import { DialogService } from 'components/dialog/dialog.service';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { BehaviorSubject, Subscription, interval } from 'rxjs';
import { EnvironmentService } from 'services/environment.service';
import { ResultsPanelService } from '../../services/resultsPanel.service';
import { SimpleEnvironment } from 'api/webApi/data/environments/impl/simpleEnvironment';
import { SimpleEnvironmentType } from 'api/webApi/data/environments/impl/simpleEnvironmentType';
import { EnvironmentServiceType } from 'api/webApi/data/environments/environmentServiceType.interface';
import { Environment } from 'api/webApi/data/environments/environment.interface';
import { EnvironmentStatus, EnvironmentStatusText } from 'api/webApi/data/environments/environmentStatus.enum';
import { EnvironmentResource } from 'api/webApi/data/environments/environmentResource.interface';
import { AnalysisConfigurablesService } from 'pages/dataPortal/services/analysisConfigurables.service';
import { UserNotificationService } from 'components/userNotifications/userNotifications.service';
import { DataConfigurableDataSearch } from 'utility/configurablesDataSearch/dataConfigurableDataSearch';
import { ParametersDialogService } from 'components/dialog/parametersDialog/parametersDialog.service';
import { HttpParams } from '@angular/common/http';
import { DataConfigurationType } from 'utility/configurables/dataConfigurationType.enum';
import { ParameterProperty } from 'api/webApi/data/parameterProperty.enum';
import { SimpleParameterValue } from 'api/webApi/data/impl/simpleParameterValue';
import { SimpleParameterDefinition } from 'api/webApi/data/impl/simpleParameterDefinition';
import { ParameterType } from 'api/webApi/data/parameterType.enum';
import { ConfigurationComponent } from './components/configurationComponent/configuration.component';
import { SimpleEnvironmentResource } from 'api/webApi/data/environments/impl/simpleEnvironmentResource';
import { EnvironmentResourceStatus } from 'api/webApi/data/environments/environmentResourceStatus.enum';
import { DataSearchConfigurablesServiceAnalysis } from './services/dataSearchConfigurables.service';
import { MetaDataStatusService } from 'services/metaDataStatus.service';

@Unsubscriber('subscriptions')
@Component({
  selector: 'app-analysis-panel',
  templateUrl: './analysisPanel.component.html',
  styleUrls: ['./analysisPanel.component.scss'],
})
export class AnalysisPanelComponent implements OnInit {

  /* The above code is declaring a public property called `environmentObjectArray` of type
  `Array<EnvironmentObject> | null`. It is initialized with a value of `null`. */
  public environmentObjectArray: Array<EnvironmentObject> | null = null;

  /* The above code is declaring a public property called "expandedEnvironment" of type
  "EnvironmentObject" or null. */
  public expandedEnvironment: EnvironmentObject | null;

  /* The above code is declaring a public property called `templateStatus` in a TypeScript class. The
  property is of type `string` or `null` and is initialized with a value of `null`. */
  public templateStatus: string | null = null;

  /* The above code is declaring a public variable called "environmentStatus" and assigning it the
  value of "EnvironmentStatus". */
  public environmentStatus = EnvironmentStatus;

  public readonly MAX_ENVIRONMENTS_LIMIT = 2;

  private environmentTypeArray: Array<SimpleEnvironmentType> = [];
  private user: null | AAAIUser = null;
  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  constructor(
    private readonly resultPanelService: ResultsPanelService,
    private readonly analysisConfigurables: AnalysisConfigurablesService,
    private readonly dialogService: DialogService,
    private readonly aaai: AaaiService,
    private readonly environmentService: EnvironmentService,
    private readonly notifier: UserNotificationService,
    private readonly dataSearchConfigurables: DataSearchConfigurablesServiceAnalysis,
    private readonly paramsDialogService: ParametersDialogService,
    private readonly metadataStatusService: MetaDataStatusService,
  ) {

    this.expandedEnvironment = null;

    this.templateStatus = 'loading';
  }

  ngOnInit(): void {

    this.subscriptions.push(
      this.aaai.watchUser().subscribe((user: AAAIUser) => {
        this.user = user;

        if (user === null) {
          this.resultPanelService.setCounterEnvironment(0);
          this.analysisConfigurables.setEnvironmentSelection(null);
          this.templateStatus = 'loading';

          // wait to show login section checking if user is real logged in
          setTimeout(() => {
            if (this.user === null) {
              this.templateStatus = 'login';
            }
          }, 1000);

        } else {
          this.getEnvironments();
        }
      }),

      this.environmentService.refreshEnvs.subscribe(() => {
        this.getEnvironments(this.expandedEnvironment?.id ?? null);
      }),

      // check every 10 seconds selected and not ready env
      interval(10000).subscribe(() => {
        if (this.expandedEnvironment !== null && (this.expandedEnvironment.status !== EnvironmentStatus.READY && this.expandedEnvironment.status !== EnvironmentStatus.NOT_READY)) {
          this.select(this.expandedEnvironment);
        }
      }),
    );
  }

  /**
   * The function `deleteResource` is used to remove a resource from an environment and update the
   * environment's resources list.
   * @param {EnvironmentResource} resource - The parameter "resource" is of type "EnvironmentResource".
   */
  public deleteResource(resource: EnvironmentResource): void {

    if (this.expandedEnvironment !== null) {
      const environment = this.expandedEnvironment.toSimpleEnvironment();

      if (environment !== null) {

        void this.dialogService.openConfirmationDialog('Are you sure to remove the resource <br /> "' + resource.name + '"<br /> for the environment "' + environment.name + '"?', false, 'Yes', '', 'No').then(val => {
          if (val) {
            // remove resource from the resources list
            const resources = environment.getResources().filter(_resource => { return _resource.itemid !== resource.itemid; });

            this.templateStatus = 'loading';
            void this.environmentService.updateResourcesToEnvironment(environment, resources).then(_res => {
              if (_res && this.environmentObjectArray !== null) {
                this.getEnvironments(environment.id);
              }
            }).catch(() => {
              this.getEnvironments(environment.id);
            });
          }
        });
      }
    }
  }

  /**
   * The `cloneResource` function clones a resource by adding it to the list of resources in the expanded
   * environment and then updates the environment with the new list of resources.
   * @param {EnvironmentResource} resource - The `resource` parameter is of type `EnvironmentResource`,
   * which represents a resource in an environment.
   */
  public cloneResource(resource: EnvironmentResource): void {
    if (this.expandedEnvironment) {
      this.templateStatus = 'loading';
      const environment = this.expandedEnvironment.toSimpleEnvironment();

      if (environment !== null) {
        const resources = environment.getResources();
        if (resources !== undefined) {

          resources.push(
            SimpleEnvironmentResource.make(resource.resourceid, resource.name, resource.description, resource.format, resource.url)
          );

          void this.environmentService.updateResourcesToEnvironment(environment, resources)
            .then((updatedSummary: Environment) => {
              this.getEnvironments(environment.id);
            }).catch(() => {
              this.notifier.sendErrorNotification('An error occured updating the environment, please try again.');
              this.getEnvironments(environment.id);
            });
        }
      }
    }
  }

  /**
   * The function "openInBrowser" opens a given URL in a new browser tab.
   * @param {string} url - The `url` parameter is a string that represents the URL of the webpage you
   * want to open in a new browser window.
   */
  public openInBrowser(url: string) {
    window.open(url, '_blank');
  }

  /**
   * The function `openCreateEnvironmentDialog` opens a dialog for creating or managing an environment.
   * @param {EnvironmentObject | null} [environment=null] - The `environment` parameter is of type
   * `EnvironmentObject | null`. It represents an environment object that can be passed to the
   * `openCreateEnvironmentDialog` method. If a non-null `environment` object is provided, the method
   * will open a dialog using the `dialogService.environmentManagerDialog` method
   */
  public openCreateEnvironmentDialog(environment: EnvironmentObject | null = null): void {
    if (environment === null && this.environmentObjectArray !== null && this.environmentObjectArray.length >= this.MAX_ENVIRONMENTS_LIMIT) {
      this.notifier.sendErrorNotification(`You have reached the maximum limit of ${this.MAX_ENVIRONMENTS_LIMIT} environments.`);
      return;
    }

    if (environment !== null) {
      void this.dialogService.environmentManagerDialog(environment.toSimpleEnvironment());
    }
    void this.dialogService.environmentManagerDialog();
  }

  /**
   * The function `deleteEnvironmentDialog` opens a confirmation dialog and if the user confirms, it
   * removes the specified environment from an array and updates the loading state.
   * @param {EnvironmentObject} environment - The parameter "environment" is of type "EnvironmentObject".
   */
  public deleteEnvironmentDialog(environment: EnvironmentObject): void {
    if (environment !== null) {
      void this.dialogService.openConfirmationDialog('Are you sure to remove the environment "' + environment.name + '"?', false, 'Yes', '', 'No').then(val => {
        if (val) {
          this.templateStatus = 'loading';
          void this.environmentService.removeEnvironment(environment.toSimpleEnvironment()).then(_res => {
            if (_res && this.environmentObjectArray !== null) {

              if (this.expandedEnvironment !== null && this.expandedEnvironment.id === environment.id) {
                this.select(null);
              }

              this.environmentObjectArray = this.environmentObjectArray.filter(_i => _i.id !== environment.id);
              this.resultPanelService.setCounterEnvironment(this.environmentObjectArray.length);
              this.templateStatus = 'envs';
            }
          }).catch(() => {
            this.templateStatus = 'envs';
          });
        }
      });
    }
  }

  /**
   * The function `deleteAllEnvironmentsDialog` opens a confirmation dialog and if the user confirms, it
   * deletes all environments by calling the `removeEnvironment` method for each environment in the
   * `environmentObjectArray`.
   */
  public deleteAllEnvironmentsDialog(): void {
    void this.dialogService.openConfirmationDialog('Are you sure you want to delete all your environments?', true, 'Remove All', '', 'Go back').then(val => {
      if (val && this.environmentObjectArray !== null) {
        this.templateStatus = 'loading';
        this.environmentObjectArray.forEach(environment => {
          void this.environmentService.removeEnvironment(environment.toSimpleEnvironment()).then(_res => {
            if (_res && this.environmentObjectArray !== null) {
              this.environmentObjectArray = this.environmentObjectArray.filter(_i => _i.id !== environment.id);
              this.resultPanelService.setCounterEnvironment(this.environmentObjectArray.length);
            }

            if (this.environmentObjectArray !== null && this.environmentObjectArray.length === 0) {
              this.templateStatus = 'envs';
            }
          }).catch(() => {
            this.templateStatus = 'envs';
          });
        });
      }
    });
  }

  /**
   * The function `openRun` opens a confirmation dialog and if the user confirms, it runs a job in the
   * specified environment.
   * @param {EnvironmentObject} environment - The `environment` parameter is an object of type
   * `EnvironmentObject`.
   */
  public openRun(environment: EnvironmentObject): void {
    if (environment !== null) {
      const text = environment.buttonRunText;
      void this.dialogService.openConfirmationDialog('Are you sure to ' + text + ' the environment "' + environment.name + '"?', false, 'Yes', '', 'No').then(val => {
        if (val) {
          this.templateStatus = 'loading';
          void this.environmentService.runjobEnvironment(environment.toSimpleEnvironment()).then(_res => {
            if (_res) {
              environment.status = EnvironmentStatus.CREATING;
              environment.refreshStatus();
              this.templateStatus = 'envs';
            }
          }).catch(() => {
            this.getEnvironments();
            this.templateStatus = 'envs';
          });
        }
      });
    }
  }

  /**
   * When the user clicks on an item, the item is selected
   * @param {EnvironmentSummary | null} expandedEnvironment - The element that was expanded.
   */
  public select(expandedEnvironment: EnvironmentObject | null): void {
    this.expandedEnvironment = expandedEnvironment;
    if (this.expandedEnvironment !== null) {

      void this.environmentService.getEnvironment(this.expandedEnvironment.toSimpleEnvironment()).then((environment: SimpleEnvironment | null) => {
        this.analysisConfigurables.setEnvironmentSelection(
          environment
        );

        // new check status
        if (environment !== null && this.expandedEnvironment !== null) {
          this.expandedEnvironment.status = environment.getStatus();
          this.expandedEnvironment.accessUrl = environment.getAccessUrl();
          this.expandedEnvironment.refreshStatus();

          // refresh status for each resources
          environment.resources.forEach(_res => {
            if (this.expandedEnvironment !== null) {
              this.expandedEnvironment.resources.map(_resObj => {
                if (_resObj.itemid === _res.itemid) {
                  _resObj.status = _res.status;
                }
              });
            }
          });
        }

      }).catch(e => {
        this.analysisConfigurables.setEnvironmentSelection(null);
      });

    } else {
      this.analysisConfigurables.setEnvironmentSelection(null);
    }
  }

  /**
   * The function `openParametersDialog` opens a dialog box with configurable parameters for a given
   * resource, retrieves the parameter values from the resource URL, sets the configurables and form type
   * for the dialog, and updates the environment with the new URL after the dialog is closed.
   * @param {EnvironmentResource} resource - The `resource` parameter is of type `EnvironmentResource`.
   */
  public openParametersDialog(resource: EnvironmentResource): void {
    const elemPosition = document.getElementById('distributionListTable')!.getBoundingClientRect();

    // call configurables by resourceId
    void this.dataSearchConfigurables.createConfigurable(resource.resourceid).then((configurables: DataConfigurableDataSearch) => {

      // set param values from resource URL
      configurables.getNewParameterValues().forEach(param => {
        const newValue = this.getParamValueQueryString(resource.url, param.name);
        if (newValue !== null) {
          param.value = newValue;
        }
      });

      // set configurables to service that open configurable dialog
      this.paramsDialogService.setDataConfiguration(new BehaviorSubject(configurables));

      const extraParameterDefinitionArray = [
        SimpleParameterDefinition.make(ConfigurationComponent.ANALYSIS_RESOURCE_NAME, 'Resource Name on Env', ParameterType.STRING, ParameterProperty.NONE, true, '', '', '', '', [], false, '', '', resource.name),
        SimpleParameterDefinition.make(ConfigurationComponent.ANALYSIS_RESOURCE_DESC, 'Resource description on Env', ParameterType.STRING, ParameterProperty.NONE, true, '', '', '', '', [], false, '', '', resource.description),
      ];
      this.paramsDialogService.setExtraParameterDefinitions(new BehaviorSubject(extraParameterDefinitionArray));

      const extraParameterValueArray = [
        SimpleParameterValue.make(ConfigurationComponent.ANALYSIS_RESOURCE_NAME, resource.name),
        SimpleParameterValue.make(ConfigurationComponent.ANALYSIS_RESOURCE_DESC, resource.description),
      ];
      this.paramsDialogService.setExtraParameterValues(new BehaviorSubject(extraParameterValueArray));

      // open analysis dialog
      void this.dialogService.openParametersDialog(
        resource.resourceid,
        '50vw',
        '100px',
        String(elemPosition.right + 45) + 'px',
        DataConfigurationType.ANALYSIS,
        resource.name
      ).then((data) => {

        if (data !== null && data.dataOut === 'saving') {

          const resourceNameParam = configurables.getNewParameterValues().find(param => {
            return param.name === ConfigurationComponent.ANALYSIS_RESOURCE_NAME;
          });
          if (resourceNameParam !== undefined) {
            resource.name = resourceNameParam.value;
          }

          const resourceDescParam = configurables.getNewParameterValues().find(param => {
            return param.name === ConfigurationComponent.ANALYSIS_RESOURCE_DESC;
          });
          if (resourceDescParam !== undefined) {
            resource.description = resourceDescParam.value;
          }

          // retrieve new URL
          void configurables.getOriginatorUrl(true).then((url) => {

            // get format from new parameter
            const formatParameterDefinition = configurables.getDistributionDetails().getParameters().getParameterByProperty(ParameterProperty.OUTPUT_FORMAT);
            const formatSimpleParameterValue: SimpleParameterValue | undefined = configurables.getNewParameterValues().find(param => {
              return param.name === formatParameterDefinition.name;
            });

            // save environment
            if (this.expandedEnvironment !== null) {
              const environment = this.expandedEnvironment.toSimpleEnvironment();

              if (environment !== null) {

                const resources = environment.getResources();

                resources.map(res => {
                  if (res.itemid === resource.itemid) {
                    res.url = url as string;
                    if (formatSimpleParameterValue !== undefined) {
                      res.format = formatSimpleParameterValue.value;
                    }
                  }
                });

                if (resources !== undefined) {
                  void this.environmentService.updateResourcesToEnvironment(environment, resources)
                    .then((updatedSummary: Environment) => {
                      this.environmentService.refreshEnvs.emit();
                    }).catch(() => {
                      this.notifier.sendErrorNotification('An error occured updating the environment, please try again.');
                    });
                }
              }
            }
          });
        }
      });
    });
  }

  /**
   * The logInOut function calls the login method of the aaai object.
   */
  public logInOut(): void {
    this.metadataStatusService.setPromptPending(true);
    this.aaai.login();
  }

  private getParamValueQueryString(url: string, paramName: string): string | null {
    if (url.includes('?')) {
      const httpParams = new HttpParams({ fromString: url.split('?')[1] });
      return httpParams.get(paramName);
    }
    return null;
  }

  private getEnvironments(_expandedEnvironmentId: string | null = null): void {
    this.templateStatus = 'loading';
    this.environmentObjectArray = [];
    this.expandedEnvironment = null;
    void this.environmentService.getAllEnvironmentTypes().then((environmentTypes: Array<SimpleEnvironmentType>) => {
      if (environmentTypes !== null) {
        this.environmentTypeArray = environmentTypes;
      }

      void this.environmentService.getAllEnvironments().then((environments: Array<SimpleEnvironment>) => {
        if (environments !== null) {

          environments.forEach((env: SimpleEnvironment) => {
            const envObject = new EnvironmentObject(env);

            envObject.type = this.getTypeFromServiceId(env.getServiceId());
            envObject.provider = this.getProviderFromServiceId(env.getServiceId());
            envObject.typeSpecific = this.getSpecificFromServiceId(env.getServiceId());

            if (this.environmentObjectArray !== null) {
              this.environmentObjectArray.push(envObject);
            }

            envObject.refreshStatus();
          });

          if (this.environmentObjectArray !== null) {
            this.resultPanelService.setCounterEnvironment(this.environmentObjectArray.length);
            this.templateStatus = 'envs';

            // sort by created
            this.environmentObjectArray.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

            // select expanded object
            if (_expandedEnvironmentId !== null) {
              this.select(this.environmentObjectArray.find(_env => _env.id === _expandedEnvironmentId) ?? null);
            }
          }
        }
      });
    });
  }

  private getTypeFromServiceId(serviceId: string): string {
    let result = '';
    const typeObj = this.environmentTypeArray.find((val: SimpleEnvironmentType) => {
      const found = val.getServices().some((serv: EnvironmentServiceType) => {
        if (serv.id === serviceId) {
          return true;
        }
        return false;
      });

      if (found) {
        return val.getType();
      }

    });
    if (typeObj !== undefined) {
      result = typeObj.getType();
    }
    return result;
  }

  private getProviderFromServiceId(serviceId: string): string {
    let result = '';
    this.environmentTypeArray.find((val: SimpleEnvironmentType) => {
      val.getServices().find((serv: EnvironmentServiceType) => {
        if (serv.id === serviceId) {
          result = serv.provider;
        }
      });

    });
    return result;
  }

  private getSpecificFromServiceId(serviceId: string): string {
    let result = '';
    this.environmentTypeArray.find((val: SimpleEnvironmentType) => {
      val.getServices().find((serv: EnvironmentServiceType) => {
        if (serv.id === serviceId) {
          result = serv.name;
        }
      });

    });
    return result;
  }
}


export class EnvironmentObject {
  id: string;
  name: string;
  description: string;
  type: string;
  provider: string;
  typeSpecific: string;
  serviceId: string;
  accessUrl: string;
  resources: Array<EnvironmentResource>;
  created: string;
  status: EnvironmentStatus | EnvironmentStatusText;
  statusText: string;
  statusIcon: string;
  buttonRunText: string;
  buttonRunEnabled: boolean;
  enable: boolean;

  constructor(env: SimpleEnvironment | null) {
    if (env !== null) {
      this.id = env.getIdentifier();
      this.name = env.getName();
      this.description = env.getDescription();
      this.accessUrl = env.getAccessUrl();
      this.serviceId = env.getServiceId();
      this.resources = env.getResources().sort((a, b) => a.name.localeCompare(b.name));
      this.created = env.getCreated();
      this.status = env.getStatus();
      this.enable = env.isEnable();

    }
  }

  public toSimpleEnvironment(): SimpleEnvironment {
    return SimpleEnvironment.make(
      this.id,
      this.name,
      this.description,
      this.serviceId,
      this.accessUrl,
      this.resources,
      this.created,
      this.status as EnvironmentStatus
    );
  }

  public refreshStatus(): void {
    this.setStatusText();
    this.setStatusIcon();
    this.setOpenInBrowserButton();
    setTimeout(() => {
      this.setButtonText();
    }, 1000);
  }

  private setStatusIcon(): void {
    switch (this.status) {
      case EnvironmentStatus.NOT_READY:
        this.statusIcon = 'schedule';
        break;
      case EnvironmentStatus.CREATING:
      case EnvironmentStatus.UPDATING:
        this.statusIcon = 'offline_bolt';
        break;
      case EnvironmentStatus.READY:
        this.statusIcon = 'check_circle';
        break;
      default:
        this.statusIcon = '';
        break;
    }
  }

  private setButtonText(): void {
    switch (this.status) {
      case EnvironmentStatus.NOT_READY:
        this.buttonRunText = 'Run';
        this.buttonRunEnabled = true;
        break;
      case EnvironmentStatus.CREATING:
      case EnvironmentStatus.UPDATING:
        this.buttonRunText = this.statusText + '...';
        this.buttonRunEnabled = false;
        break;
      case EnvironmentStatus.READY:
        this.buttonRunText = 'Reload';
        // if some resource in "not loaded" status
        if (this.resources.some(_res => _res.status !== EnvironmentResourceStatus.LOADED)) {
          this.buttonRunText = 'Reload';
        }
        this.buttonRunEnabled = true;
        break;
      default:
        this.buttonRunText = '';
        this.buttonRunEnabled = false;
        break;
    }
  }
  private setOpenInBrowserButton(): void {
    switch (this.status) {
      case EnvironmentStatus.NOT_READY:
        this.enable = false;
        break;
      case EnvironmentStatus.CREATING:
      case EnvironmentStatus.UPDATING:
        this.enable = false;
        break;
      case EnvironmentStatus.READY:
        this.enable = true;
        break;
      default:
        this.enable = false;
        break;
    }
  }

  private setStatusText(): void {
    this.statusText = EnvironmentStatus.fromProperty(this.status);
  }
}
