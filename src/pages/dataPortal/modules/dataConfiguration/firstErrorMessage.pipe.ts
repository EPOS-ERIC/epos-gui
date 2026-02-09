import { Pipe, PipeTransform } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { EPOS_MAT_DATE_FORMATS, EPOS_MAT_DATE_TIME_FORMATS } from 'app/app.materialDateFormats';
import moment from 'moment-es6';

export enum VALIDATION_ERRORS {
  PATTERN = 'custom_pattern',
  MIN = 'custom_min',
  MAX = 'custom_max',
  MATERIALS_REQUIRED = 'required',
  MATERIALS_DATEPICKER_PARSE = 'matDatepickerParse',
  MATERIALS_DATEPICKER_MIN = 'matDatepickerMin',
  MATERIALS_DATEPICKER_MAX = 'matDatepickerMax',
  MATERIALS_DATETIMEPICKER_PARSE = 'matDatetimePickerParse',
  MATERIALS_DATETIMEPICKER_MIN = 'matDatetimePickerMin',
  MATERIALS_DATETIMEPICKER_MAX = 'matDatetimePickerMax',
}

@Pipe({
  name: 'firstErrorMessage'
})
export class FirstErrorMessagePipe implements PipeTransform {

  transform(controlErrors: ValidationErrors | null | undefined): string {
    let returnMessage = '';


    if (null != controlErrors) {
      const firstErrorKey = Object.keys(controlErrors)[0];
      const firstErrorVal = controlErrors[firstErrorKey] as unknown;
      const firstErrorObj = firstErrorVal as Record<string, unknown>;
      switch (true) {
        case (VALIDATION_ERRORS.MATERIALS_REQUIRED as string === firstErrorKey):
          returnMessage = 'A value is required';
          break;
        case (VALIDATION_ERRORS.MATERIALS_DATEPICKER_PARSE as string === firstErrorKey):
          returnMessage = `Format required: '${String(EPOS_MAT_DATE_FORMATS.display.dateInput)}'`;
          break;
        case (VALIDATION_ERRORS.MATERIALS_DATETIMEPICKER_PARSE as string === firstErrorKey):
          returnMessage = `Format required: '${String(EPOS_MAT_DATE_TIME_FORMATS.display.dateInput)}'`;
          break;
        case (VALIDATION_ERRORS.MATERIALS_DATEPICKER_MIN as string === firstErrorKey): {
          const formattedValue = (firstErrorObj.min as moment.Moment).format(EPOS_MAT_DATE_FORMATS.display.dateInput as string);
          // as displayed in picker
          returnMessage = `Minimum allowed value: '${formattedValue}'`;
          break;
        }
        case (VALIDATION_ERRORS.MATERIALS_DATETIMEPICKER_MIN as string === firstErrorKey): {
          const formattedValue = (firstErrorObj.min as moment.Moment).format(EPOS_MAT_DATE_TIME_FORMATS.display.dateInput as string);
          // as displayed in picker
          returnMessage = `Minimum allowed value: '${formattedValue}'`;
          break;
        }
        case (VALIDATION_ERRORS.MATERIALS_DATEPICKER_MAX as string === firstErrorKey): {
          const formattedValue = (firstErrorObj.max as moment.Moment).format(EPOS_MAT_DATE_FORMATS.display.dateInput as string);
          // as displayed in picker
          returnMessage = `Maximum allowed value: '${formattedValue}'`;
          break;
        }
        case (VALIDATION_ERRORS.MATERIALS_DATETIMEPICKER_MAX as string === firstErrorKey): {
          const formattedValue = (firstErrorObj.max as moment.Moment).format(EPOS_MAT_DATE_TIME_FORMATS.display.dateInput as string);
          // as displayed in picker
          returnMessage = `Maximum allowed value: '${formattedValue}'`;
          break;
        }
        case (typeof firstErrorVal === 'string'):
          returnMessage = String(firstErrorVal);
          break;
        default:
          returnMessage = 'Unknown validation error';
          break;
      }
    }
    return returnMessage;
  }
}
