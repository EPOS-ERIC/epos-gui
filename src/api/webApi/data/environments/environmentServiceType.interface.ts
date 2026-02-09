import { Identifiable } from 'api/webApi/data/identifiable.interface';
import { Described } from 'api/webApi/data/described.interface';

export interface EnvironmentServiceType extends Identifiable, Described {
  id: string;
  name: string;
  description: string;
  href: string;
  provider: string;
}
