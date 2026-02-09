import { GNSS_STATIONS_WITH_PRODUCTS } from '../support/constants';

describe('Service card', () => {
  beforeEach(() => {
    cy.init();
  });

  it('Test service card content', () => {
    // 🔧 Stub all calls for this service (as in the other test)
    cy.interceptService(GNSS_STATIONS_WITH_PRODUCTS);
    cy.log('Intercepted all service calls');

    // (optional) do the search first, it's fine
    cy.searchForService(GNSS_STATIONS_WITH_PRODUCTS);
    cy.log('Performed search for service');

    // Click on the first domain
    cy.getByDataCy('domain-list').children().first().click();
    cy.log('Clicked on the first domain');

    // Wait for the list to stabilize (better than a fixed wait)
    cy.getByDataCy('distribution-list-table').should('be.visible');

    // Select the fake distribution
    cy.getByDataCy('distribution-list-table')
      .contains(GNSS_STATIONS_WITH_PRODUCTS.name)
      .click();

    // ⏳ Wait for the distribution requests (as in the other test)
    cy.wait(GNSS_STATIONS_WITH_PRODUCTS.dataRequest);
    cy.wait(GNSS_STATIONS_WITH_PRODUCTS.detailsRequest);
    cy.log('Waited for distribution requests');

    // Check that the service card has the correct title
    cy.log('Checking service card content');
    cy.getByDataCy('results-panel-item-name')
      .should('contain.text', GNSS_STATIONS_WITH_PRODUCTS.name)
      .and('be.visible');

    // Check that service has the right categories
    cy.getByDataCy('results-panel-item-breadcrumb')
      .filter(':visible')
      .should('have.text', ' GNSS Data and Products  >  Products  >  Station Information ')
      .and('be.visible');

    // Check that the service has the right "visible on" options
    cy.getByDataCy('results-panel-item-visible-on')
      .should('have.text', 'Map Table ')
      .and('be.visible');

    // Check that the Table button works
    cy.getByDataCy('results-panel-item-visible-on')
      .contains('Table')
      .click();

    // The table should be visible
    cy.log('Checking table visibility');
    cy.getByDataCy('table-panel')
      .should('be.visible');

    // Check that the map has been zoomed correctly (robust check)
    cy.log('Checking map zoom and scale');
    // Capture scale BEFORE clicking "Map"
    cy.get('.leaflet-proxy.leaflet-zoom-animated')
      .invoke('attr', 'style')
      .then((style) => {
        const m = /scale\(([-\d.]+)\)/.exec(String(style ?? ''));
        const scaleBefore = m ? Number(m[1]) : 0;
        cy.wrap(scaleBefore).as('scaleBefore');
      });

    // Click on the Map button
    cy.getByDataCy('results-panel-item-visible-on')
      .contains('Map')
      .click();

    // Assert that scale AFTER is greater than BEFORE (Cypress will retry the should() until it increases)
    cy.get('@scaleBefore').then((scaleBefore) => {
      cy.get('.leaflet-proxy.leaflet-zoom-animated')
        .should(($el) => {
          const style = $el.attr('style') || '';
          const m = /scale\(([-\d.]+)\)/.exec(style);
          expect(m, 'scale() present').to.not.be.null;
          const scaleAfter = Number(m![1]);
          expect(scaleAfter, `scale after (${scaleAfter}) > scale before (${scaleBefore})`).to.be.greaterThan(Number(scaleBefore));
        });
    });

    // 2) Ensure the markers for the selected service are visible
    cy.log('Checking markers visibility');
    cy.getLeafletPane(GNSS_STATIONS_WITH_PRODUCTS.id)
      .children()
      .should('have.length', GNSS_STATIONS_WITH_PRODUCTS.markerCount)
      .and('be.visible');
  });
});