import { Identifiable } from 'api/webApi/data/identifiable.interface';
import { Described } from 'api/webApi/data/described.interface';
import { EnvironmentResource } from './environmentResource.interface';

export interface Environment extends Identifiable, Described {
  id: string;
  name: string;
  description: string;
  serviceId: string;
  accessUrl: string;
  resources: Array<EnvironmentResource>;
}
