import { DataProvider } from 'api/webApi/data/dataProvider.interface';

export class SimpleDataProvider implements DataProvider {

  private constructor(
    public readonly dataProviderLegalName: string,
    public readonly dataProviderUrl: string,
    public readonly relatedDataProvider: Array<DataProvider>,
    public readonly dataProviderId: string,
    public readonly country: string,
  ) {

  }

  public static make(
    dataProviderLegalName: string,
    dataProviderUrl: string,
    relatedDataProvider: Array<DataProvider>,
    dataProviderId: string,
    country: string,
  ): SimpleDataProvider {
    // create param
    return new SimpleDataProvider(
      // Append the country code after the name of the provider
      dataProviderLegalName + (country ? (' - ' + country) : ''),
      dataProviderUrl,
      relatedDataProvider,
      dataProviderId,
      country,
    );
  }

}


