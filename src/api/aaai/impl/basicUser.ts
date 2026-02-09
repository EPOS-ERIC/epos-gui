import { AAAIUser } from '../aaaiUser.interface';
import { SimpleUser } from 'api/webApi/data/impl/simpleUser';
import { User } from 'api/webApi/data/user.interface';
import { UserInfo } from 'angular-oauth2-oidc';

export class BasicUser implements AAAIUser {
  private constructor(
    private readonly id: string,
    private readonly username: string,
    private readonly token: string,
    private readonly email: string,
  ) { }

  public static make(id: null | string, name: null | string, token: string, email: null | string): null | BasicUser {

    if ((id && id !== '')
      && (name && name !== '')
      && (token && token !== '')
      && (email && email !== '')
    ) {
      return new BasicUser(id, name, token, email);
    }

    return null;
  }

  public static makeOrDefault(id: null | string, name: null | string, token: string, email: null | string): null | AAAIUser {
    return BasicUser.make(id, name, token, email);
  }

  public static makeFromProfileResponse(token: string, profileObject: UserInfo): null | AAAIUser {
    // Needs updating when we know what the object looks like
    return BasicUser.make(profileObject.email as string, profileObject.email as string, token, profileObject.email as string);
  }


  public getUsername(): string {
    return this.username;
  }

  public getEmail(): string {
    return this.email;
  }

  public getToken(): string {
    return this.token;
  }

  public getIdentifier(): string {
    return this.id;
  }

  public getAsApiUser(): User {
    return new SimpleUser(this.getIdentifier(), this.getUsername(), this.getToken(), this.getEmail());
  }
}

