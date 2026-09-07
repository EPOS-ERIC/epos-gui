import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { trigger, transition, style, animate } from '@angular/animations';
import { DialogData } from '../../baseDialogService.abstract';
import { EnvironmentService as EnvironmentRealService } from 'services/environment.service';
import { Environment } from 'api/webApi/data/environments/environment.interface';
import { EnvironmentType } from 'api/webApi/data/environments/environmentType.interface';
import { SimpleEnvironmentType } from 'api/webApi/data/environments/impl/simpleEnvironmentType';
import { EnvironmentServiceType } from 'api/webApi/data/environments/environmentServiceType.interface';
import { UserNotificationService } from 'components/userNotifications/userNotifications.service';


export interface AddEditEnvironmentDialogDataIn {
  environmentSummary: Environment;
}

/**
 * Dialog component used to add/edit a environment
 */
@Component({
  selector: 'app-analysis-create-environment-form-dialog',
  templateUrl: './createEnvironmentFormDialog.component.html',
  styleUrls: ['./createEnvironmentFormDialog.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, height: 0 }),
        animate('200ms ease-out', style({ opacity: 1, height: '*' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, height: 0 }))
      ])
    ])
  ]
})
export class CreateEnvironmentFormDialogComponent implements OnInit {

  public isAddMode: boolean;
  public form: FormGroup;
  public loading = false;

  public envType: string = '';
  public envService: string;
  public environmentTypeArray: Array<EnvironmentType> = [];
  public environmentServiceSelectArray: Array<EnvironmentServiceType> = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData<AddEditEnvironmentDialogDataIn, unknown>,
    fb: FormBuilder,
    private readonly notificationService: UserNotificationService,
    private readonly environmentService: EnvironmentRealService,
  ) {
    this.isAddMode = (undefined === data.dataIn.environmentSummary);

    this.form = fb.group({
      name: fb.control((this.isAddMode) ? '' : data.dataIn.environmentSummary.name),
      description: fb.control((this.isAddMode) ? '' : data.dataIn.environmentSummary.description),
      type: fb.control((this.isAddMode) ? '' : data.dataIn.environmentSummary.serviceId),
      service: fb.control((this.isAddMode) ? '' : data.dataIn.environmentSummary.serviceId),
    });
  }

  ngOnInit(): void {

    void this.environmentService.getAllEnvironmentTypes().then((environmentTypes: Array<SimpleEnvironmentType>) => {
      if (environmentTypes !== null) {
        this.environmentTypeArray = environmentTypes;
      }
    });

    this.form.controls.type.valueChanges.subscribe(value => {
      const envTypeSelected = this.environmentTypeArray.find((item) => { return item.type === value; });
      if (envTypeSelected !== undefined) {
        this.environmentServiceSelectArray = envTypeSelected.services;
      }
      this.envType = value as string;
    });
  }

  public cancel(): void {
    this.data.close();
  }

  public getSelectedProviderName(): string {
    const selected = this.environmentServiceSelectArray.find(s => s.id === this.envService);
    return selected ? selected.name : '';
  }

  public getSelectedProviderDescription(): string {
    const selected = this.environmentServiceSelectArray.find(s => s.id === this.envService);
    return selected?.description || '';
  }

  public confirm(): void {

    const name = this.form.get('name')!.value as string;
    const description = this.form.get('description')!.value as string;
    const service = this.form.get('service')!.value as string;

    this.loading = true;

    let promise: Promise<boolean>;
    if (this.isAddMode) {
      promise = this.environmentService.createEnvironment(name, description, service)
        .then((newEnv: Environment) => {
          return true;
        }).catch(() => {
          this.notificationService.sendErrorNotification('An error occured creating the environment, please try again.');
          return false;
        });
    } else {
      promise = this.environmentService.updateEnvironment(this.data.dataIn.environmentSummary, name, description)
        .then((updatedSummary: Environment) => {
          return true;
        }).catch(() => {
          this.notificationService.sendErrorNotification('An error occured updating the environment, please try again.');
          return false;
        });
    }
    void promise.then((success: boolean) => {
      this.data.requiresRefreshOnClose = success;
      this.environmentService.refreshEnvs.emit();
      this.data.close();
    });
  }
}
