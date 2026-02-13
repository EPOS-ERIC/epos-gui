/**
 * This is the base environment configuration containing default values and all environments
 * should inherit from it.
 *
 * Values that are marked as "populated during pipeline" have their values overwritten during
 * the pipeline build stage.
 */
export const environmentBase = {
  production: false,
  version: '',
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
  showWelcomePopup: false,
  showScientificExamples: true,
  poweredByText: 'Powered by the EPOS Platform Open Source project',
  platformLogoPath: 'assets/img/logo/ENVRI-Hub-logo-white.svg',
  menuShare: true,
  minWidth: 900,
  homepage: 'https://envri.eu/',
  aboutpage: 'https://www.epos-eu.org/dataportal',
  termsAndConditions: 'https://www.epos-eu.org/sites/default/files/Terms_and_Conditions.pdf',
  vocabularyEndpoint: 'https://registry.epos-eu.org/ncl/system/query',
  fairAssessmentUrl: 'https://ics-c.epos-ip.org/epos-fair-assessment/',
  videos: [
    {
      title: 'Introduction to ENVRI',
      url: ''
    },
    {
      title: 'Data search',
      url: ''
    },
    {
      title: 'Configuration and visualization of services',
      url: ''
    }
  ],
  modules: {
    data: true, // turns the data section on and off
    analysis: false, // turns the analysis section on and off
    registry: false, // turns the analysis section on and off
    software: false // turns the software section on and off
  },
  mainMenu: [{
    name: 'About',
    children: [
      {
        name: 'About ENVRI',
        url: 'https://envri.eu/',
        icon: 'info'
      },
      {
        name: 'ENVRI API',
        url: window.location.href + '/api/v1/ui/',
        icon: 'cloud'
      },
    ],
  },
  {
    name: 'Guided Tour',
    action: 'startGuidedTour',
    icon: 'live_help',
  },
  {
    name: 'Backoffice',
    url: 'https://catalogue.staging.envri.eu/backoffice/login',
    icon: 'edit_document',
  },
  ]
};
