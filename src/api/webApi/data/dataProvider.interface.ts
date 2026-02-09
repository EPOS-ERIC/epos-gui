export interface DataProvider {
  dataProviderLegalName: string;
  dataProviderUrl: string | null;
  relatedDataProvider: Array<DataProvider>;
  dataProviderId: string;
}
