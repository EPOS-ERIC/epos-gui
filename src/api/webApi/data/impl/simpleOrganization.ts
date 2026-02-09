import { Organization } from '../organization.interface';

export class SimpleOrganization implements Organization {

  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly url: string,
    public readonly country: string,
    public readonly logoUrl: string | null,
  ) {
  }

  public static make(
    id: string,
    name: string,
    url: string,
    country: string,
    logoUrl: string | null,
  ): SimpleOrganization {
    // create param
    return new SimpleOrganization(
      id,
      // Append the country code after the name of the provider
      name.trim() + (country !== '' ? (' - ' + country) : ''),
      url,
      country,
      logoUrl,
    );
  }

  getIdentifier(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getUrl(): string {
    return this.url;
  }

  getCountry(): string {
    return this.country;
  }

  getLogoUrl(): string | null {
    return this.logoUrl;
  }
}


