/// <reference types="cypress" />
/// <reference path="../support/commands.d.ts" />

describe('Simple gui tests (data indipendent)', () => {
  beforeEach(() => {
    cy.init();
  });

  // Test the base map selector
  it('Test base map selector', () => {
    // Click on the layer control button
    cy.getByDataCy('layer-control-content')
      .click({ force: true });

    // Then the layer control accordion header should be visible
    cy.getByDataCy('layer-control-accordion')
      .should('be.visible');

    // Click on the accordion header
    cy.getByDataCy('layer-control-expansion-panel')
      .find('mat-expansion-panel-header')
      .should('be.visible').click();

    // Then the layer control expansion panel should be visible
    cy.getByDataCy('layer-control-expansion-panel')
      .should('be.visible');

    // Click on the Dark Gray base map
    cy.getByDataCy('layer-control-expansion-panel')
      .contains('Open Street Map - Topographic')
      .should('be.visible')
      .click();

    // Then the Dark Gray base map should be visible (the src attribute of the tiles should contain "Dark_Gray")
    cy.get('.leaflet-tile')
      .should('be.visible')
      .and('have.attr', 'src')
      .should('contain', 'tile.opentopomap.org');
  });
});
