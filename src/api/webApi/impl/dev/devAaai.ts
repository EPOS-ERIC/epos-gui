import { Rest } from '../../classes/rest.interface';
import { BaseUrl } from '../../classes/baseurl.interface';
import { AaaiApi } from 'api/webApi/classes/aaaiApi.interface';

export class DevAaaiApi implements AaaiApi {

  constructor(private readonly baseUrl: BaseUrl, private readonly rest: Rest) { }

}
