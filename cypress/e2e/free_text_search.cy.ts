describe('Free text search', () => {
  beforeEach(() => {
    cy.init();
  });

  it('keywords', () => {
    const keyword = 'borehole';
    const expectedResults = [
      '7490b607-3cb1-4946-a295-156107e77171',
      'd280b66f-91c9-4fdf-aa98-c89caa4b0bb9',
      '79c57cff-c3f9-400f-b1b3-43494bd57d08',
      '7affeed4-813c-4cbd-9b0d-a1c2b6691aa2',
      'd9cf45ad-1bc6-4d97-91e3-d4afa9007984',
      '15fb11a6-d42e-4cab-8558-e1209e42baa9',
    ];

    cy.intercept(
      'GET',
      new RegExp('.*/resources/search\\?q='),
      // Stub the request with the correct fixture and save a reference to the request to be able to wait on it
      { fixture: 'free_text_search.json' })
      .as('free_text_search');

    // Search for the borehole keyword
    cy.freeTextSearch(keyword);

    // Check that the number of results is correct
    cy.getByDataCy('results-title-counter')
      .should('contain', expectedResults.length);

    // Open the first domain
    cy.getByDataCy('domain-list')
      .children()
      .first()
      .click();

    // Check that the results are correct
    cy.getByDataCy('distribution-list-table > tbody')
      .children()
      .then(($rows) => {
        expect($rows).to.have.length(expectedResults.length);

        $rows.each((index, $row) => {
          cy.wrap($row)
            .should('contain', keyword[index]);
        });
      });
  });
});
