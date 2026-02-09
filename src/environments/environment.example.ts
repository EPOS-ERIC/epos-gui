/**
 * Inherits from {@link environmentBase}.
 *
 * The alternative environment file should be referenced in the angular.json file.  This will
 * enable the default environment.ts file to be replaced by the alternative one at build time,
 * depending on the parameter set in the command line.  For example:
 * "ng serve --env=example",
 */
import { environmentBase } from './environmentBase';

export const environment = {
  ...environmentBase,
  ...{
    environmentName: 'example_environment',
    githash: 'example_hash',
    commitDate: 'example_date',
  },
};
