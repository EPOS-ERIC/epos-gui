import { EnvironmentResourceStatus } from './environmentResourceStatus.enum';

export interface EnvironmentResource {
  itemid: string | undefined;
  resourceid: string;
  name: string;
  description: string;
  format: string;
  url: string;
  status: EnvironmentResourceStatus | undefined;
}
