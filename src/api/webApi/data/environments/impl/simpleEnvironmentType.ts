import { Confirm } from 'api/webApi/utility/preconditions';
import { EnvironmentType } from '../environmentType.interface';
import { EnvironmentServiceType } from '../environmentServiceType.interface';

export class SimpleEnvironmentType implements EnvironmentType {

  private constructor(
    public readonly type: string,
    public readonly services: Array<EnvironmentServiceType>,
  ) { }

  public static make(type: string, services: Array<EnvironmentServiceType>): EnvironmentType {
    Confirm.requiresValidString(type);
    return new SimpleEnvironmentType(type, services);
  }


  getType(): string {
    return this.type;
  }

  getServices(): Array<EnvironmentServiceType> {
    return this.services;
  }

}
