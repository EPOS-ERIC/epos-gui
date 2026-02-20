import { GNSS_STATIONS_WITH_PRODUCTS } from '../support/constants';

describe('Bounding box filter', () => {
  beforeEach(() => {
    cy.init();
  });

  it('Test bounding box filter', () => {
    // Intercept and mock all the requests for the GNSS_STATIONS_WITH_PRODUCTS service
    cy.interceptService(GNSS_STATIONS_WITH_PRODUCTS);

    // Zoom in using the Leaflet zoom control before checking clusters
    cy.get('.leaflet-control-zoom-in').click({ force: true });


    cy.getByDataCy('epos-leaflet-map')
      .trigger('mousedown', { clientX: 400, clientY: 300, which: 1 }) // punto di partenza
      .trigger('mousemove', { clientX: 600, clientY: 500 })           // trascina più a destra e più in basso
      .trigger('mouseup');

    // Click on the spatial control button (we need to specify the visibility because there is a bounding box button for each left panel tab (data, facilities))
    cy.getByDataCy('drawing-spatial-control-button').filter(':visible').click();

    // Intercept the request to filter the results by the bounding box
    cy.intercept('GET', /\/resources\/search\?.*?\bbbox=[^&]+/, { fixture: 'bbox_filtered_distributions.json' }).as('search');

    // Activate the Leaflet draw rectangle tool by clicking its button
    cy.get('.leaflet-draw-draw-rectangle').click({ force: true });

    // Now simulate drawing a rectangle on the Leaflet map container
    cy.get('.leaflet-container')
      .trigger('mousedown', { clientX: 400, clientY: 300, which: 1, bubbles: true })
      .trigger('mousemove', { clientX: 700, clientY: 500, bubbles: true })
      .trigger('mouseup', { clientX: 700, clientY: 500, bubbles: true });

    // Wait for the results to be filtered by the bounding box
    cy.wait('@search');

    // There should be a "Spatial" chip in the filters
    cy.getByDataCy('search-panel-filters-mat-chip-list').contains('Spatial');

    // Check that the bounding box is visible on the map (TODO: find a way to use the data-cy attribute for this element)
    cy.get('.leaflet-resourcesspatialbbox-pane > .leaflet-zoom-animated > g').as('bbox');

    // The spatial filter should be set to coordinates
    cy.getByDataCy('spatial-filter-selector').contains('Coordinates');
    cy.getByDataCy('spatial-filter-selector').contains('Geolocation').should('not.exist');

    // Check if a string is a number, if it is empty or if it is NaN, the test will fail
    const beANumber = (val: string) => {
      expect(val).to.not.be.empty;
      expect(Number(val)).to.not.be.NaN;
    };

    // Check if the coordinates are being shown in the filter as numbers
    cy.getByDataCy('spatial-filter-north-input').invoke('val').then(beANumber);
    cy.getByDataCy('spatial-filter-east-input').invoke('val').then(beANumber);
    cy.getByDataCy('spatial-filter-south-input').invoke('val').then(beANumber);
    cy.getByDataCy('spatial-filter-west-input').invoke('val').then(beANumber);

    // Check that the number of filtered results is 46
    cy.getByDataCy('domain-list').children().first().find('[data-cy="domain-item-counter"]').should('have.text', '46');

    // Search for the fake distribution
    cy.searchForService(GNSS_STATIONS_WITH_PRODUCTS);

    // Click on the first domain
    cy.getByDataCy('domain-list').children().first().click();

    // Wait for the results list to be resized
    cy.wait(2000);  // TODO: find a better way to wait for the list to be resized


    // Select the fake distribution
    cy.getByDataCy('distribution-list-table').contains(GNSS_STATIONS_WITH_PRODUCTS.name).click();

    // Wait for requests to finish
    cy.wait(GNSS_STATIONS_WITH_PRODUCTS.bboxFilteredRequest);
    cy.wait(GNSS_STATIONS_WITH_PRODUCTS.detailsRequest);

    // Check that the markers are on the map
    cy.getLeafletPane(GNSS_STATIONS_WITH_PRODUCTS.id).children().should('have.length', GNSS_STATIONS_WITH_PRODUCTS.markerCount).and('be.visible');

    // === Remove the "Spatial" chip and verify bbox is gone ===
    // Click the chip remove button (X) for "Spatial"
    cy.getByDataCy('search-panel-filters-mat-chip-list')
      .find('mat-chip')
      .filter(':contains("Spatial")')
      .within(() => {
        cy.get('button[matChipRemove], .mat-chip-remove, .mat-mdc-chip-remove')
          .first()
          .click({ force: true });
      });

    // The "Spatial" chip should disappear
    cy.getByDataCy('search-panel-filters-mat-chip-list')
      .should('not.contain.text', 'Spatial');

    // Grab BEFORE counts (right after click; Cypress queue ensures order)
    cy.get('.leaflet-resourcesspatialbbox-pane').then($pane => {
      const beforeSvg = $pane.find('path, rect, polygon, polyline, line, circle, ellipse').length;
      const beforeCanvas = $pane.find('canvas').length;
      cy.log(`BBox BEFORE removal → svgShapes=${beforeSvg}, canvas=${beforeCanvas}`);
      cy.wrap({ beforeSvg, beforeCanvas }).as('bboxBeforeCounts');
    });

    // Wait for Leaflet to finish any animations
    cy.get('.leaflet-container').should('not.have.class', 'leaflet-zoom-anim');

    // AFTER: assert pane has no SVG shapes and no canvas overlays left
    cy.get('@bboxBeforeCounts').then(({ beforeSvg, beforeCanvas }: any) => {
      cy.get('.leaflet-resourcesspatialbbox-pane').then($pane => {
        const afterSvg = $pane.find('path, rect, polygon, polyline, line, circle, ellipse').length;
        const afterCanvas = $pane.find('canvas').length;
        cy.log(`BBox AFTER removal → svgShapes=${afterSvg}, canvas=${afterCanvas}`);

        // check forte: deve essere proprio sparita
        expect(afterSvg, 'no SVG bbox shapes in pane').to.eq(0);
        expect(afterCanvas, 'no canvas bbox overlays in pane').to.eq(0);
      });
    });
  });
});
