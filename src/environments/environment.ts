/**
 * Inherits from {@link environmentBase}.
 *
 * The file contents for the current environment will overwrite these during build if an
 * environment argument is added to the build command.
 *
 * See notes in environment.example.ts
 */

import { environmentDevel } from './environment.devel';
import { environmentLatest } from './environment.latest';
import { environmentProd } from './environment.prod';
import { environmentStage } from './environment.stage';
import { environmentBase } from './environmentBase';

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function getEnvironment() {
  switch (window.location.host) {

    case 'EPOS_ENV_PROD_URL':
      return { ...environmentProd };
      break;

    case 'EPOS_ENV_STAGE_URL':
      return { ...environmentStage };
      break;

    case 'EPOS_ENV_LATEST_URL':
      return { ...environmentLatest };
      break;

    case 'localhost:4200':
      return { ...environmentDevel };
      break;

    default:
      return {
        ...environmentBase,
        ...{
        }
      };
      break;
  }

}

export const environment = getEnvironment();
