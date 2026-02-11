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
    showScientificExamples: false,
    poweredByText: 'This Platform is Powered By EPOS Open Source',
    platformLogoPath: 'assets/img/logo/logo-opensource-1-light.png',
    version: openSourceVersion,
  },
};
