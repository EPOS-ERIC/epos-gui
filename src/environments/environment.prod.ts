import { environmentBase } from './environmentBase';

export const environmentProd = {
  ...environmentBase,
  ...{
    production: true,
    matomoEndpoint: 'EPOS_PROD_MATOMO_ENDPOINT', // populated during pipeline
    matomoSiteId: 'EPOS_PROD_MATOMO_SITE_ID', // populated during pipeline
    matomoTokenAuth: 'EPOS_PROD_MATOMO_TOKEN_AUTH', // populated during pipeline
    matomoTrackEvent: true,
    fairAssessmentUrl: 'https://www.ics-c.epos-eu.org/epos-fair-assessment/',
    modules: {
      data: true, // turns the data section on and off
      analysis: true, // turns the analysis section on and off
      registry: true, // turns the registry section on and off
      software: true, // turns the software section on and off
    },
  },
};
