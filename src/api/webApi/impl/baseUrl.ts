import { BaseUrl } from 'api/webApi/classes/baseurl.interface';
import { SimpleUrlBuilder } from 'api/webApi/utility/urlBuilder';
import { UrlBuilder } from '../classes/urlBuilder.interface';


export class BaseUrlImpl implements BaseUrl {

  constructor(
    private readonly baseUrl: string,
    ) {
  }

  urlBuilder(): UrlBuilder {
    return SimpleUrlBuilder.makeUrlBulilderWithDefaultSeparators(this.baseUrl);
  }

}
