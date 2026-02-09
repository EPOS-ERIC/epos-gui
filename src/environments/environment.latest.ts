import { environmentBase } from './environmentBase';

export const environmentLatest = {
  ...environmentBase,
  ...{
    matomoTrackEvent: true,
    modules: {
      data: true, // turns the data section on and off
      analysis: true, // turns the analysis section on and off
      registry: true, // turns the registry section on and off
      software: true, // turns the software section on and off
    },
  },
};
