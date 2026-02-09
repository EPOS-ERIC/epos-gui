import { ParameterDefinition } from './parameterDefinition.interface';
import { ParameterValue } from './parameterValue.interface';
import { BoundingBox } from './boundingBox.interface';
import { TemporalRange } from './temporalRange.interface';
import { ParameterProperty } from './parameterProperty.enum';


export interface ParameterDefinitions {

  get(index: number): ParameterDefinition;
  size(): number;

  hasSpatialParameters(): boolean;
  hasTemporalParameters(): boolean;
  getParameters(): Array<ParameterDefinition>;
  getSpatialParameters(): null | Array<ParameterDefinition>;
  getTemporalParameters(): null | Array<ParameterDefinition>;
  getOtherParameters(): null | Array<ParameterDefinition>;
  getParameter(key: string): ParameterDefinition;
  getParameterByProperty(property: ParameterProperty): ParameterDefinition;
  getDefaultParameterValues(): Array<ParameterValue>;

  updateSpatialParamsUsingBounds(
    boundingBox: BoundingBox,
    paramsToUpdate: Array<ParameterValue>,
  ): Array<ParameterValue>;

  updateTemporalParamsUsingRange(
    tempRange: TemporalRange,
    paramsToUpdate: Array<ParameterValue>,
  ): Array<ParameterValue>;

  getSpatialBounds(paramValues: Array<ParameterValue>): BoundingBox;
  getTemporalRange(paramValues: Array<ParameterValue>): TemporalRange;

  filterOutSpatialParamValues(values: Array<ParameterValue>): Array<ParameterValue>;

  filterOutTemporalParamValues(values: Array<ParameterValue>): Array<ParameterValue>;

  filterParamValues(
    paramDefsToFilterBy: Array<ParameterDefinition>,
    values: Array<ParameterValue>,
    filterIn: boolean,
  ): Array<ParameterValue>;

  replaceParamValueInArray(params: Array<ParameterValue>, paramName: string, newValue: ParameterValue): void;
}
