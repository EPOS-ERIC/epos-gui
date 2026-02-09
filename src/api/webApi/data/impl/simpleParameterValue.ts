import { ParameterValue } from 'api/webApi/data/parameterValue.interface';

export class SimpleParameterValue implements ParameterValue {

  constructor(
    public readonly name: string,
    public readonly value: string,
  ) {
  }

  /**
   * The function "make" creates a new instance of the "SimpleParameterValue" class with the given name
   * and value.
   * @param {string} name - A string representing the name of the parameter.
   * @param {string} value - The value parameter is a string that represents the value of the parameter.
   * @returns An instance of the SimpleParameterValue class with the provided name and value.
   */
  public static make(
    name: string,
    value: string,
  ): SimpleParameterValue {
    // create param
    return new SimpleParameterValue(
      name,
      value,
    );
  }
}
