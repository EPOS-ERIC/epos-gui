import { ModelItem } from './modelItem';
import { AAAIUser } from 'api/aaai/aaaiUser.interface';
import { AaaiService } from 'api/aaai.service';

/**
 * A {@link ModelItem} that holds a {@link AAAIUser}.
 */
export class UserMI extends ModelItem<null | AAAIUser> {

  constructor(
  ) {
    super(null);

    this.setInitFunction((modelItem: ModelItem<AAAIUser>) => {
      return new Promise((resolve) => {
        const aaaiService = this.getService('AaaiService') as AaaiService;
        // set current
        this.set(aaaiService.getUser());
        // on init, set up a watch
        aaaiService.watchUser().subscribe((aaaiUser: null | AAAIUser) => {
          if (aaaiUser !== this.get()) {
            this.set(aaaiUser);
          }
        });
        resolve();
      });
    });
  }
}
