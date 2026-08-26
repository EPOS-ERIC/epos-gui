import { GNSS_STATIONS_WITH_PRODUCTS } from '../support/constants';

const addExternalGeoJsonLayer = (name: string, url: string, response: object, alias: string): void => {
  cy.intercept('GET', url, {
    body: JSON.stringify(response),
    headers: { 'content-type': 'application/geo+json' },
  }).as(alias);

  cy.getByDataCy('add-external-layer-button').click();
  cy.get('input[data-cy="external-layer-name"]').type(name);
  cy.get('input[data-cy="external-layer-url"]').type(url);
  cy.getByDataCy('confirm-external-layer').click();
  cy.wait(`@${alias}`);
  cy.contains('.layer-title', name).should('be.visible');
};

const openExternalLayerCustomize = (name: string): Cypress.Chainable<JQuery<HTMLElement>> => {
  cy.contains('.layer-title', name).click();
  cy.contains('.layer-title', name)
    .parents('.layer')
    .first()
    .as('externalLayer');
  cy.get('@externalLayer').find('[role="tab"]').contains('Customize').click();
  return cy.get('@externalLayer').find('app-layer-customize').should('be.visible');
};

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

  it('Shows character controls for an EPOS-styled external GeoJSON', () => {
    const service = GNSS_STATIONS_WITH_PRODUCTS;
    const layerName = 'GNSS character markers';
    const layerUrl = 'https://example.test/gnss-character.geojson';

    cy.fixture(service.rawServiceResponse()).then((response: object) => {
      cy.getByDataCy('layer-control-content').click({ force: true });
      addExternalGeoJsonLayer(layerName, layerUrl, response, 'externalCharacterGeoJson');
      openExternalLayerCustomize(layerName).within(() => {
        cy.contains('.option .label', 'Stroke color').should('be.visible');
        cy.contains('li.option', 'Fill color').find('mcc-color-picker').should('be.visible');
        cy.contains('.option .label', 'Size').should('be.visible');
        cy.contains('.option .label', 'Cluster').should('be.visible');
        cy.contains('.option .label', 'Marker Icon').should('not.exist');
        cy.contains('li.option', 'Value').as('characterValue');
        cy.get('@characterValue').find('input').should('have.value', 'S').clear().type('A');
        cy.get('@characterValue').find('button').first().click();
      });

      cy.get('.leaflet-marker-pane .fa-marker-icon-icon')
        .should('have.length.greaterThan', 0)
        .each(marker => expect(marker.text()).to.equal('A'));

      cy.get('@externalLayer').find('app-layer-customize').within(() => {
        cy.get('@characterValue').find('button').eq(1).click();
        cy.get('@characterValue').find('input').should('have.value', 'S');
      });
      cy.get('.leaflet-marker-pane .fa-marker-icon-icon')
        .each(marker => expect(marker.text()).to.equal('S'));

      let fixedFillColor = '';
      cy.get('.leaflet-marker-pane .fa-marker-icon-icon').first().then(marker => {
        fixedFillColor = marker.css('color');
      });
      cy.get('@externalLayer').find('[data-cy="marker-color-mode"]').click();
      cy.get('mat-option').contains('By parameter').click();
      cy.get('@externalLayer').find('[data-cy="marker-color-property"]').click();
      cy.get('mat-option').contains('Altitude').click();

      cy.get('@externalLayer').find('app-layer-customize')
        .contains('li.option', 'Fill color')
        .find('mcc-color-picker')
        .should('be.visible');
      cy.get('.leaflet-marker-pane .fa-marker-icon-icon')
        .each(marker => expect(marker.css('color')).to.equal(fixedFillColor));
      cy.get('.leaflet-marker-pane .marker-gradient').should(markers => {
        const backgrounds = [...markers].map(marker => (marker as HTMLElement).style.background);
        expect(new Set(backgrounds).size).to.be.greaterThan(1);
      });

      cy.get('@externalLayer').find('app-layer-customize')
        .contains('li.option', 'Fill color')
        .find('.btn-picker')
        .click();
      cy.get('[role="dialog"][aria-label="Color picker"] canvas#colors').click(10, 100);
      cy.get('[role="dialog"][aria-label="Color picker"] .mcc-picker-selector').click(180, 40);
      let updatedFillColor = '';
      cy.get('@externalLayer').find('app-layer-customize')
        .contains('li.option', 'Fill color')
        .find('.btn-picker-background')
        .should(swatch => {
          updatedFillColor = swatch.css('background-color');
          expect(updatedFillColor).not.to.equal(fixedFillColor);
        });
      cy.get('.leaflet-marker-pane .fa-marker-icon-icon').should(markers => {
        markers.each((_index, marker) => {
          expect(Cypress.$(marker).css('color')).to.equal(updatedFillColor);
        });
      });
    });
  });

  it('Applies parameter colors to pinned Font Awesome marker strokes', () => {
    const layerName = 'Pinned Font Awesome markers';
    const layerUrl = 'https://example.test/pinned-fa.geojson';
    const response = {
      type: 'FeatureCollection',
      '@epos_style': {
        station: {
          label: 'Station',
          marker: { fontawesome_class: 'fas fa-star', pin: true, clustering: false },
        },
      },
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [12, 42] },
          properties: { '@epos_type': 'station', Value: 0 },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [13, 43] },
          properties: { '@epos_type': 'station', Value: 10 },
        },
      ],
    };

    cy.getByDataCy('layer-control-content').click({ force: true });
    addExternalGeoJsonLayer(layerName, layerUrl, response, 'externalPinnedFaGeoJson');
    openExternalLayerCustomize(layerName);

    let fixedFillColor = '';
    cy.get('.leaflet-marker-pane .fa-marker-icon-icon').first().then(marker => {
      fixedFillColor = marker.css('color');
    });
    cy.get('@externalLayer').find('[data-cy="marker-color-mode"]').click();
    cy.get('mat-option').contains('By parameter').click();
    cy.get('@externalLayer').find('[data-cy="marker-color-property"]').click();
    cy.get('mat-option').contains('Value').click();

    cy.get('@externalLayer').find('app-layer-customize')
      .contains('li.option', 'Fill color')
      .find('mcc-color-picker')
      .should('be.visible');
    cy.get('.leaflet-marker-pane .fa-marker-icon-icon')
      .should('have.length', 2)
      .each(marker => expect(marker.css('color')).to.equal(fixedFillColor));
    cy.get('.leaflet-marker-pane .marker-gradient').should(markers => {
      const backgrounds = [...markers].map(marker => (marker as HTMLElement).style.background);
      expect(new Set(backgrounds).size).to.equal(2);
    });
  });

  it('Keeps image and raw marker sources isolated', () => {
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlZkAAAAASUVORK5CYII=';
    const pngDataUrl = `data:image/png;base64,${pngBase64}`;
    const gifDataUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    const makeGeoJson = (marker: object) => ({
      type: 'FeatureCollection',
      '@epos_style': { station: { label: 'Station', marker } },
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [12, 42] },
        properties: { '@epos_type': 'station', Title: 'Station' },
      }],
    });
    let unexpectedSRequests = 0;

    cy.intercept('GET', '**/S', request => {
      unexpectedSRequests++;
      request.reply(404);
    });
    cy.getByDataCy('layer-control-content').click({ force: true });
    addExternalGeoJsonLayer(
      'Image marker',
      'https://example.test/image-marker.geojson',
      makeGeoJson({ href: pngDataUrl, pin: false, clustering: false }),
      'externalImageGeoJson',
    );
    addExternalGeoJsonLayer(
      'Raw marker',
      'https://example.test/raw-marker.geojson',
      makeGeoJson({ raw: pngBase64, pin: false, clustering: false }),
      'externalRawGeoJson',
    );

    cy.get(`.leaflet-marker-pane img[src="${pngDataUrl}"]`).should('have.length', 2);
    openExternalLayerCustomize('Image marker').within(() => {
      cy.contains('li.option', 'Icon url').as('imageUrl');
      cy.get('@imageUrl').find('input').clear().type(gifDataUrl, { parseSpecialCharSequences: false });
      cy.get('@imageUrl').find('button').first().click();
    });

    cy.get(`.leaflet-marker-pane img[src="${gifDataUrl}"]`).should('have.length', 1);
    cy.get(`.leaflet-marker-pane img[src="${pngDataUrl}"]`).should('have.length', 1);
    cy.then(() => expect(unexpectedSRequests).to.equal(0));
  });
});
