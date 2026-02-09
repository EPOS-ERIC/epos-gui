import { Confirm } from './preconditions';
import { RequestBodyBuilder } from '../classes/requestBodyBuilder.interface';


export class SimpleRequestBodyBuilder implements RequestBodyBuilder {

  private readonly parameters: Map<string, unknown> = new Map<string, unknown>();

  private constructor() {
  }
  static makeRequestBodyBuilder(): RequestBodyBuilder {

    return new SimpleRequestBodyBuilder();
  }


  build(): string {
    return JSON.stringify(Object.fromEntries(this.parameters));
  }

  addParameters(map: Map<string, unknown>): RequestBodyBuilder {

    Confirm.isValid(map, true);

    map.forEach((v, k) => {
      this.addParameter(k, v);
    });

    return this;
  }

  addParameter(key: string, value: unknown): RequestBodyBuilder {
    Confirm.isValidString(key, true);
    Confirm.isValid(value, true);
    this.parameters.set(key, value);
    return this;
  }

}
