import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';
import { ParameterDefinition } from 'api/webApi/data/parameterDefinition.interface';
import { ParameterType } from 'api/webApi/data/parameterType.enum';
import { VALIDATION_ERRORS } from './firstErrorMessage.pipe';

@Directive({
  selector: '[appParameterValidator]',
  providers: [{ provide: NG_VALIDATORS, useExisting: ParameterValidatorDirective, multi: true }]
})
export class ParameterValidatorDirective implements Validator {
  @Input('appParameterValidator') param: ParameterDefinition;

  validate(control: AbstractControl): Record<string, unknown> | null {
    const validation: Record<string, unknown> = {};

    if (!this.param.hasAllowedValues) {
      const value = (null == control.value) ? '' : String(control.value).valueOf().trim();
      if ('' === value) {
        if (!this.param.optional) {
          validation[VALIDATION_ERRORS.MATERIALS_REQUIRED] = true; // same as standard materials validation fail format
        }
      } else {
        switch (this.param.type) {
          case (ParameterType.STRING):
            this.validateString(validation, value);
            break;
          case (ParameterType.INTEGER):
          case (ParameterType.FLOAT):
            this.validateNumber(validation, value);
            break;
          case (ParameterType.TIME):
            this.validateTime(validation, value);
            break;
        }
      }
    }
    return (0 === Object.keys(validation).length) ? null : validation;
  }

  private timeToMins(timeString: string): null | number {
    let returnVal: null | number = null;
    // 01:01
    if (/^\d{1,2}:\d{1,2}$/.test(timeString)) {
      const split = timeString.split(':');
      const hours = Math.min(23, Number(split[0]).valueOf());
      const mins = Math.min(59, Number(split[1]).valueOf());
      returnVal = (hours * 60) + mins;
    }
    return returnVal;
  }

  private minValid(value: null | string | number, min: null | string | number): boolean {
    return ((null == min) || ('' === min) || (Number(value).valueOf() >= Number(min).valueOf()));
  }

  private maxValid(value: null | string | number, max: null | string | number): boolean {
    return ((null == max) || ('' === max) || (Number(value).valueOf() <= Number(max).valueOf()));
  }

  private validateString(validation: Record<string, unknown>, value: string) {
    if ('' !== this.param.regex) {
      const regex = new RegExp(this.param.regex);
      if (!regex.test(value)) {
        validation[VALIDATION_ERRORS.PATTERN] = `Value does not match pattern '${this.param.regex}'`;
        console.log(`Invalid value: '${value}', pattern: ${this.param.regex}`);
      }
    }
  }

  private validateNumber(validation: Record<string, unknown>, value: string | number) {
    if (!this.minValid(value, this.param.min)) {
      validation[VALIDATION_ERRORS.MIN] = `Minimum value: ${this.param.min}`;
    }
    if (!this.maxValid(value, this.param.max)) {
      validation[VALIDATION_ERRORS.MAX] = `Maximum value: ${this.param.max}`;
    }
  }

  private validateTime(validation: Record<string, unknown>, value: string) {
    const valueMins = this.timeToMins(value);
    if (!this.minValid(valueMins, this.timeToMins(this.param.min))) {
      validation[VALIDATION_ERRORS.MIN] = `Minimum value: ${this.param.min}`;
    }
    if (!this.maxValid(valueMins, this.timeToMins(this.param.max))) {
      validation[VALIDATION_ERRORS.MAX] = `Maximum value: ${this.param.max}`;
    }
  }
}
