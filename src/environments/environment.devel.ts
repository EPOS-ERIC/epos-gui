import { environmentBase } from './environmentBase';

export const environmentDevel = {
  ...environmentBase,
  ...{
    matomoEndpoint: 'http://localhost:8080', // populated during pipeline
    matomoSiteId: '1', // populated during pipeline
    matomoTrackEvent: true,
    modules: {
      data: true, // turns the data section on and off
      analysis: true, // turns the analysis section on and off
      registry: true, // turns the registry section on and off
      software: true, // turns the software section on and off
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    mainMenu: environmentBase.mainMenu.concat({ name: 'Reset All', action: 'resetall', icon: 'clear' }),
  },
};
