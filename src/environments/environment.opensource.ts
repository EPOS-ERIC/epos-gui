import { environmentBase } from './environmentBase';

const openSourceVersion = (environmentBase.gitTag === 'GIT_TAG' ? 'dev' : environmentBase.gitTag) + ' - open source';

export const environment = {
  ...environmentBase,
  ...{
    production: true,
    eposSiteApiRestUrl: '',
    eposSiteApiRestKey: '',
    esriApiKey: '',
    shareSalt: 'CHANGE_ME',
    matomoTrackEvent: false,
    showPoliciesPopup: false,
    showWelcomePopup: false,
    version: openSourceVersion,
  },
};
