import { environmentBase } from './environmentBase';

const openSourceVersion = (environmentBase.gitTag === 'GIT_TAG' ? 'dev' : environmentBase.gitTag);
const authRootUrl = decodeURIComponent('__AUTH_ROOT_URL__');

export const environment = {
  ...environmentBase,
  ...{
    production: true,
    eposSiteApiRestUrl: '',
    eposSiteApiRestKey: '',
    esriApiKey: '',
    shareSalt: 'CHANGE_ME',
    authRootUrl: authRootUrl.startsWith('http') ? authRootUrl : 'http://localhost:35000',
    matomoTrackEvent: false,
    showPoliciesPopup: false,
    showWelcomePopup: false,
    showGuidedTourNotificationOnStart: false,
    showScientificExamples: false,
    showFairAssessment: false,
    poweredByText: 'This Platform is Powered By EPOS Open Source',
    platformLogoPath: 'assets/img/logo/logo-opensource-1-light.png',
    version: openSourceVersion,
    modules: {
      data: true,
      analysis: false,
      registry: false,
      software: true
    },
    mainMenu: [
      {
        name: 'About',
        children: [
          {
            name: 'About EPOS Platform',
            url: 'https://www.epos-eu.org/dataportal',
            icon: 'info',
          },
          {
            name: 'Open Source project',
            url: 'https://epos-eu.github.io/epos-open-source/',
            icon: 'shopping_basket',
          },
        ],
      },
      {
        name: 'Video Guides',
        action: 'videoguide',
        icon: 'movie',
      },
      {
        name: 'EPOS API ',
        url: window.location.href + '/api/v1/ui/',
        icon: 'cloud',
      },
    ],
  },
};
