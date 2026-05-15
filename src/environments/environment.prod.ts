import { environmentBase } from './environmentBase';

const authRootUrl = decodeURIComponent('__AUTH_ROOT_URL__');

export const environmentProd = {
  ...environmentBase,
  production: true,
  matomoEndpoint: 'https://analytics.envri.eu/',
  matomoSiteId: '4',
  authRootUrl: authRootUrl.startsWith('http') ? authRootUrl : 'https://login.staging.envri.eu/auth/realms/envri',
  // look for Backoffice menu item and change url to PROD Backoffice URL, otherwise keep the envBase one.
  mainMenu: environmentBase.mainMenu.map((item) =>
    item.name === 'Backoffice'
      ? { ...item, url: 'https://catalogue.envri.eu/backoffice/login' }
      : item
  ),
};
