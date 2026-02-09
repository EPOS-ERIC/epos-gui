import { MetaDataStatusService } from 'services/metaDataStatus.service';
import { ModelItem } from './modelItem';

// This ModelItem is meant to hold the status of the MetadataPreview mode (if enabled or not).
export class MetadataPreviewModeMI extends ModelItem<null | boolean> {
  constructor(
  ) {
    const defaultValue: null | boolean = null;
    super(defaultValue);

    this.persistable = true;
    this.setInitFunction((modelItem: ModelItem<boolean>) => {
        return new Promise((resolve) => {
          // TEMPORARILY DISABLING THIS MODELITEM, To BE REACTIVATED WHEN METADATA STATUS MODE IS READY!!!
          const metadataStatusService = this.getService('MetaDataStatusService') as MetaDataStatusService;
          // set current
          this.set(metadataStatusService.metadataStatusModeActive.getValue());
          // on init, set up a watch
          metadataStatusService.metadataStatusModeActiveObs().subscribe((active: boolean) => {
            if (active !== this.get()) {
              this.set(active);
            }
          });
          resolve();
        });
      });
  }
}
