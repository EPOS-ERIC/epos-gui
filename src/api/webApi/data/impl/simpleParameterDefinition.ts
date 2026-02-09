import { ParameterDefinition } from 'api/webApi/data/parameterDefinition.interface';
import { ParameterType } from 'api/webApi/data/parameterType.enum';
import { ParameterProperty } from '../parameterProperty.enum';
import moment from 'moment-es6';

export class SimpleParameterDefinition implements ParameterDefinition {
  public readonly hasAllowedValues: boolean;
  public readonly defaultValue: string;

  private constructor(
    public readonly name: string,
    public readonly label: string,
    public readonly type: ParameterType,
    public readonly property: ParameterProperty,
    public readonly optional: boolean,
    public readonly min: string,
    public readonly max: string,
    public readonly regex: string,
    public readonly format: string,
    public readonly allowedValues: Array<string>,
    public readonly allowedValuesFreeAllowed: boolean,
    public readonly readOnlyValue: string,
    public readonly multipleValue: string,
    defaultValue: null | string,
  ) {
    // ensure a default value set, defaulted to empty string
    this.defaultValue = (null != defaultValue) ? defaultValue : (type === ParameterType.BOOLEAN ? 'false' : '');
    this.hasAllowedValues = (this.allowedValues.length > 0);

    // special case where the param is optional and it is a list of values that doesn't contain an
    // empty value and it is not a multi select.  Should really have an empty value as an option so we'll insert one.
    if ((this.hasAllowedValues) && (this.optional) && (!this.allowedValues.includes('') && (this.multipleValue !== 'true'))) {
      this.allowedValues.unshift('');
    }

    // convert to moment.js format notation
    if ((type === ParameterType.DATE) || (type === ParameterType.DATETIME)) {
      // format = ((null == format) || ('' === format)) ? 'YYYY-MM-DDTHH:mm:ssZ' : format;
      format = format.replace(/y/g, 'Y').replace(/d/g, 'D');
    }
  }

  public static make(
    name: string,
    label: string,
    type: ParameterType,
    property: ParameterProperty,
    optional: boolean,
    min: string,
    max: string,
    regex: string,
    format: string,
    allowedValues = new Array<string>(),
    allowedValuesFreeAllowed = false,
    readOnlyValue: string,
    multipleValue: string,
    defaultValue: null | string,
  ): SimpleParameterDefinition {
    // create param
    return new SimpleParameterDefinition(
      name,
      label,
      type,
      property,
      optional,
      min,
      max,
      regex,
      format,
      allowedValues,
      allowedValuesFreeAllowed,
      readOnlyValue,
      multipleValue,
      defaultValue,
    );
  }

  public areValuesSame(val1: string, val2: string): boolean {
    val1 = val1.trim();
    val2 = val2.trim();
    let valueFunc: (val: unknown) => unknown = (val: unknown) => String(val).toString();
    switch (this.type) {
      case (ParameterType.INTEGER):
      case (ParameterType.FLOAT):
        valueFunc = (val: string) => ('' === val) ? val : Number(val).valueOf();
        break;
      case (ParameterType.TIME): // 01:01
        valueFunc = (val: string) => ('' === val) ? val : moment.utc(val, 'HH:mm').format();
        break;
      case (ParameterType.DATE):
      case (ParameterType.DATETIME):
        valueFunc = (val: string) => ('' === val) ? val : moment.utc(val, this.format).format();
        break;
      case (ParameterType.BOOLEAN):
        val1 = val1.toLowerCase();
        val2 = val2.toLowerCase();
        break;
      // others may be OK with string comparison
    }

    const same = valueFunc(val1) === valueFunc(val2);
    return (same);
  }

}


