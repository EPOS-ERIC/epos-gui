import Chainable = Cypress.Chainable;

export class Service {
  searchRequest: string;
  dataRequest: string;
  detailsRequest: string;
  bboxFilteredRequest: string;
  getOriginalUrlRequest: string;

  constructor(
    public name: string,
    public folder: string,
    public id: string,
    public markerCount: number = 0,
    public getMarkerFunction: (service: Service) => Chainable<JQuery<HTMLElement>> = (service: Service) => {
      return cy.getLeafletPane(service.id)
        .children();
    },
  ) {
    this.searchRequest = '@search' + this.name;
    this.dataRequest = '@data' + this.name;
    this.detailsRequest = '@details' + this.name;
    this.bboxFilteredRequest = '@bboxFilteredData' + this.name;
    this.getOriginalUrlRequest = '@getOriginalUrl' + this.name;
  }

  searchJson() {
    return `${this.folder}/search.json`;
  }

  dataJson() {
    return `${this.folder}/data.json`;
  }

  detailsJson() {
    return `${this.folder}/details.json`;
  }

  bboxFilteredJson() {
    return `${this.folder}/bbox_filtered.json`;
  }

  tableJson() {
    return `${this.folder}/table.json`;
  }

  rawServiceResponse() {
    return `${this.folder}/raw_service_response.json`;
  }

  getOriginalURL() {
    return `${this.folder}/get_original_url.json`
  }
}

export const GNSS_STATIONS_WITH_PRODUCTS = new Service(
  'GNSS Stations with Products',
  'GNSS_Stations_with_Products',
  '6b4f5899-edfa-4739-a20b-55be5088a825',
  10,
);

export const NFO_Marmara_VP_VS = new Service(
  'Marmara Vp/Vs',
  'NFO_Marmara_Vp_Vs',
  '2774cc18-1a66-41bf-8aff-bc78b0c92e8f',
  1,
);

export const European_Fault_Source_Model_2020_Subduction = new Service(
  'European Fault Source Model 2020 - Subduction (OGC WFS)',
  'European_Fault_Source_Model_2020_Subduction(OGC_WFS)',
  '19f0935b-ade5-4c5a-8fb4-51b664de9add',
  240,
  (service: Service) => {
    return cy.getLeafletPane(service.id)
      .find('g')
      .children();
  },
);
