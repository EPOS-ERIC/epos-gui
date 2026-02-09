import { EnvironmentServiceType } from './environmentServiceType.interface';

export interface EnvironmentType {
  type: string;
  services: Array<EnvironmentServiceType>;
}
