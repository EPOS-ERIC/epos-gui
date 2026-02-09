/**
 * Interface descibing the functions that a persister of model data must support.
 */
export interface Persister {
  set(key: string, value: unknown, circular: boolean, subKey: string | boolean): void;
  get(key: string): Promise<unknown>;
}
