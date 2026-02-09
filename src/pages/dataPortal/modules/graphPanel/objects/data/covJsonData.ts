import moment from 'moment-es6';
import { PlotType } from 'plotly.js';
import { Trace ,ModePlotly } from '../trace';


enum TraceDataTypes {
  PARAMETER_GROUP = 'ParameterGroup',
  PARAMETER = 'Parameter',
  ERROR_MAX = 'error_max',
  ERROR_MIN = 'error_min',
}



export class CovJsonData {
  private readonly _traces = new Array<Trace>();
  constructor(private readonly dataConfigurableId: string) {
  }

  get traces(): Array<Trace> {
    return this._traces;
  }

  public createTraces(data: Record<string, unknown>): Array<Trace> {
    // some services with Graph visualization do not have 'type' property specified. These services are all single Coverage. This is why we check here for 'data.type == null'.
    // GNSS has to pass 'type' (all the services have to!) !!!
    // Coverage
    if (data.type === 'Coverage' || data.type == null ) {
      const members: string[] = [];
      let errorMax: Array<string> = [];
      let errorMin: Array<string> = [];
      // First pass: Populate members
      for (const key of Object.keys(this.getDataValue(data, ['parameters']))) {
        const covJsonType = this.getDataValue<string>(data, ['parameters', key, 'type']);
        if (covJsonType === (TraceDataTypes.PARAMETER_GROUP as string)) {
          const newMembers = this.getDataValue<string[]>(data, ['parameters', key, 'members']) || [];
          members.push(...newMembers);
        }
      }
      // Second pass: Process traces
      for (const key of Object.keys(this.getDataValue(data, ['parameters']))) {
        const covJsonType = this.getDataValue<string>(data, ['parameters', key, 'type']);
        const paramId = this.getDataValue<string>(data, ['parameters', key, 'observedProperty', 'id']);
        const mode = this.getMode(this.getDataValue(data, ['parameters' , key , 'plotType']));
        if (covJsonType === (TraceDataTypes.PARAMETER as string)) {
          const type = this.getType(this.getDataValue(data, ['domain', 'domainType']));
          const name = this.getDataValue<string>(data, ['parameters', key, 'observedProperty', 'label', 'en']);
          const description = this.getDataValue<string>(data, ['parameters', key, 'description', 'en']);
          const yUnit = this.getDataValue<string>(data, ['parameters', key, 'unit', 'symbol', 'value'], true);
          let yUnitLabel = this.getDataValue<string>(data, ['parameters', key, 'unit', 'label', 'en'], true);
          if (yUnitLabel === '') {
            yUnitLabel = this.getDataValue<string>(data, ['parameters', key, 'observedProperty', 'label', 'en'], true);
          }
          const yValues = this.getAxisValues(this.getDataValue(data, ['ranges', key]));
          const xValues = this.getAxisValues(this.getDataValue(data, ['domain', 'axes', 't']));
          if (paramId === (TraceDataTypes.ERROR_MAX as string)) {
            errorMax = this.getAxisValues(this.getDataValue(data, ['ranges', key]));
          }
          if (paramId === (TraceDataTypes.ERROR_MIN as string)) {
            errorMin = this.getAxisValues(this.getDataValue(data, ['ranges', key]));
          }
          if (type !== null) {
            const trace = new Trace(this.dataConfigurableId, key + this.dataConfigurableId, type, name, description, yUnit, yUnitLabel, yValues, xValues ,mode);
            if (key !== (TraceDataTypes.ERROR_MIN as string) && key !== (TraceDataTypes.ERROR_MAX as string)) {
              this._traces.push(trace);
            }
            if (members.length > 0) {
              if (members.includes(key) && key !== (TraceDataTypes.ERROR_MIN as string) && key !== (TraceDataTypes.ERROR_MAX as string)) {
                this.addErrorTrace(trace, errorMin, errorMax);
              }
            }
          }
        }
      }
      return this._traces;
    }
    // CoverageCollection
    else {
      Object.keys(this.getDataValue(data, ['coverages'])).forEach((key: string) => {
        // CoverageCollection
        const type = this.getType(this.getDataValue(data, ['coverages', '0' , 'domain', 'domainType']));
        const name = this.getDataValue<string>(data, ['coverages', key, 'name']);
        let ccParamDesc: string = '';
        let ccParamYUnit: string = '';
        let ccParamYUnitLabel: string = '';
        let ccParamYValues: string[] = [];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const ranges = this.getDataValue<object>(data, ['coverages', key, 'ranges']);

        for (const rangeKey of Object.keys(ranges)) {
          ccParamDesc = this.getDataValue<string>(data, ['parameters', rangeKey, 'description', 'en']);
          ccParamYUnit = this.getDataValue<string>(data, ['parameters', rangeKey, 'unit', 'symbol']);
          ccParamYUnitLabel = this.getDataValue<string>(data, ['parameters', rangeKey, 'observedProperty', 'label', 'en'], true);
          ccParamYValues = this.getAxisValues(this.getDataValue(data, ['coverages', key, 'ranges', rangeKey]));

          // const mode = this.getMode(this.getDataValue(data, ['parameters' , rangeKey, 'plotType']));

          const description = ccParamDesc;
          const yUnit = ccParamYUnit;
          const yUnitLabel = ccParamYUnitLabel;
          /* if (yUnitLabel === '') {
            yUnitLabel = this.getDataValue<string>(data, ['parameters', key, 'observedProperty', 'label', 'en'], true);
          } */

          const yValues = ccParamYValues; // this.getAxisValues(this.getDataValue(data, ['coverages', key, 'ranges', key, 'values']));
          const xValues = this.getAxisValues(this.getDataValue(data, ['coverages', key, 'domain', 'axes', 't']));

          if (null != type) {
            this._traces.push(
              new Trace(
                this.dataConfigurableId,
                key + this.dataConfigurableId + rangeKey,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                type,
                name + ' - ' + rangeKey,
                description,
                yUnit,
                yUnitLabel,
                yValues,
                xValues,
                // mode,
              ),
            );
          }
        }

      });
      return this._traces;
    }
  }

  public addErrorTrace(rawErrorTrace: Trace, errorMin: Array<string>, errorMax: Array<string>): void {
    const errorTrace = new Trace(
      this.dataConfigurableId,
      rawErrorTrace.id + this.dataConfigurableId,
      rawErrorTrace.type,
      rawErrorTrace.name + ' with errors',
      rawErrorTrace.description,
      rawErrorTrace.yUnit,
      rawErrorTrace.yUnitLabel,
      rawErrorTrace.yValues,
      rawErrorTrace.xValues,
      rawErrorTrace.mode,
    );
    errorTrace.yErrorMinValues = errorMin;
    errorTrace.yErrorMaxValues = errorMax;
    this._traces.push(errorTrace);
  }

  /**
   * @param valuesObject either of form:
   * numbers:
   * { "values": [0.1, 0.2, ... ,0.3] }
   * { "start": -179.5, "stop": 179.5, "num": 360 }
   * date/time:
   * { "values": ["2018-01-01T00:00:00.000Z", "2018-01-02T00:00:00.000Z", ..., "2018-01-01T23:59:00.000Z"] }
   * { "start": "2018-01-01T00:00:00.000Z", "stop": "2018-01-01T23:59:00.000Z", "num": 1440 }
   */
  // TODO lint: new return type and forced conversions to string need testing!
  public getAxisValues(valuesObject: Record<string, unknown>): Array<string> {
    let axisValues = new Array<string>();
    try {
      // values in array form
      if (null != valuesObject.values) {
        axisValues = (valuesObject.values as Array<unknown>).map((val) => String(val));
      } else if (typeof valuesObject.num === 'number') {
        // values need expanding
        const count = valuesObject.num;
        if (typeof valuesObject.start === 'number') {
          axisValues = this.temporalValuesFromNumbers(valuesObject.start, Number(valuesObject.stop), count);
        } else if (typeof valuesObject.start === 'string' && moment.utc(valuesObject.start).isValid()) {
          axisValues = this.temporalValuesFromDateStrings(valuesObject.start, String(valuesObject.stop), count);
        }
      }
    } catch (e) {
      console.warn('CovJSON data: problem proceessing axis values', valuesObject);
    }
    return axisValues;
  }

  private temporalValuesFromDateStrings(startString: string, stopString: string, count: number): Array<string> {
    const start = moment.utc(startString);
    const stop = moment.utc(stopString);
    const min = Math.min(start.valueOf(), stop.valueOf());
    const max = Math.max(start.valueOf(), stop.valueOf());
    const increment = (max - min) / (count - 1);
    const expandedValues = new Array<string>();
    for (let i = min; i <= max; i += increment) {
      expandedValues.push(moment.utc(i).toISOString());
    }
    if (start.isAfter(stop)) {
      expandedValues.reverse();
    }
    return expandedValues;
  }

  private temporalValuesFromNumbers(start: number, stop: number, count: number): Array<string> {
    // numbers
    const min = Math.min(start, stop);
    const max = Math.max(start, stop);
    const increment = (max - min) / (count - 1);
    const expandedValues = new Array<string>();
    for (let i = min; i <= max; i += increment) {
      expandedValues.push(String(i));
    }
    if (start > stop) {
      expandedValues.reverse();
    }
    return expandedValues;
  }

  private getDataValue<T = unknown>(data: Record<string, unknown>, path: Array<string>, onlyString = false): T {
    let value = data as unknown;
    path.forEach((pathSection: string) => {
      if ((value as Record<string, unknown>)[pathSection] !== undefined) {
        value = (value as Record<string, unknown>)[pathSection];
        if (null == value) {
          return null;
        }
      }
    });

    if (onlyString === true && typeof value === 'object') {
      value = '';
    }

    return value as T;
  }

  private getType(type: string): null | PlotType {
    switch (type) {
      case 'PointSeries':
        return 'scatter';
      default:
        console.warn(`Unrecognised trace type: '${type}' `);
        return null;
    }
  }

  private getMode(mode: string): ModePlotly{
    switch (mode) {
      case 'https://www.data-to-viz.com/graph/scatter.html':
        return 'markers';
      default:
        console.warn(`Unrecognised trace mode: '${mode}' `);
        return  'lines';
    }
  }
}
