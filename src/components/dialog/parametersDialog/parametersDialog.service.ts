import { Injectable } from '@angular/core';
import { ParameterDefinition } from 'api/webApi/data/parameterDefinition.interface';
import { ParameterValue } from 'api/webApi/data/parameterValue.interface';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { DataConfigurableI } from 'utility/configurables/dataConfigurableI.interface';

@Injectable({
  providedIn: 'root'
})
export class ParametersDialogService {

  public parametersToShow: Array<ParameterDefinition>;
  public currentValues: Record<string, unknown> = {};
  public dataConfigurableSource: BehaviorSubject<null | DataConfigurableI>;
  public extraParameterDefinition: BehaviorSubject<null | Array<ParameterDefinition>>;
  public extraParameterValues: BehaviorSubject<null | Array<ParameterValue>>;

  public setParametersToShow(params: Array<ParameterDefinition>): void {
    this.parametersToShow = params;
  }
  public setCurrentValues(params: Record<string, unknown>): void {
    this.currentValues = params;
  }
  public setDataConfiguration(data: BehaviorSubject<null | DataConfigurableI>): void {
    this.dataConfigurableSource = data;
  }
  public getDataConfiguration(): BehaviorSubject<null | DataConfigurableI> {
    return this.dataConfigurableSource;
  }
  public setExtraParameterDefinitions(data: BehaviorSubject<null | Array<ParameterDefinition>>): void {
    this.extraParameterDefinition = data;
  }
  public getExtraParameterDefinitions(): BehaviorSubject<null | Array<ParameterDefinition>> {
    return this.extraParameterDefinition;
  }
  public setExtraParameterValues(data: BehaviorSubject<null | Array<ParameterValue>>): void {
    this.extraParameterValues = data;
  }
  public getExtraParameterValues(): BehaviorSubject<null | Array<ParameterValue>> {
    return this.extraParameterValues;
  }
}
