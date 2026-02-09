import { Confirm } from 'api/webApi/utility/preconditions';


export class Point {

  constructor(
    readonly latitude: number,
    readonly longitude: number,
    readonly elevation?: number,
  ) {
    Confirm.requiresValidNumber(latitude);
    Confirm.requiresValidNumber(longitude);
    if (elevation != null) {
      Confirm.requiresValidNumber(elevation);
    }
  }
}
