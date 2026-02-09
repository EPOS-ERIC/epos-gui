import { ParameterType } from 'api/webApi/data/parameterType.enum';
import { Parameter } from 'api/webApi/data/parameter.interface';
import { ParameterProperty } from './parameterProperty.enum';

export interface ParameterDefinition extends Parameter {
  label: string;
  property: ParameterProperty;
  type: ParameterType;
  optional: boolean;
  min: string;
  max: string;
  regex: string;
  format: string;
  hasAllowedValues: boolean;
  allowedValues: Array<string>;
  allowedValuesFreeAllowed: boolean;
  defaultValue: string;
  readOnlyValue: string;
  multipleValue: string;
  areValuesSame(val1: string, val2: string): boolean;
}
