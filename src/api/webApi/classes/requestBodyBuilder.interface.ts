export interface RequestBodyBuilder {

  /**
   * returns JSON object.
   */
  build(): unknown;

  /**
   * Add parameter key and value
   */
  addParameter(key: string, value: string | object): RequestBodyBuilder;

  addParameters(map: Map<string, unknown>): RequestBodyBuilder;
}
