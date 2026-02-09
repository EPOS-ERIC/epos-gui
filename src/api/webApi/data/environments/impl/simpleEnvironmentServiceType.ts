import { Confirm } from 'api/webApi/utility/preconditions';
import { EnvironmentServiceType } from '../environmentServiceType.interface';

export class SimpleEnvironmentServiceType implements EnvironmentServiceType {

  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly href: string,
    public readonly provider: string,
  ) { }

  public static make(identifier: string, name: string, description: string, href: string, provider: string): EnvironmentServiceType {
    Confirm.requiresValid(identifier);
    Confirm.requiresValidString(name);
    Confirm.requiresValid(description);
    Confirm.requiresValid(href);
    Confirm.requiresValid(provider);
    return new SimpleEnvironmentServiceType(identifier, name, description, href, provider);
  }


  getName(): string {
    return this.name;
  }
  getIdentifier(): string {
    return this.id;
  }
  getDescription(): string {
    return this.description;
  }

  getHref(): string {
    return this.href;
  }

  getProvider(): string {
    return this.provider;
  }

}
