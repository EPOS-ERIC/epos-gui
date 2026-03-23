import { environmentBase } from './environmentBase';

export const environmentStage = {
  ...environmentBase,
  ...{
    /* matomoEndpoint: 'https://analytics.envri.eu/', */ // keeping it as a reference, not read by the script initializing matomo
    matomoSiteId: '5',
  },
};
