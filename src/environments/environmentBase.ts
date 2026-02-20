/**
 * This is the base environment configuration containing default values and all environments
 * should inherit from it.
 *
 * Values that are marked as "populated during pipeline" have their values overwritten during
 * the pipeline build stage.
 */
export const environmentBase = {
  production: false,
  version: (require('../../package.json') as Record<string, unknown>).version,
  githash: 'GITHASH', // populated during pipeline
  gitTag: 'GIT_TAG', // populate during pipeline
  commitDate: 'COMMIT_DATE', // populated during pipeline
  eposSiteApiRestUrl: 'EPOS_SITE_API_REST_URL', // populated during pipeline
  eposSiteApiRestKey: 'EPOS_SITE_API_REST_KEY', // populated during pipeline
  esriApiKey: 'EPOS_ESRI_API_KEY', // populated during pipeline
  shareSalt: 'EPOS_SHARE_SALT', // populated during pipeline
  matomoEndpoint: '', // populated during pipeline on env files
  matomoSiteId: '', // populated during pipeline on env files
  matomoTokenAuth: '', // populated during pipeline
  matomoTrackEvent: true,
  showPoliciesPopup: true,
  showWelcomePopup: true,
  showScientificExamples: true,
  poweredByText: 'This Platform is Powered By EPOS ERIC',
  platformLogoPath: 'assets/img/logo/logo-white.svg',
  menuShare: true,
  minWidth: 900,
  homepage: 'https://www.epos-eu.org',
  aboutpage: 'https://www.epos-eu.org/dataportal',
  termsAndConditions: 'https://www.epos-eu.org/sites/default/files/2026-02/Terms_and_ConditionsJan26_1.pdf',
  vocabularyEndpoint: 'https://registry.epos-eu.org/ncl/system/query',
  fairAssessmentUrl: 'https://ics-c.epos-ip.org/epos-fair-assessment/',
  showFairAssessment: true,
  videos: [
    {
      title: 'Introduction to EPOS',
      url: 'https://www.youtube-nocookie.com/embed/A5-WiWeG5-4'
    },
    {
      title: 'Data search',
      url: 'https://www.youtube-nocookie.com/embed/qpQuBlZBT7Y'
    },
    {
      title: 'Configuration and visualization of services',
      url: 'https://www.youtube-nocookie.com/embed/L2G7ir0cvxI'
    }
  ],
  modules: {
    data: true, // turns the data section on and off
    analysis: false, // turns the analysis section on and off
    registry: true, // turns the analysis section on and off
    software: true // turns the software section on and off
  },
  mainMenu: [{
    name: 'About',
    children: [
      {
        name: 'About EPOS Platform',
        url: 'https://www.epos-eu.org/dataportal',
        icon: 'info'
      },
      {
        name: 'EPOS API ',
        url: window.location.href + '/api/v1/ui/',
        icon: 'cloud'
      },
      {
        name: 'Service Monitoring',
        url: 'https://epos-services.vm.fedcloud.eu/monitoring/',
        icon: 'monitor_heart'
      },
      {
        name: 'Open Source project',
        url: 'https://epos-eu.github.io/epos-open-source/',
        icon: 'shopping_basket'
      },
      {
        name: 'Citation Guide',
        url: 'https://www.epos-eu.org/sites/default/files/2025-03/EPOS%20DDSS%20Citation%20Guide%20v3.1_12March2025_SCCapproved.pdf',
        icon: 'speaker_notes'
      },
      {
        name: 'Terms and Conditions ',
        url: 'https://www.epos-eu.org/sites/default/files/2026-02/Terms_and_ConditionsJan26_1.pdf',
        icon: 'insert_drive_file'
      }
    ],
  },
  {
    name: 'Feedback',
    action: 'feedback',
    icon: 'feedback',
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
  { name: 'Statistics',
    action: 'stats',
    icon: 'analytics'
  },
  {
    name: 'FAIR Assessment',
    action: 'fairAssessment',
    icon: 'workspace_premium',
  }
  ]
};
