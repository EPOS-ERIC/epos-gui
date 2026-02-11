import { environmentBase } from './environmentBase';

export const environment = {
  ...environmentBase,
  ...{
    production: true,
    eposSiteApiRestUrl: '',
    eposSiteApiRestKey: '',
    esriApiKey: '',
    shareSalt: 'CHANGE_ME',
    matomoTrackEvent: false,
  },
};
