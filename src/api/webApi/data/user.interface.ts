import { Identifiable } from 'api/webApi/data/identifiable.interface';

export interface User extends Identifiable {

  getToken(): string;
  getEmail(): string;

}
