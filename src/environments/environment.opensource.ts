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
        name: 'Guided Tour',
        action: 'startGuidedTour',
        icon: 'live_help',
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
