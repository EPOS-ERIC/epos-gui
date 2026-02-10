/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import moment from 'moment-es6';
import { InformationsService } from 'services/informationsService.service';
import { PoliciesService } from 'services/policiesService.service';
import { GNSS_STATIONS_WITH_PRODUCTS, Service } from './constants';

// ***********************************************
// This example namespace declaration will help
// with Intellisense and code completion in your
// IDE or Text Editor.
// ***********************************************
// declare namespace Cypress {
//   interface Chainable<Subject = any> {
//     customCommand(param: any): typeof customCommand;
//   }
// }
//
// function customCommand(param: any): void {
//   console.warn(param);
// }
//
// NOTE: You can use it like so:
// Cypress.Commands.add('customCommand', customCommand);
//
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
//


// *********** TYPE DECLARATIONS IN commands.d.ts file ***************/

// // -- Accept policies
Cypress.Commands.add('policyAccept', () => {
  // PoliciesService.storeConsentsTimestamp(moment());
  // PoliciesService.storeCookieConsent(true);

  cy.getByDataCy('toggle-terms-checkbox').find('.mat-checkbox-inner-container').click();
  cy.getByDataCy('toggle-privacy-checkbox').find('.mat-checkbox-inner-container').click();
  cy.getByDataCy('accept-terms-button').click();

  cy.contains('EPOS POLICIES').should('not.exist');
});

// // -- Disable Welcome Popup
Cypress.Commands.add('welcomePopup', () => {
  cy.contains('CONTINUE TO THE PLATFORM').click();
  cy.contains('Welcome to the EPOS Platform!').should('not.exist');
});

Cypress.Commands.add('newFeatures', () => {
  cy.get('.new-feature-popup').get('.epos-close-btn').click();
  cy.contains('NEW FEATURES').should('not.exist');
});

Cypress.Commands.add('policyAcceptAndWelcomePopup', () => {
  cy.visit('/');
  cy.policyAccept();
  cy.welcomePopup();
  cy.newFeatures();
});

// Command to do get('[data-cy="..."') in a more readable way
// Example: cy.getByDataCy('domain-list > #list').first().click();
Cypress.Commands.add('getByDataCy', (args) => {
  // Get the first element of the string
  const dataCy = args.split(' > ')[0];
  const string = `[data-cy="${dataCy}"] ${args.replace(dataCy, '')}`;
  return cy.get(string);
});

Cypress.Commands.add('init', () => {
  cy.intercept('GET', /testpath\/api\/v1\/resources\/search(\?q=)?$/, { fixture: 'distributions.json' }).as('search');
  cy.intercept('GET', /testpath\/api\/v1\/resources\/organizations.*/, { fixture: 'organizations.json' }).as('organizations');
  cy.policyAcceptAndWelcomePopup();
  cy.wait(['@organizations']);
  cy.wait(['@search', '@search', '@search', '@search']);
});

Cypress.Commands.add('freeTextSearch', (text: string) => {
  // Intercept the request to filter the results
  cy.intercept('GET', '/testpath/api/v1/resources/search*').as('search');

  // Search for the test service
  cy.getByDataCy('search-panel-free-text-input').type(text + '{enter}');

  // Wait for the list to be filtered
  cy.wait('@search');
});

Cypress.Commands.add('getLeafletPane', (id: string) => {
  return cy.get('.leaflet-' + id + '-pane');
});

Cypress.Commands.add('getServiceMapFeatures', (service: Service) => {
  return service.getMarkerFunction(service);
});

// Search for a specific service and show only it
Cypress.Commands.add('searchForService', (service: Service) => {
  // Intercept the search request
  cy.intercept(
    'GET', /.*\/resources\/search(\?q=)?/,
    { fixture: service.searchJson() });

  // Search for the fake distribution
  cy.freeTextSearch(service.name);
});

Cypress.Commands.add('interceptService', (service: Service) => {
  // Intercept all the possible request for this service, stubbing them with the correct fixture and save a reference to the request to be able to wait on it
  // The details
  cy.intercept(
    'GET',
    new RegExp('.*/resources/details/' + service.id), // Match all the request to the details of the service
    // Stub the request with the correct fixture and save a reference to the request to be able to wait on it
    { fixture: service.detailsJson() }).as(service.detailsRequest.substring(1)); // Use the detailsRequest without the @
  // The complete data
  cy.intercept(
    'GET',
    new RegExp('.*/execute/' + service.id + '\\?.*'),
    { fixture: service.dataJson() }).as(service.dataRequest.substring(1));
  // The search request
  cy.intercept(
    'GET',
    new RegExp('.*/resources/search\\?q=' + encodeURIComponent(service.name)),
    { fixture: service.searchJson() }).as(service.searchRequest.substring(1));
  // The bbox filtered data
  cy.intercept(
    'GET', new RegExp(
      '.*/execute/' + service.id +
      '\\?.*minLon.*-5\\.00977.*maxLat.*54\\.00777.*maxLon.*9\\.93164.*minLat.*39\\.02772.*'),
    { fixture: service.bboxFilteredJson() }
  ).as(service.bboxFilteredRequest.substring(1));
  // The getoriginalurl
  cy.intercept(
    'GET',
    new RegExp(`.*/getoriginalurl/${service.id}.*`),
    { fixture: service.getOriginalURL() }
  ).as(service.getOriginalUrlRequest.substring(1));
});
