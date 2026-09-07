
import { SimpleBackOfficeUser } from '../data/impl/simpleBackofficeUser';

 export interface BackOfficeUserApi {
    getBackOfficeUser(self: string): Promise<SimpleBackOfficeUser>;
}
