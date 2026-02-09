/// <reference types="cypress" />
/// <reference path="../support/commands.d.ts" />
describe('Filter by categories', () => {
  beforeEach(() => {
    cy.init();
  });

  it('Populated correctly', () => {
    // Click on the seismology tcs
    cy.getByDataCy('domain-list')
      .children()
      .eq(2)
      .click();

    // Wait for the results list to be resized
    cy.wait(1000);

    // Then the distribution list should be visible
    cy.getByDataCy('distribution-list-table')
      .should('be.visible');

    // Open the categories filter
    cy.getByDataCy('categories-filter')
      .click();

    // The panel should be visible
    cy.getByDataCy('categories-filter-dropdown')
      .as('categories')
      .should('be.visible');

    // Expand the all categories
    cy.get('@categories')
      .contains('All Categories (17)')
      .parents('mat-tree-node')
      .find('[data-cy="expansion-panel-expand-node"]')
      .click();

    // Expand the last category
    cy.get('@categories')
      .contains('Earthquake hazard and risk services (7)')
      .parents('mat-tree-node')
      .find('[data-cy="expansion-panel-expand-node"]')
      .click();

    // Check the subcategories
    cy.get('@categories')
      .contains('Risk products (1)');
    cy.get('@categories')
      .contains('Seismogenic faults (2)');
    cy.get('@categories')
      .contains('Exposure models (2)');

    // Select the last subcategory
    cy.get('@categories')
      .contains('Hazard products (2)')
      .parents('mat-tree-node')
      .as('hazardProducts')
      .click();

    // The checkboxes should be checked
    // The subcategory
    cy.get('@hazardProducts')
      .find('input')
      .should('be.checked');
    // The category
    cy.get('@categories')
      .contains('Earthquake hazard and risk services (7)')
      .find('input')
      .should('have.attr', 'aria-checked', 'mixed');
    // The all categories
    cy.get('@categories')
      .contains('All Categories (17)')
      .find('input')
      .should('have.attr', 'aria-checked', 'mixed');

    // The badge should be visible and have the correct number
    cy.getByDataCy('categories-filtered-badge')
      .should('be.visible')
      .and('have.text', '2');

    // The distribution list should be filtered
    cy.getByDataCy('distribution-list-table')
      .children()
      .should('have.length', 3) // one is the header filter, the real results are 2
      .as('results');
    cy.get('@results')
      .contains('ESHM20 Unified earthquake catalogue (OGC WFS)');
    cy.get('@results')
      .contains('ESHM20 Unified earthquake catalogue (OGC WMS)');
  });
});
