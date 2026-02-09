describe('Data visualization filter', () => {
  beforeEach(() => {
    cy.init();
  });

  // Function to select one or more options in the Data Visualization filter and check that the number of results is correct
  function selectOptionsAndVerifyResults(options: string[], expectedCount: string) {
    // Open the Data Visualization filter
    cy.getByDataCy('data-visibility-selector').click();

    // Select the options
    options.forEach(option => {
      cy.get('mat-option').contains(option).click();
    });

    // click anywhere to close the menu
    cy.get('body').click();

    // The request done is ".../resources/search?q=" which is intercepted by the init command, the filtering is done by the gui

    // Check that the number of results is correct
    cy.getByDataCy('results-title-counter')
      .should('contain', expectedCount);
  }

  // Define the results for each combination of options
  const testData = [
    { options: ['Map'], expectedCount: '38' },
    { options: ['Table'], expectedCount: '33' },
    { options: ['Graph'], expectedCount: '4' },
    { options: ['Map', 'Table'], expectedCount: '28' },
    { options: ['Map', 'Graph'], expectedCount: '4' },
    { options: ['Table', 'Graph'], expectedCount: '0' },
    { options: ['Map', 'Table', 'Graph'], expectedCount: '0' },
  ];

  // Run a test for each combination
  testData.forEach(({ options, expectedCount }) => {
    it(`Test with options: ${options.join(', ')}`, () => {
      selectOptionsAndVerifyResults(options, expectedCount);
    });
  });
});