import { environmentBase } from './environmentBase';

export const environmentTest = {
  ...environmentBase,
  ...{
    matomoEndpoint: 'EPOS_LATEST_MATOMO_ENDPOINT', // populated during pipeline
    matomoSiteId: 'EPOS_LATEST_MATOMO_SITE_ID', // populated during pipeline
    matomoTrackEvent: false,
    modules: {
      data: true, // turns the data section on and off
      analysis: false, // turns the analysis section on and off
      registry: true, // turns the registry section on and off
      software: true // turns the software section on and off
    },
  }
};
