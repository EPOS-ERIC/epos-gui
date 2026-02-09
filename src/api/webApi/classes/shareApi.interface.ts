export interface ShareApi {

  saveConfigurables(value: string): Promise<string>;

  retrieveConfigurables(key: string): Promise<string | null>;
}
