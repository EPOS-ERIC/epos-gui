import { Identifiable } from './identifiable.interface';

export interface Organization extends Identifiable {
  getUrl(): string;
  getCountry(): string;
  getLogoUrl(): string | null;
}
