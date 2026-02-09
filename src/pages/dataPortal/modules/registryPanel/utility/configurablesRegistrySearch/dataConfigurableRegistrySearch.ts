import { ParameterValue } from 'api/webApi/data/parameterValue.interface';
import { DistributionDetails } from 'api/webApi/data/distributionDetails.interface';
import { Injector } from '@angular/core';

import { BoundingBox } from 'api/webApi/data/boundingBox.interface';

import { DataConfigurableDataSearch } from 'utility/configurablesDataSearch/dataConfigurableDataSearch';
import { SimpleParameterValue } from 'api/webApi/data/impl/simpleParameterValue';

export class DataConfigurableRegistrySearch
  extends DataConfigurableDataSearch {

  constructor(
    injector: Injector,
    distributionDetails: DistributionDetails,
    paramValues: Array<ParameterValue>,
    spatialOverrides?: BoundingBox,
  ) {
    super(injector, distributionDetails, paramValues, spatialOverrides, undefined);

  }

  /**
   * The function `updateLinkedEquipmentTypesParams` updates the equipment types parameter with new
   * values if the provided equipment types array is not null.
   * @param {Array<string> | null} equipmentTypes - The `equipmentTypes` parameter is an array of
   * strings that represent different types of equipment. The `updateLinkedEquipmentTypesParams`
   * function takes this array as input and updates the parameter values associated with the equipment
   * types in the system. If `equipmentTypes` is not null, it converts the array to
   * @param [newParams=true] - The `newParams` parameter in the `updateLinkedEquipmentTypesParams`
   * function is a boolean parameter with a default value of `true`. This means that if the `newParams`
   * argument is not provided when calling the function, it will default to `true`.
   */
  public updateLinkedEquipmentTypesParams(equipmentTypes: Array<string> | null, newParams = true): void {
    if (equipmentTypes !== null) {
      const paramDefs = this.getParameterDefinitions();
      const paramsValue = this.currentParamValues;

      const newParamValues = SimpleParameterValue.make('equipmenttypes', equipmentTypes.toString());
      paramDefs.replaceParamValueInArray(paramsValue, 'equipmenttypes', newParamValues);

      this.doApplyAction(this.currentParamValues, paramsValue);
    }
  }


}
