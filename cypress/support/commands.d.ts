declare namespace Cypress {
  interface Chainable<Subject = any> {
    policyAccept(): void;

    welcomePopup(): void;

    openService(tcs: string, name: string): void;

    policyAcceptAndWelcomePopup(): void;

    getByDataCy(dataCy: string): Chainable<JQuery<HTMLElement>>;

    waitForDomainList(): void;

    init(): void;

    freeTextSearch(text: string): void;

    getLeafletPane(id: string): Chainable<JQuery<HTMLElement>>;

    getServiceMapFeatures(service: Service): Chainable<JQuery<HTMLElement>>;

    searchForService(service: Service): void;

    interceptService(service: Service): void;
  }
}
