import { User } from 'api/webApi/data/user.interface';
import { Confirm } from '../../utility/preconditions';

export class SimpleUser implements User {

  constructor(
    private readonly id: string,
    private readonly username: string,
    private readonly token: string,
    private readonly email: string) {
    Confirm.isValidString(id, true);
    Confirm.isValidString(username, true);
    Confirm.isValidString(token, true);
    Confirm.isValidString(email, true);
  }

  public getName(): string {
    return this.username;
  }

  public getToken(): string {
    return this.token;
  }

  public getIdentifier(): string {
    return this.id;
  }

  public getEmail(): string {
    return this.email;
  }


}
