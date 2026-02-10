/// <reference types="cypress" />
/// <reference path="../support/commands.d.ts" />

import { GNSS_STATIONS_WITH_PRODUCTS } from '../support/constants';

describe('Test download', () => {
  beforeEach(() => {
    cy.init();
  });

  it('Download popup content', () => {
    const service = GNSS_STATIONS_WITH_PRODUCTS;

    // Intercept and mock all the requests for the service
    cy.interceptService(service);

    // Click on the first domain
    cy.getByDataCy('domain-list')
      .children()
      .first()
      .click();

    // Wait for the results list to be resized
    cy.wait(1000);  // TODO: find a better way to wait for the list to be resized

    // Then the distribution list should be visible
    cy.getByDataCy('distribution-list-table')
      .should('be.visible');

    // Search for the fake distribution
    cy.searchForService(service);

    // Select the distribution
    cy.getByDataCy('results-panel-item-name')
      .contains(service.name)
      .click();

    // Wait for the request to finish
    cy.wait(service.dataRequest);

    // The loading spinner should not be visible anymore
    cy.get('.mat-progress-spinner')
      .should('not.exist');

    // Dismiss the notification
    cy.getByDataCy('app-notification-ok-button')
      .click();

    // Open the download dialog
    cy.getByDataCy('results-panel-download-button')
      .click();

    // The download popup should be visible
    cy.get('app-downloads-dialog')
      .should('be.visible');

    // Wait for the loading
    cy.get('.mat-progress-spinner')
      .should('not.exist');

    const data = [
      new DownloadableFile('raw service response', 'application/epos.geo+json'),
      new DownloadableFile('AGDE TS Image', 'image/png'),
      new DownloadableFile('AIGL TS Image', 'image/png'),
      new DownloadableFile('ARUF TS Image', 'image/png'),
      new DownloadableFile('BANN TS Image', 'image/png'),
      new DownloadableFile('BAUB TS Image', 'image/png'),
      new DownloadableFile('BLIX TS Image', 'image/png'),
      new DownloadableFile('CLAP TS Image', 'image/png'),
      new DownloadableFile('CRAL TS Image', 'image/png'),
      new DownloadableFile('FAJP TS Image', 'image/png'),
    ];

    // Check the content of the table
    cy.getByDataCy('downloads-dialog-table')
      .find('tbody tr')
      .each(($row, rowIndex) => {
        const rowData = data[rowIndex];

        cy.wrap($row).find('td').each(($cell, cellIndex) => {
          const cellText = $cell.text().trim();
          if (cellIndex === 1)
            expect(cellText).to.equal(String(rowData.name));
          if (cellIndex === 2) {
            expect(cellText).to.equal(String(rowData.format));
          }
        });
      });
  });

  it.only('Download file', () => {
    const service = GNSS_STATIONS_WITH_PRODUCTS;

    // Intercept and mock all the requests for the service
    cy.interceptService(service);

    // Click on the first domain
    cy.getByDataCy('domain-list')
      .children()
      .first()
      .click();

    // Wait for the results list to be resized
    cy.wait(1000);  // TODO: find a better way to wait for the list to be resized

    // Then the distribution list should be visible
    cy.getByDataCy('distribution-list-table')
      .should('be.visible');

    // Search for the fake distribution
    cy.searchForService(service);

    // Select the distribution
    cy.getByDataCy('results-panel-item-name')
      .contains(service.name)
      .click();

    // Wait for the request to finish
    cy.wait(service.dataRequest);

    // The loading spinner should not be visible anymore
    cy.get('.mat-progress-spinner')
      .should('not.exist');

    // Dismiss the notification
    cy.getByDataCy('app-notification-ok-button')
      .click();

    // Open the download dialog
    cy.getByDataCy('results-panel-download-button')
      .click();

    // The download popup should be visible
    cy.get('app-downloads-dialog')
      .should('be.visible');

    // Wait for the loading
    cy.get('.mat-progress-spinner')
      .should('not.exist');

    const rawSourceRequest = '@rawSource' + service.name;
    cy.fixture(service.getOriginalURL()).then((response: { url: string }) => {
      const parsedUrl = new URL(response.url);
      cy.intercept(
        'GET',
        `${parsedUrl.origin}${parsedUrl.pathname}*`,
        { fixture: service.rawServiceResponse() }
      ).as(rawSourceRequest.substring(1));
    });

    // Click on the first item's download
    cy.getByDataCy('downloads-dialog-download-button')
      .first()
      .click();

    cy.wait(service.getOriginalUrlRequest);
    cy.wait(rawSourceRequest);

    // Check that the downloaded file is correct
    cy.fixture(service.rawServiceResponse()).then((jsonData) => {
      cy.readFile(`cypress/downloads/raw_service_response_${service.name}.json`, { timeout: 20000 })
        .then((jsonObject) => {
          expect(JSON.stringify(jsonData)).to.eq(JSON.stringify(jsonObject));
        });
    });
  });
});

class DownloadableFile {
  constructor(
    public name: String,
    public format: String,
  ) {
  }
}
