import { User } from 'api/webApi/data/user.interface';

/**
 * Represents a User for authentication purposes.
 */
export interface AAAIUser {
  getUsername(): string;
  getEmail(): string;
  getToken(): string;
  getIdentifier(): string;
  getAsApiUser(): User;
}
