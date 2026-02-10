import { GNSS_STATIONS_WITH_PRODUCTS } from '../support/constants';

describe('Test info popup', () => {
  beforeEach(() => {
    cy.init();
  });

  it('Open info popup', () => {
    // Intercept and mock all the requests for the GNSS_STATIONS_WITH_PRODUCTS service
    cy.interceptService(GNSS_STATIONS_WITH_PRODUCTS);

    // Search for the fake distribution
    cy.searchForService(GNSS_STATIONS_WITH_PRODUCTS);

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

    // Click on the info of the first distribution
    cy.getByDataCy('item-info-button')
      .first()
      .click();

    // Wait for the details request to be finished
    cy.wait(GNSS_STATIONS_WITH_PRODUCTS.detailsRequest);

    // Then the info dialog should be visible
    cy.getByDataCy('details-dialog')
      .should('be.visible');

    // Wait for the info dialog to be populated
    cy.getByDataCy('details-dialog-spinner')
      .should('not.exist');

    // The fields should be populated
    cy.getByDataCy('details-dialog-value').then(($values) => {
      cy.getByDataCy('details-dialog-key').then(($keys) => {

        expect($values).to.have.length(13);
        // Check if the values are populated correctly
        $values.each((i, value) => {
          const key = $keys[i].textContent.trim();
          const val = value.textContent.trim();

          switch (key) {
            case 'Name':
              expect(val).to.eq('GNSS Stations with Products');
              break;
            case 'Domain':
              expect(val).to.eq('GNSS Data and Products');
              break;
            case 'Categories':
              // First tree
              cy.wrap(value)
                .find('.mat-nested-tree-node')
                .then($value => {
                  // First text
                  cy.wrap($value)
                    .find('.mat-tree-node').should('contain.text', 'Products');
                  // Second text
                  cy.wrap($value)
                    .find('.mat-tree-node').should('contain.text', 'Station Information');
                });
              break;
            case 'Description':
              expect(val).to.eq('Displays the GNSS stations that provide GNSS Products on the map. Returns their metadata as a json, geojson, or csv file.');
              break;
            case 'Spatial Coverage':
              // Parse the val string as HTML and wrap it with Cypress
              // Check if the SVG map with the class "leaflet-zoom-animated" is present
              cy.wrap(value).find('svg.leaflet-zoom-animated').should('exist');
              break;
            case 'Temporal Coverage':
              expect(val).to.eq('1996-01-01 00:00:00 -  till present');
              break;
            case 'Persistent Identifier(s)':
              expect(val).to.eq('Unspecified');
              break;
            case 'License':
              expect(val).to.eq('http://creativecommons.org/licenses/by/4.0/');
              break;
            case 'Keywords':
              expect(val).to.eq('gnss station  ;  velocities  ;  computed  ;  gnss  ;  estimated  ;  coordinates  ;  time series  ;  gnss geojson products  ;  position  ;  geodesy  ;  products  ;');
              break;
            case 'Update Frequency':
              expect(val).to.eq('http://purl.org/cld/freq/continuous');
              break;
            case 'Quality Assurance':
              expect(val).to.eq('https://gnss-epos.eu/quality-assurance/');
              break;
            case 'Data Provider(s)':
              expect(val).to.eq('ORB - Observatoire royal de Belgique - BE');
              break;
            case 'Further information':
              expect(val).to.eq('https://www.epos-eu.org/tcs/gnss-data-and-products');
              break;
            default:
              throw new Error('Unknown key: ' + key);
          }
        });
      });
    });

    // The how to cite section should exist
    cy.getByDataCy('details-dialog-how-to-cite').click();

    cy.getByDataCy('details-dialog-how-to-cite-value').then(($values) => {
      cy.getByDataCy('details-dialog-how-to-cite-key').then(($keys) => {

        expect($values).to.have.length(3);
        // Check if the values are populated correctly
        $values.each((i, value) => {
          const key = $keys[i].textContent.trim();
          const val = value.textContent.trim();

          const dateObj = new Date();
          const day = String(dateObj.getDate()).padStart(2, '0');
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const year = dateObj.getFullYear();
          const today = `${day}-${month}-${year}`;

          switch (key) {
            case 'For citing the dataset as a reference in any publication':
              expect(val).to.eq(`GNSS Stations with Products, provided by ORB - Observatoire royal de Belgique - BE, http://creativecommons.org/licenses/by/4.0/.Accessed on ${today} through the EPOS Platform (https://www.epos-eu.org/dataportal)`);
              break;
            case 'For citing the EPOS Platform as a reference in any publication':
              expect(val).to.eq('Bailo, D., Paciello, R., Michalek, J. et al. The EPOS multi-disciplinary Platform for integrated access to solid Earth science datasets. Sci Data 10, 784 (2023). https://doi.org/10.1038/s41597-023-02697-9');
              break;
            case 'For citing the EPOS Platform contents different from DDSS (e.g. images, pictures)':
              expect(val).to.eq(`Credits: EPOS Platform (https://www.epos-eu.org/dataportal), ORB - Observatoire royal de Belgique - BE, http://creativecommons.org/licenses/by/4.0/. Accessed on ${today}`);
              break;
            default:
              throw new Error('Unknown key: ' + key);
          }
        });
      });
    });

    // The service details should exist
    cy.getByDataCy('details-dialog-service-details');

    // The service details should be populated
    cy.getByDataCy('details-dialog-service-value').then(($values) => {
      cy.getByDataCy('details-dialog-service-key').then(($keys) => {

        expect($values).to.have.length(5);
        // Check if the values are populated correctly
        $values.each((i, value) => {
          const key = $keys[i].textContent.trim();
          const val = value.textContent.trim();

          switch (key) {
            case 'Service Name':
              expect(val).to.eq('GNSS Stations With Products');
              break;
            case 'Service Description':
              expect(val).to.eq('Displays the GNSS stations that provide GNSS Products on the map. Returns their metadata as a json, geojson, or csv file.');
              break;
            case 'Service Provider':
              expect(val).to.eq('UBI - University of Beira Interior - PT');
              break;
            case 'Service Endpoint':
              expect(val).to.eq('https://gnssproducts.epos.ubi.pt/GlassFramework/webresources/stations/v2/station/bbox/');
              break;
            case 'Service Documentation':
              expect(val).to.eq('https://gnss-epos.eu/ics-tcs/');
              break;
            default:
              throw new Error('Unknown key: ' + key);
          }
        });
      });
    });

    // Close the dialog
    cy.getByDataCy('mat-dialog-close-button')
      .click();

    // Then the dialog should not be visible
    cy.getByDataCy('details-dialog')
      .should('not.exist');
  });
});
