export interface UrlBuilder {


  build(): string;



  addPathElements(...elements: Array<string>): UrlBuilder;



  addParameter(key: string, value: string): UrlBuilder;


}
