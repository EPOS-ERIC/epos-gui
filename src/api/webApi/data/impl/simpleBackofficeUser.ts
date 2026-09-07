/* eslint-disable no-trailing-spaces */
 import { Confirm } from 'api/webApi/utility/preconditions';

 export class SimpleBackOfficeUser {
   
    private constructor(
     private readonly authIdentifier: string,
     private readonly email: string,
     private readonly firstName: string,
     private readonly groups: Array<unknown>,
   ) {
     this.authIdentifier = authIdentifier;
     this.email = email;
     this.firstName = firstName;
     this.groups = groups;
   }
 
   public static make(authIdentifier: string, email: string, firstName: string, groups: Array<unknown>): SimpleBackOfficeUser {
     Confirm.requiresValidString(authIdentifier);
     Confirm.requiresValidString(email);
     return new SimpleBackOfficeUser(authIdentifier, email, firstName, groups);
   }
 
   getGroups(): Array<unknown> {
     return this.groups;
   }
}

