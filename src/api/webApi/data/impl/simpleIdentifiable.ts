import { Identifiable } from 'api/webApi/data/identifiable.interface';
import { Confirm } from 'api/webApi/utility/preconditions';


export class SimpleIdentifiable implements Identifiable {

  constructor(private readonly id: string, private readonly name: string) {
    this.id = Confirm.requiresValidString(id);
    this.name = Confirm.requiresValidString(name);
  }

  getName(): string {
    return this.name;
  }
  getIdentifier(): string {
    return this.id;
  }

}
