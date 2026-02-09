import { Environment } from 'api/webApi/data/environments/environment.interface';
import { ModelItem } from './modelItem';
import { EnvironmentService } from 'services/environment.service';

/**
 * A {@link ModelItem} that holds an array of {@link Environment} items.
 *
 */
export class EnvironmentsMI extends ModelItem<null | Array<Environment>> {
  constructor(
  ) {
    super(null);
  }

  /**
   * Refreshes the {@link Environment}s associated with this user by calling out to the API
   * and replacing the items currently held.
   */
  public refresh(): Promise<void> {
    if (this.initialised) {
      this.set(null);
      // fetch from api
      const environmentService = this.services.EnvironmentService as EnvironmentService;
      return environmentService.getAllEnvironments()
        .then((environments: Array<Environment>) => {
          this.set(environments);
        });
    } else {
      return Promise.resolve();
    }
  }
}
