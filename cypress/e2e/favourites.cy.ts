import { GNSS_STATIONS_WITH_PRODUCTS } from '../support/constants';

describe('test favourites', () => {
  beforeEach(() => {
    cy.init();
  });

  it('Add a favourite', () => {
    // Intercept and mock all the requests for the GNSS_STATIONS_WITH_PRODUCTS service
    cy.interceptService(GNSS_STATIONS_WITH_PRODUCTS);

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
    cy.searchForService(GNSS_STATIONS_WITH_PRODUCTS);

    // Add the first item to favourites
    cy.getByDataCy('add-to-favourites')
      .first()
      .click();

    // Wait for the requests to finish
    cy.wait(GNSS_STATIONS_WITH_PRODUCTS.detailsRequest);
    cy.wait(GNSS_STATIONS_WITH_PRODUCTS.dataRequest);

    // The loading spinner should not be visible anymore
    cy.get('.mat-progress-spinner')
      .should('not.exist');

    // Add the second item to favourites (here we do first() because the first item is already in the favourites)
    // cy.getByDataCy('add-to-favourites').first().click();

    // Wait for the request to finish
    // cy.wait('@getFavourites');

    // The loading spinner should not be visible anymore
    // cy.get('.mat-progress-spinner').should('not.exist');

    // Check that the markers are on the map
    cy.getLeafletPane(GNSS_STATIONS_WITH_PRODUCTS.id)
      .children()
      .should('have.length', GNSS_STATIONS_WITH_PRODUCTS.markerCount)
      .and('be.visible');

    // Check that there is one favourite in the badge
    cy.getByDataCy('landing-panel-domain-badge')
      .find('span')
      .should('have.text', '1');

    // Open the favourites panel
    cy.get('#FAV')
      .click();

    // Check that there is one favourite in the panel
    cy.getByDataCy('distribution-list-table > tbody')
      .children()
      .should('be.visible')
      .and('have.length', 1);
    cy.getByDataCy('results-title-counter')
      .should('have.text', '1');

    // Remove the first favourite
    cy.getByDataCy('remove-from-favourites')
      .first()
      .click();

    // There should be 0 favourites in the panel
    cy.getByDataCy('results-title-counter')
      .should('have.text', '0');

    // Clear the favourites
    // cy.getByDataCy('clear-favourites-button').click();

    // Confirm the dialog
    // cy.contains('Ok').filter(':visible').click();

    // Check that there are no favourites
    cy.get('#FAV')
      .find('[data-cy="domain-item-counter"]') // This has to be done using find instead of getByDataCy
      .should('have.text', '0');
  });
});
