import { GNSS_STATIONS_WITH_PRODUCTS } from '../support/constants';

describe('Test marker cluster', () => {
  beforeEach(() => {
    cy.init();
  });

  it('Check marker cluster (GeoJson)', () => {
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
    cy.wait(500);  // TODO: find a better way to wait for pending data to be processed

    // The loading spinner should not be visible anymore
    cy.get('.mat-progress-spinner')
      .should('not.exist');

    // Check that the markers or "elements" are on the map
    cy.getServiceMapFeatures(service)
      .should('have.length', service.markerCount)
      .and('be.visible');

    // Open the layer control
    cy.getByDataCy('layer-control-content')
      .click({ force: true });

    // Open the service section
    cy.getByDataCy('layer-control-accordion')
      .contains(service.name)
      .click();

    // Open the customize section
    cy.getByDataCy('layer-control-accordion')
      .contains('Customize')
      .click();

    // Enable the cluster toggle
    cy.getByDataCy('layer-control-cluster-toggle')
      .click();

    // Zoom in using the Leaflet zoom control before checking clusters
    cy.get('.leaflet-control-zoom-in').click({ force: true });

    // Get the markers on the map and check that they are clustered correctly
    cy.get('.leaflet-marker-pane')
      .children()
      .as('markers')
      .should('have.length', 2);

    // Click on the first cluster
    cy.get('@markers')
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

    const firstSlideContent = {
      'GNSS Station ID': 'CRAL00FRA',
      'Country': 'France',
      'City': 'Lannemezan',
      'Latitude': '43.1284',
      'Longitude': '0.3672',
      'Installed at': '2010-02-09 00:00:00',
      'Data Providers': 'Observatoire Midi-Pyrénées',
      'Networks': 'UNKNOWN',
      'CRAL TS Image': 'CRAL TS Image',
    };

    const secondSlideContent = {
      'GNSS Station ID': 'ARUF00FRA',
      'Country': 'France',
      'City': 'Arudy',
      'Latitude': '43.0995',
      'Longitude': '-0.4311',
      'Installed at': '2014-03-13 00:00:00',
      'Data Providers': 'Observatoire Midi-Pyrénées',
      'Networks': 'UNKNOWN',
      'ARUF TS Image': 'ARUF TS Image',
    };

    // Check the content of the table in the popup
    cy.get('@popup')
      .find('.selected')    // Check only the selected one
      .find('tr')
      .each(($row) => {
          const th = $row.find('th').text();
          const td = $row.find('td').text();
          if (firstSlideContent[th]) {
            expect(td).to.eq(firstSlideContent[th]);
          }
        },
      );

    // Check the slide navigation
    cy.get('@popup')
      .find('.slide-navigation')
      .find('.nav-text')
      .should('contain', '1 of ' + 2);

    // Open the next slide
    cy.getByDataCy('popup-next-slide')
      .click({ force: true });

    // Check the content of the table in the popup
    cy.get('@popup')
      .find('.selected')    // Check only the selected one
      .find('tr')
      .each(($row) => {
          const th = $row.find('th').text();
          const td = $row.find('td').text();
          if (secondSlideContent[th]) {
            expect(td).to.eq(secondSlideContent[th]);
          }
        },
      );
  });
});
