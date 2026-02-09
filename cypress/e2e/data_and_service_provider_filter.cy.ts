describe('Data and service provider filter', () => {
  beforeEach(() => {
    cy.init();
  });

  it('Populated correctly', () => {
    // Open the data provider filter popup
    cy.getByDataCy('data-provider-filter > .mat-form-field').click({ force: true });

    // The popup should be visible
    cy.getByDataCy('data-provider-filter-dialog').should('be.visible');

    // Get the dict of data providers from the fixture
    cy.fixture('data_providers.json').then((dataProviders: { [key: string]: string[] }) => {
      // Check that the sections are populated correctly
      cy.getByDataCy('data-provider-filter-dialog-section').as('sections').should('have.length', Object.keys(dataProviders).length);
    });
  });

  it('Added to selected', () => {
    // Open the data provider filter popup
    cy.getByDataCy('data-provider-filter > .mat-form-field').click({ force: true });

    // The popup should be visible
    cy.getByDataCy('data-provider-filter-dialog').should('be.visible');

    // Click on the first provider
    cy.getByDataCy('data-provider-filter-dialog-section-item').first().click();

    // The provider checkbox should be checked
    cy.getByDataCy('data-provider-filter-dialog-section-item').first().find('input').should('be.checked');

    // Click on the selected section
    cy.getByDataCy('data-provider-filter-dialog-selected').click();

    // There should be one provider in the selected section
    cy.getByDataCy('data-provider-filter-dialog-selected-item').should('have.length', 1);

    // The provider should be the one we clicked
    cy.getByDataCy('data-provider-filter-dialog-selected-item').first().contains('1 year seismological experiment at Strokkur in 2017/18, Iceland, 7L_2017,https://doi.org/10.14470/2Y7562610816');

    // Deselect the provider
    cy.getByDataCy('data-provider-filter-dialog-selected-item').first().click();

    // The provider checkbox should be unchecked
    cy.getByDataCy('data-provider-filter-dialog-selected-item').first().find('input').should('not.be.checked');

    // Go back to the original list
    cy.getByDataCy('data-provider-filter-dialog-all').click();

    // The provider checkbox should be unchecked
    cy.getByDataCy('data-provider-filter-dialog-section-item').first().find('input').should('not.be.checked');
  });

  it('Filter by letter', () => {
    // Open the data provider filter popup
    cy.getByDataCy('data-provider-filter > .mat-form-field').click({ force: true });

    // The popup should be visible
    cy.getByDataCy('data-provider-filter-dialog').should('be.visible');

    cy.fixture('data_providers.json').then((dataProviders: { [key: string]: string[] }) => {
      // Click on the letter B
      cy.getByDataCy('data-provider-filter-dialog-alphabet-letter').contains('B').click();

      // Check that the providers are filtered
      cy.getByDataCy('data-provider-filter-dialog-section-item')
        .should('have.length', dataProviders['B'].length)
        .then((items) => {
          dataProviders['B'].forEach((provider, index) => {
            cy.wrap(items[index]).contains(provider);
          });
        });
    });
  });

  it('Free text search', () => {
    // Open the data provider filter popup
    cy.getByDataCy('data-provider-filter > .mat-form-field').click({ force: true });

    // The popup should be visible
    cy.getByDataCy('data-provider-filter-dialog').should('be.visible');

    // The free text search is focused by default, type the text
    cy.getByDataCy('data-provider-filter-dialog-text-search').type('British');

    // Check that the providers are filtered
    cy.getByDataCy('data-provider-filter-dialog-section-item')
      .should('have.length', 1)
      .first()
      .contains('BGS - British Geological Survey, UK Research and Innovation - GB');
  });

  it('Country search', () => {
    // Open the data provider filter popup
    cy.getByDataCy('data-provider-filter > .mat-form-field').click({ force: true });

    // The popup should be visible
    cy.getByDataCy('data-provider-filter-dialog').should('be.visible');

    // Click on the country filter
    cy.getByDataCy('data-provider-filter-dialog-country-filter').click().type('United Kingdom');

    // Click on the country
    cy.getByDataCy('country-select-option').click();

    // Check that the providers are filtered
    cy.getByDataCy('data-provider-filter-dialog-section-item')
      .should('have.length', 6).then((items) => {
      cy.wrap(items[0]).contains('BGS - British Geological Survey, UK Research and Innovation - GB');
      cy.wrap(items[1]).contains('Keele University - GB');
      cy.wrap(items[2]).contains('NSGF - NERC Space Geodesy Facility - GB');
      cy.wrap(items[3]).contains('OS - Ordnance Survey - GB');
      cy.wrap(items[4]).contains('UCL - University College London - GB');
      cy.wrap(items[5]).contains('UoL - University of Leeds - GB');
    });
  });

  it('Apply filter', () => {
    // Open the data provider filter popup
    cy.getByDataCy('data-provider-filter > .mat-form-field').click({ force: true });

    // The popup should be visible
    cy.getByDataCy('data-provider-filter-dialog').should('be.visible');

    // Click on the first provider
    cy.getByDataCy('data-provider-filter-dialog-section-item').first().click();

    // Intercept the request to filter the results
    cy.intercept('GET',
      new RegExp('.*/search\\?q=&organisations=fd2d5412-6073-4bb3-ba85-ea43b43905c4'),
      { fixture: 'data_providers_search.json' },
    ).as('filtered-search');

    // Click on the apply button
    cy.getByDataCy('data-provider-filter-dialog-apply').click();

    // Wait for the search to be filtered
    cy.wait('@search');

    // There should be a 'providers' chip
    cy.getByDataCy('search-panel-filters-mat-chip-list').contains('Providers');

    // In the Data and Service Provider filter, there should be the number of selected providers
    cy.getByDataCy('data-provider-filter-text').contains('1 item(s) selected');

    // The number of results should be 12
    cy.getByDataCy('domain-list').children().first().find('[data-cy="domain-item-counter"]').should('have.text', '12');
  });
});