import {
  European_Fault_Source_Model_2020_Subduction,
  GNSS_STATIONS_WITH_PRODUCTS,
  NFO_Marmara_VP_VS, Service,
} from '../support/constants';

describe('Test select distribution', () => {
  beforeEach(() => {
    cy.init();
  });

  /**
   * Select a service with data on the map, click on the first element on the map,
   * check the popup content and open the extra panel
   * @param service The service to select
   * @param popupContent The content of the popup
   * @param extraPanel The type of extra panel to open and one of its content that is unique
   */
  function clickServiceMarker(
    service: Service,
    popupContent: Record<string, string> = {},
    extraPanel: {
      type: string,
      content: string
    },
  ) {
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
    if (service.name === GNSS_STATIONS_WITH_PRODUCTS.name) {
      cy.wait(service.bboxFilteredRequest);
    } else {
      cy.wait(service.dataRequest);
    }

    // The loading spinner should not be visible anymore
    cy.get('.mat-progress-spinner')
      .should('not.exist');

    // Check that the markers or "elements" are on the map
    cy.getServiceMapFeatures(service)
      .should('have.length', service.markerCount)
      .and('be.visible');

    // Click on the first element
    cy.getServiceMapFeatures(service)
      .first()
      .click({ force: true });

    // The popup should be visible
    cy.getLeafletPane('popup')
      .find('.paginated-features')
      .as('popup')
      .should('be.visible');

    // Check the content of the popup
    cy.get('@popup')
      .find('.popup-title')
      .should('contain', service.name);

    // Check that the popup has a button to open the extra panel
    cy.get('@popup')
      .find('.showOn' + extraPanel.type)
      .should('contain', ' View on ' + extraPanel.type);

    // Check the content of the table in the popup
    cy.get('@popup')
      .find('.selected')    // Check only the selected one
      .find('tr')
      .each(($row) => {
        const th = $row.find('th').text();
        const td = $row.find('td').text();
        if (popupContent[th]) {
          expect(td).to.eq(popupContent[th]);
        }
      },
      );

    // Open the extra panel on that element
    cy.get('@popup')
      .find('.selected')
      .find('.showOn' + extraPanel.type)
      .click({ force: true });   // This is probably not the best way to do it

    // The extra panel should be visible and have the correct content
    switch (extraPanel.type) {
      case 'Graph':
        // The graph panel should be opened
        cy.getByDataCy('graph-panel')
          .as('graphPanel')
          .should('be.visible');
        break;
      case 'Table':
        // The table panel should be open
        cy.getByDataCy('table-panel')
          .as('tablePanel')
          .should('be.visible');

        // The row that contains the element should be highlighted
        cy.get('@tablePanel')
          .find('tr')
          .filter(':contains("' + extraPanel.content + '")')
          .children()
          .should('have.class', 'expand-row');
        break;
      default:
        throw new Error('Unknown panel type: ' + extraPanel);
    }
    // Close the popup
    cy.get('@popup')
      .find('.leaflet-popup-close-button')
      .click({ force: true });

    // The popup should not be visible
    cy.getLeafletPane('popup')
      .should('not.be.visible');
  }

  it.only('Check marker popup (GeoJson)', () => {
    clickServiceMarker(
      GNSS_STATIONS_WITH_PRODUCTS,
      {
        'GNSS Station ID': 'AGDE00FRA',
        'Country': 'France',
        'City': 'Cap D\'Agde - Agde',
        'Latitude': '43.2964',
        'Longitude': '3.4664',
        'Installed at': '2006-09-04 12:00:00',
        'Data Providers': 'Observatoire de Recherche Méditerranéen de l’Environnement',
        'Networks': 'RENAG',
        'AGDE TS Image': 'AGDE TS Image',
      },
      {
        type: 'Table',
        content: 'AGDE00FRA',
      },
    );
  });

  it('Check marker popup (CovJson)', () => {
    clickServiceMarker(
      NFO_Marmara_VP_VS,
      {
        'Latitude': '40.4478',
        'Longitude': '28.7258',
      },
      {
        type: 'Graph',
        content: '40.4478,28.7258',
      },
    );
  });

  it('Check marker popup (WFS)', () => {
    clickServiceMarker(
      European_Fault_Source_Model_2020_Subduction,
      {
        'depth': '3',
        'idcontour': 'GiA01',
        'idds': '#03',
        'idfs': 'MASS001',
        'idsource': 'N.A.',
        'shortname': 'GiA',
        'slabname': 'Gibraltar Arc',
      },
      {
        type: 'Table',
        content: '-8.0641,36.0498,-8.1212,36.0474,-8.1784,36.0453,-8.2356,36.046,-8.2928,36.0468,-8.3499,36.0481,-8.4071,36.0496,-8.4642,36.0522',
      },
    );
  });
});
