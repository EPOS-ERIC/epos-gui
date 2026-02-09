import { Confirm } from '../../utility/preconditions';
import { ParameterDefinition } from '../parameterDefinition.interface';
import { ParameterValue } from '../parameterValue.interface';
import { SimpleParameterValue } from './simpleParameterValue';
import { ParameterDefinitions } from '../parameterDefinitions.interface';
import { ParameterProperty } from '../parameterProperty.enum';
import { BoundingBox } from '../boundingBox.interface';
import { TemporalRange } from '../temporalRange.interface';
import { SimpleBoundingBox } from './simpleBoundingBox';
import moment from 'moment-es6';
import { SimpleTemporalRange } from './simpleTemporalRange';
import { ParameterType } from '../parameterType.enum';

/** The `SimpleParameterDefinitions` class is a TypeScript implementation of the `ParameterDefinitions`
interface, which provides methods for managing and manipulating parameter definitions. */
export class SimpleParameterDefinitions implements ParameterDefinitions {

  /** The line `private spatialParamDefs: null | Array<ParameterDefinition>;` is declaring a private
  property named `spatialParamDefs` in the `SimpleParameterDefinitions` class. This property can hold
  either a `null` value or an array of `ParameterDefinition` objects. */
  private spatialParamDefs: null | Array<ParameterDefinition>;

  /** The line `private temporalParamDefs: null | Array<ParameterDefinition>;` is declaring a private
  property named `temporalParamDefs` in the `SimpleParameterDefinitions` class. This property can hold
  either a `null` value or an array of `ParameterDefinition` objects. */
  private temporalParamDefs: null | Array<ParameterDefinition>;

  /**
   * The function is a private constructor that takes an array of parameter definitions and extracts
   * spatial and temporal parameter definitions from it.
   * @param paramDefs - The `paramDefs` parameter is an array of `ParameterDefinition` objects.
   */
  private constructor( //
    private readonly paramDefs: Array<ParameterDefinition>, //
  ) {
    this.extractSpatialParamDefs();
    this.extractTemporalParamDefs();
  }

  /**
   * The function "make" creates a new instance of "SimpleParameterDefinitions" using the provided
   * array of "ParameterDefinition" objects.
   * @param paramDefs - An array of ParameterDefinition objects.
   * @returns a new instance of the `SimpleParameterDefinitions` class, passing in the `paramDefs`
   * array as a parameter.
   */
  public static make(
    paramDefs: Array<ParameterDefinition>, //
  ): ParameterDefinitions {
    // objects
    Confirm.requiresValid(paramDefs);

    return new SimpleParameterDefinitions(
      paramDefs, //
    );
  }

  /**
   * The function checks if there are spatial parameters defined.
   * @returns A boolean value indicating whether the `spatialParamDefs` property is not null.
   */
  public hasSpatialParameters(): boolean {
    return (this.spatialParamDefs != null);
  }

  /**
   * The function checks if there are temporal parameters defined.
   * @returns A boolean value indicating whether the `temporalParamDefs` property is not null.
   */
  public hasTemporalParameters(): boolean {
    return (this.temporalParamDefs != null);
  }

  /**
   * The function returns a copy of an array of parameter definitions.
   * @returns An array of ParameterDefinition objects.
   */
  public getParameters(): Array<ParameterDefinition> {
    return this.paramDefs.slice();
  }
  /**
   * The function getSpatialParameters returns an array of ParameterDefinition objects or null.
   * @returns The method is returning either a null value or an array of ParameterDefinition objects.
   */
  public getSpatialParameters(): null | Array<ParameterDefinition> {
    return (null != this.spatialParamDefs) ? this.spatialParamDefs.slice() : null;
  }

  /**
   * The function returns an array of temporal parameter definitions or null if there are no temporal
   * parameters.
   * @returns The method is returning either a null value or an array of ParameterDefinition objects.
   */
  public getTemporalParameters(): null | Array<ParameterDefinition> {
    return (null != this.temporalParamDefs) ? this.temporalParamDefs.slice() : null;
  }

  /**
   * The function `getOtherParameters` returns an array of parameter definitions excluding spatial and
   * temporal parameters.
   * @returns an array of ParameterDefinition objects, or null if there are no other parameters.
   */
  public getOtherParameters(): null | Array<ParameterDefinition> {
    const allParamDefs = this.getParameters();

    const otherParamDefs = (null == allParamDefs) ? null : allParamDefs;
    if (otherParamDefs != null) {
      // remove spatial and temporal params from array
      let spatialParamDefs = this.getSpatialParameters();
      spatialParamDefs = (spatialParamDefs == null) ? [] : spatialParamDefs;

      let temporalParamDefs = this.getTemporalParameters();
      temporalParamDefs = (temporalParamDefs == null) ? [] : temporalParamDefs;

      const defsToRemove = spatialParamDefs.concat(temporalParamDefs);
      defsToRemove.forEach((removeDef: ParameterDefinition) => {
        const index = otherParamDefs.findIndex((otherDef: ParameterDefinition) => {
          return (removeDef.name === otherDef.name);
        });
        if (index > -1) {
          otherParamDefs.splice(index, 1);
        }
      });
    }
    return otherParamDefs;
  }

  /**
   * The function `getParameter` returns a `ParameterDefinition` object from an array based on a given
   * key.
   * @param {string} key - The `key` parameter is a string that represents the name of the parameter
   * that we want to retrieve.
   * @returns The `getParameter` function returns a `ParameterDefinition` object.
   */
  public getParameter(key: string): ParameterDefinition {
    return this.paramDefs.find((param: ParameterDefinition) => (param.name === key))!;
  }

  /**
   * The function `getParameterByProperty` returns a `ParameterDefinition` object based on the
   * specified `property` value.
   * @param {ParameterProperty} property - The "property" parameter is of type "ParameterProperty".
   * @returns The `getParameterByProperty` function returns a `ParameterDefinition` object.
   */
  public getParameterByProperty(property: ParameterProperty): ParameterDefinition {
    return this.paramDefs.find((param: ParameterDefinition) => (param.property === property))!;
  }

  /**
   * The function getDefaultParameterValues returns an array of ParameterValue objects with default
   * values based on a given array of ParameterDefinition objects.
   * @returns An array of ParameterValue objects.
   */
  public getDefaultParameterValues(): Array<ParameterValue> {
    return this.paramDefs
      .map((definition: ParameterDefinition) => {
        return new SimpleParameterValue(definition.name, definition.defaultValue);
      });
  }

  /**
   * The function returns the parameter definition at the specified index.
   * @param {number} index - The parameter "index" is of type "number".
   * @returns The method is returning a ParameterDefinition object.
   */
  public get(index: number): ParameterDefinition {
    return this.getParameters()[index];
  }

  /**
   * The size function returns the number of parameters in the current context.
   * @returns The size of the parameters array.
   */
  public size(): number {
    return this.getParameters().length;
  }

  /**
   * The function updates spatial parameters using a bounding box and returns the updated parameters.
   * @param {BoundingBox} boundingBox - The `boundingBox` parameter is of type `BoundingBox`. It
   * represents a rectangular region defined by its maximum and minimum latitude and longitude values.
   * @param paramsToUpdate - An array of ParameterValue objects that need to be updated with new values
   * based on the boundingBox.
   * @returns an array of ParameterValue objects.
   */
  public updateSpatialParamsUsingBounds(
    boundingBox: BoundingBox,
    paramsToUpdate: Array<ParameterValue>,
  ): Array<ParameterValue> {
    if (null == this.spatialParamDefs) {
      console.warn('updateSpatialParamsUsingBounds called when Spatial Param Definitions not available.');
    } else {
      const replacementsArray = [
        [this.spatialParamDefs[0].name, (boundingBox.isBounded()) ? boundingBox.getMaxLat().toString() : ''],
        [this.spatialParamDefs[1].name, (boundingBox.isBounded()) ? boundingBox.getMaxLon().toString() : ''],
        [this.spatialParamDefs[2].name, (boundingBox.isBounded()) ? boundingBox.getMinLat().toString() : ''],
        [this.spatialParamDefs[3].name, (boundingBox.isBounded()) ? boundingBox.getMinLon().toString() : ''],
      ];
      replacementsArray.forEach((item: [string, string]) => {
        this.replaceParamValueInArray(paramsToUpdate, item[0], new SimpleParameterValue(item[0], item[1]));
      });
    }

    return paramsToUpdate;
  }

  /**
   * The function `updateTemporalParamsUsingRange` updates the values of temporal parameters in an
   * array based on a given temporal range.
   * @param {TemporalRange} tempRange - The `tempRange` parameter is of type `TemporalRange`. It
   * represents a range of temporal values, such as a start and end date or time.
   * @param paramsToUpdate - An array of ParameterValue objects that need to be updated with new
   * values.
   * @returns the updated array of ParameterValue objects, `paramsToUpdate`.
   */
  public updateTemporalParamsUsingRange(
    tempRange: TemporalRange,
    paramsToUpdate: Array<ParameterValue>,
  ): Array<ParameterValue> {
    if (null == this.temporalParamDefs) {
      console.warn('updateTemporalParamsUsingRange called when Temporal Param Definitions not available.');
    } else {
      const lower = tempRange.getLowerBound();
      const upper = tempRange.getUpperBound();
      const replacementsArray = [
        [this.temporalParamDefs[0].name, (null != lower) ? lower.format() : ''],
        [this.temporalParamDefs[1].name, (null != upper) ? upper.format() : ''],
      ];
      replacementsArray.forEach((item: [string, string]) => {
        this.replaceParamValueInArray(paramsToUpdate, item[0], new SimpleParameterValue(item[0], item[1]));
      });
    }
    return paramsToUpdate;
  }

  /**
   * The function getSpatialBounds returns a BoundingBox object based on the provided array of
   * ParameterValues.
   * @param paramValues - An array of objects representing parameter values. Each object has two
   * properties: "name" (string) and "value" (any).
   * @returns a BoundingBox object.
   */
  public getSpatialBounds(paramValues: Array<ParameterValue>): BoundingBox {
    let returnVal = SimpleBoundingBox.makeUnbounded();
    if (this.hasSpatialParameters()) {
      const valuesArray = this.getSpatialParameters()!
        .map((def: ParameterDefinition) => {
          const paramValue = paramValues.find((thisParamValue: ParameterValue) => (thisParamValue.name === def.name));
          return (paramValue != null) ? paramValue.value : '';
        })
        .filter((value: string) => (value !== ''));
      if (valuesArray.length === 4) {
        returnVal = SimpleBoundingBox.makeFromArray(valuesArray);
      }
    }
    return returnVal;
  }

  /**
   * The function `getTemporalRange` takes an array of parameter values and returns a `TemporalRange`
   * object based on the values of the temporal parameters.
   * @param paramValues - An array of objects representing parameter values. Each object has two
   * properties: "name" (string) and "value" (string).
   * @returns a TemporalRange object.
   */
  public getTemporalRange(paramValues: Array<ParameterValue>): TemporalRange {
    const valuesArray = new Array<null | moment.Moment>();
    if (this.hasTemporalParameters()) {
      this.getTemporalParameters()!.forEach((def: ParameterDefinition) => {
        const paramValue = paramValues.find((thisParamValue: ParameterValue) => (thisParamValue.name === def.name));
        const stringValue = (paramValue != null) ? paramValue.value : '';
        console.warn(stringValue);
        const format = def.format;
        valuesArray.push((stringValue === '') ? null : (

          moment(stringValue, format, true).isValid() ? moment.utc(stringValue, format) : moment.utc(stringValue))

        );
        console.warn('Moment.UTC: ', moment.utc(stringValue));
        console.warn('Moment: ', moment(stringValue));
      });
    }
    return SimpleTemporalRange.makeUnchecked(valuesArray[0], valuesArray[1]);
  }

  /**
   * The function filters out spatial parameter values from an array of parameter values.
   * @param values - The parameter "values" is an array of ParameterValue objects.
   * @returns an array of ParameterValue objects.
   */
  public filterOutSpatialParamValues(values: Array<ParameterValue>): Array<ParameterValue> {
    return this.filterParamValues(this.getSpatialParameters(), values, false);
  }

  /**
   * The function filters out temporal parameter values from an array of parameter values.
   * @param values - An array of ParameterValue objects.
   * @returns an array of ParameterValue objects.
   */
  public filterOutTemporalParamValues(values: Array<ParameterValue>): Array<ParameterValue> {
    return this.filterParamValues(this.getTemporalParameters(), values, false);
  }

  /**
   * The function filters an array of parameter values based on a given array of parameter definitions
   * and a filter condition.
   * @param {null | Array<ParameterDefinition>} _paramDefsToFilterBy - A nullable array of
   * ParameterDefinition objects.
   * @param values - An array of ParameterValue objects.
   * @param {boolean} filterIn - A boolean value indicating whether to filter in or filter out the
   * parameter values. If `filterIn` is true, the function will filter in the parameter values that
   * match the parameter definitions. If `filterIn` is false, the function will filter out the
   * parameter values that match the parameter definitions.
   * @returns an array of ParameterValues that match the specified filter criteria.
   */
  public filterParamValues(
    _paramDefsToFilterBy: null | Array<ParameterDefinition>,
    values: Array<ParameterValue>,
    filterIn: boolean,
  ): Array<ParameterValue> {
    const paramDefsToFilterBy = (null == _paramDefsToFilterBy) ? [] : _paramDefsToFilterBy;
    return values.filter((thisValue: ParameterValue) => {
      const matchedParamValue = paramDefsToFilterBy.find((thisDef: ParameterDefinition) => {
        return (thisDef.name === thisValue.name);
      });
      return (filterIn === (null != matchedParamValue));
    });
  }

  /**
   * The function replaces a parameter value in an array if it exists, otherwise it adds the new value
   * to the array.
   * @param params - An array of ParameterValue objects.
   * @param {string} paramName - The `paramName` parameter is a string that represents the name of the
   * parameter whose value needs to be replaced in the `params` array.
   * @param {ParameterValue} newValue - The `newValue` parameter is of type `ParameterValue`.
   */
  public replaceParamValueInArray(params: Array<ParameterValue>, paramName: string, newValue: ParameterValue): void {
    const paramIndex = this.findParamIndexByName(params, paramName);
    if (paramIndex > -1) {
      // replace
      params.splice(paramIndex, 1, newValue);
    } else {
      // add
      params.push(newValue);
    }
  }

  /**
   * The function finds the index of a parameter in an array based on its name.
   * @param params - An array of ParameterValue objects.
   * @param {string} paramName - The `paramName` parameter is a string that represents the name of the
   * parameter you want to find in the `params` array.
   * @returns the index of the parameter with the specified name in the given array of parameters.
   */
  private findParamIndexByName(params: Array<ParameterValue>, paramName: string): number {
    return params.findIndex((value: ParameterValue) => value.name === paramName);
  }

  /**
   * The function extracts spatial parameter definitions from a list of parameter definitions.
   */
  private extractSpatialParamDefs(): void {
    if (this.paramDefs != null) {
      const spatialParamDefs = [
        this.paramDefs.find((paramDef: ParameterDefinition) => (paramDef.property === ParameterProperty.NORTHERN_LATITUDE)),
        this.paramDefs.find((paramDef: ParameterDefinition) => (paramDef.property === ParameterProperty.EASTERN_LONGITUDE)),
        this.paramDefs.find((paramDef: ParameterDefinition) => (paramDef.property === ParameterProperty.SOUTHERN_LATITUDE)),
        this.paramDefs.find((paramDef: ParameterDefinition) => (paramDef.property === ParameterProperty.WESTERN_LONGITUDE)),
      ].filter((paramDef: ParameterDefinition) => paramDef != null);
      this.spatialParamDefs = (spatialParamDefs.length < 4) ? null : spatialParamDefs as Array<ParameterDefinition>;
    }
  }

  /**
   * The function `extractTemporalParamDefs` extracts parameter definitions related to temporal
   * properties from a list of parameter definitions.
   */
  private extractTemporalParamDefs(): void {
    if (this.paramDefs != null) {
      const temporalParamDefs = [
        this.paramDefs.find((paramDef: ParameterDefinition) => (
          paramDef.property === ParameterProperty.START_DATE && (
            paramDef.type === ParameterType.DATETIME || paramDef.type === ParameterType.DATE || paramDef.type === ParameterType.TIME
          )
        )) ?? null,
        this.paramDefs.find((paramDef: ParameterDefinition) => (
          paramDef.property === ParameterProperty.END_DATE && (
            paramDef.type === ParameterType.DATETIME || paramDef.type === ParameterType.DATE || paramDef.type === ParameterType.TIME
          )
        )) ?? null,
      ].filter((paramDef: ParameterDefinition) => paramDef != null);
      this.temporalParamDefs = (temporalParamDefs.length < 2) ? null : temporalParamDefs as Array<ParameterDefinition>;
    }
  }

}
