import { DataConfigurable } from './dataConfigurable.abstract';
import { ParameterValue } from 'api/webApi/data/parameterValue.interface';
import { DistributionDetails } from 'api/webApi/data/distributionDetails.interface';
import { Injector } from '@angular/core';
import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { TemporalRange } from 'api/webApi/data/temporalRange.interface';

export class DataConfigurableParamValues extends DataConfigurable {
  constructor(
    protected injector: Injector,
    distributionDetails: DistributionDetails,
    paramValues: Array<ParameterValue>,
    spatialOverrides?: BoundingBox,
    temporalOverrides?: TemporalRange,
  ) {
    super(distributionDetails, paramValues, spatialOverrides, temporalOverrides);
  }


}
