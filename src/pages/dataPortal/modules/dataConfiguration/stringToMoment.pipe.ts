import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment-es6';

@Pipe({
  name: 'stringToMoment'
})
export class StringToMomentPipe implements PipeTransform {

  transform(dateString: string, format: string): null | moment.Moment {
    return ('' === dateString) ? null : moment.utc(dateString, format);
  }
}
