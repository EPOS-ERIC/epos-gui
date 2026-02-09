import { Identifiable } from '../identifiable.interface';
import { Confirm } from 'api/webApi/utility/preconditions';

export class SimpleResultFilter implements Identifiable {

  protected constructor( //
    protected readonly identifier: string, //
    protected readonly name: string, //
  ) { }

  public static make(
    identifier: string,
    name: string,

  ): Identifiable {
    Confirm.requiresValidString(identifier);
    Confirm.requiresValidString(name);
    return new SimpleResultFilter(identifier, name);
  }
  getName(): string {
    return this.name;
  }
  getIdentifier(): string {
    return this.identifier;
  }
}

