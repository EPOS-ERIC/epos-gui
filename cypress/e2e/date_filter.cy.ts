import moment from 'moment';

describe('Global Date filter', () => {
  beforeEach(() => {
    cy.init();
  });

  it('Test time range picker', () => {
    // Intercept the request for the first date
    cy.intercept(
      'GET',
      /.*\/resources\/search\?q=&startDate=2023-01-01T12%3A00%3A00%2B00%3A00/,
      { fixture: 'bbox_filtered_distributions.json' },
    ).as('startDate');    // Intercept the request for the second date
    cy.intercept(
      'GET',
      /.*\/resources\/search\?q=&startDate=2023-01-01T12%3A00%3A00%2B00%3A00&endDate=2024-01-01T12%3A00%3A00%2B00%3A00/,
      { fixture: 'bbox_filtered_distributions.json' },
    ).as('endDate');
    // Open the start date range picker
    cy.getByDataCy('date-range-picker-start-button')
      .click();

    // Select the first date
    cy.get('.yearselect') // 2023
      .filter(':visible')
      .select('2023');
    cy.get('.monthselect')  // January
      .filter(':visible')
      .select('0');
    cy.get('[data-title="r1c0"]') // 1
      .contains('1')
      .click();

    // Select the first time
    cy.get('.hourselect') // 12
      .filter(':visible')
      .select('12');
    cy.get('.minuteselect') // 00
      .filter(':visible')
      .select('00');
    cy.get('.secondselect') // 00
      .filter(':visible')
      .select('00');

    // Apply the start date
    cy.get('.temporalApplyBtnStart')
      .contains('Apply')
      .click();

    // Open the end date range picker
    cy.getByDataCy('date-range-picker-end-button')
      .click();

    // Select the end date
    cy.get('.yearselect') // 2024
      .filter(':visible')
      .select('2024');
    cy.get('.monthselect')  // January
      .filter(':visible')
      .select('0');
    cy.get('[data-title="r0c1"]') // 1
      .contains('1')
      .click();

    // Select the end time
    cy.get('.hourselect') // 12
      .filter(':visible')
      .select('12');
    cy.get('.minuteselect') // 00
      .filter(':visible')
      .select('00');
    cy.get('.secondselect') // 00
      .filter(':visible')
      .select('00');

    // Apply the end date
    cy.get('.temporalApplyBtnEnd')
      .contains('Apply')
      .click();

    // Wait for the requests to finish
    cy.wait(['@startDate', '@endDate']);

    // Check that the results are filtered
    cy.getByDataCy('results-title-counter')
      .should('contain', '46');
  });

  describe('Test time period selector', () => {
    // In these tests we assume that the request are made correctly, we only check if the radio buttons work
    function testDateRange(radioPicker: string, subtractAmount: moment.DurationInputArg1) {
      cy.getByDataCy(radioPicker).click().then(() => {
        // Capture the current date and time
        let endDate = moment.utc();
        let startDate = moment.utc().subtract(subtractAmount, 'days');

        // Format the date and time to match the format of the date range's text, excluding seconds
        let endFormattedDateTime = endDate.format('YYYY-MM-DD HH:mm');
        let startFormattedDateTime = startDate.format('YYYY-MM-DD HH:mm');

        // Get the text of the date range and compare it with the formatted date and time
        cy.getByDataCy('date-range-picker-end')
          .invoke('attr', 'ng-reflect-model')
          .then((value) => {
            expect(value.slice(0, 16)).to.equal(endFormattedDateTime);
          });

        cy.getByDataCy('date-range-picker-start')
          .invoke('attr', 'ng-reflect-model')
          .then((value) => {
            expect(value.slice(0, 16)).to.equal(startFormattedDateTime);
          });
      });
    }

    it('Month', () => {
      testDateRange('date-radio-picker-month', 30);
    });

    it('Week', () => {
      testDateRange('date-radio-picker-week', 7);
    });

    it('Day', () => {
      testDateRange('date-radio-picker-day', 1);
    });
  });
});
