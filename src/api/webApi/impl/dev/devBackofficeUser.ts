/*
         Copyright 2021 EPOS ERIC

 Licensed under the Apache License, Version 2.0 (the License); you may not
 use this file except in compliance with the License.  You may obtain a copy
 of the License at

   http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an AS IS BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 License for the specific language governing permissions and limitations under
 the License.
 */
 import { BaseUrl } from 'api/webApi/classes/baseurl.interface';
 import { Rest } from 'api/webApi/classes/rest.interface';
 import { BackOfficeUserApi } from 'api/webApi/classes/backOfficeUser.interface';
 import { SimpleBackOfficeUser } from 'api/webApi/data/impl/simpleBackofficeUser';

 export class DevBackofficeUserApi implements BackOfficeUserApi {

   constructor(private readonly baseUrl: BaseUrl, private readonly rest: Rest) { }

    async getBackOfficeUser(self: string = 'self'): Promise<SimpleBackOfficeUser>{
        const builder = this.baseUrl.urlBuilder();
        builder.addPathElements('user', 'self');
        const url = builder.build();

        const json = await this.rest.get(url) as Array<{ authIdentifier: string; email: string; firstName: string; groups: [] }>;

        const userInfo: { authIdentifier: string; email: string; firstName: string; groups: [] } | null = json[0] ? json[0] : null;

        // user info properties
        let authIdentifier: string = '';
        let email: string = '';
        let firstName: string = '';
        let groups: unknown[] = [];

        if (!userInfo) {
            throw new Error('No backOffice User details found');
        }

        // authIdentifier
        if (!userInfo.authIdentifier) {
            throw new Error('No "authIdentifier" property in backOffice User response');
        }
        else{
            authIdentifier = userInfo.authIdentifier;
        }
        // email
        if (!userInfo.email) {
            throw new Error('No "email" property in backOffice User response');
        }
        else{
            email = userInfo.email;
        }
        // firstName
        if (!userInfo.firstName) {
            throw new Error('No "firstName" property in backOffice User response');
        }
        else{
            firstName = userInfo.firstName;
        }
        // groups
        if(!userInfo.groups){
            throw new Error('No "groups" property in backOffice User response');
        }
        else if (userInfo.groups.length === 0){
            groups = []; // no groups, so empty array
        }
        else{
            groups = userInfo.groups;
        }

        return SimpleBackOfficeUser.make(authIdentifier, email, firstName, groups);

    }
 }
