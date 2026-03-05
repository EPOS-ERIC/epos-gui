import { GNSS_STATIONS_WITH_PRODUCTS, Service } from '../support/constants';

describe('Table panel', () => {
  beforeEach(() => {
    cy.init();
  });

  function openInTable(service: Service) {
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

    // Open the table panel
    cy.getByDataCy('table-panel-toggle')
      .click();

    // The table should be visible
    cy.getByDataCy('table-panel')
      .should('be.visible');

    // There should be 5 results per page
    cy.getByDataCy('table-component-table')
      .find('tbody tr')
      .should('have.length', 5);  // 5 rows per page by default
    cy.getByDataCy('table-component-paginator')
      .should('contain', 5);
  }

  it('Test table panel content', () => {
    const service = GNSS_STATIONS_WITH_PRODUCTS;

    // Open the service in the table panel
    openInTable(service);

    // Check the table content
    cy.fixture(service.tableJson()).then((jsonData) => {
      cy.getByDataCy('table-component-table')
        .find('tbody tr')
        .each(($row, rowIndex) => {
          const rowData = jsonData[rowIndex];

          cy.wrap($row).find('td').each(($cell, cellIndex) => {
            // Skip the first two empty columns
            if (cellIndex > 1 && cellIndex < 8) { // there are 2 hidden columns and the default of 8 columns per page
              const cellText = $cell.text().trim().toLowerCase();
              const jsonValue = Object.values(rowData)[cellIndex - 2];

              // Compare cell text with JSON value
              expect(cellText).to.equal(String(jsonValue));
            }
          });
        });

      // Check the number of rows
      cy.getByDataCy('table-component-table')
        .find('tbody tr')
        .should('have.length', 5);  // 5 rows per page by default

      // Check the header, skipping the first two empty columns
      cy.getByDataCy('table-component-table')
        .find('thead th')
        .each(($th, index) => {
          // Skip the first two empty columns
          if (index > 1 && index < 10) { // there are 2 hidden columns and the default of 8 columns per page
            const headerText = $th.text().trim();
            const jsonKey = Object.keys(jsonData[0])[index - 2];

            expect(headerText).to.equal(jsonKey);
          }
        });
    });
  });

  it('Results per page', () => {
    const service = GNSS_STATIONS_WITH_PRODUCTS;

    // Open the service in the table panel
    openInTable(service);

    // Change the number of results per page to 25
    cy.getByDataCy('table-component-paginator')
      .find('mat-select')
      .click();
    cy.get('.mat-option-text')
      .filter(':contains("25")')
      .click();

    // Then the number of results should be the minimum between the number of markers of the service and 25
    cy.getByDataCy('table-component-table')
      .find('tbody tr')
      .should('have.length', service.markerCount <= 25 ? service.markerCount : 25);  // 5 rows per page by default
    cy.getByDataCy('table-component-paginator')
      .should('exist');
  });

  it('Add/Remove column', () => {
    const service = GNSS_STATIONS_WITH_PRODUCTS;

    // Open the service in the table panel
    openInTable(service);

    // Open the column selector
    cy.getByDataCy('table-component-select-columns')
      .click();

    // Remove the Country column
    cy.getByDataCy('table-component-select-columns-option')
      .filter(':contains("Country")')
      .click();

    // Add the City column
    cy.getByDataCy('table-component-select-columns-option')
      .filter(':contains("City")')
      .click();

    // Check the table content
    cy.fixture(service.tableJson()).then((jsonData) => {
      // Remove the country column and add the City column in the data
      jsonData.forEach((marker) => {
        delete marker['Country'];
        marker['City'] = 'Paris';
      });

      // Check the header, skipping the first two empty columns
      cy.getByDataCy('table-component-table')
        .find('thead th')
        .each(($th, index) => {
          // Skip the first two empty columns
          if (index > 1 && index < 10) {
            const headerText = $th.text().trim();
            const jsonKey = Object.keys(jsonData[0])[index - 2];

            cy.log(headerText);

            expect(headerText).to.equal(jsonKey);
          }
        });
    });
  });

  it('Toggle data on map', () => {
    const service = GNSS_STATIONS_WITH_PRODUCTS;

    // Open the service in the table panel
    openInTable(service);

    // Check that the number of markers on the map is correct
    cy.getServiceMapFeatures(service)
      .filter(':visible')
      .should('have.length', service.markerCount);

    // Hide the first marker in the table
    cy.getByDataCy('table-component-toggle-data-on-map')
      .first()
      .click();

    // Check that the number of markers on the map is correct
    cy.getServiceMapFeatures(service)
      .filter(':visible')
      .should('have.length', service.markerCount - 1);

    // Re-enable the hidden marker
    cy.getByDataCy('table-component-toggle-data-on-map')
      .first()
      .click();

    // Check that the number of markers on the map is correct
    cy.getServiceMapFeatures(service)
      .filter(':visible')
      .should('have.length', service.markerCount);
  });

  it('Show on map', () => {
    const service = GNSS_STATIONS_WITH_PRODUCTS;

    // Open the service in the table panel
    openInTable(service);

    // Show on map the first marker in the table
    cy.getByDataCy('table-component-show-on-map')
      .first()
      .click();

    // The popup should be visible
    cy.getLeafletPane('popup')
      .find('.paginated-features')
      .as('popup')
      .should('be.visible');

    // Check the content of the popup
    cy.get('@popup')
      .find('.popup-title')
      .should('contain', service.name);
  });
});
