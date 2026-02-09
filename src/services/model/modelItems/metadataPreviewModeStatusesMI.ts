import { MetaDataStatusService } from 'services/metaDataStatus.service';
import { ModelItem } from './modelItem';

// This ModelItem is meant to hold the MetadataPreview feature selected statuses (current statuses: 'published', 'draft', 'submitted', 'archived').
export class MetadataPreviewModeStatusesMI extends ModelItem<null | Array<string>> {
  constructor(
  ) {
    const defaultValue: null | Array<string> = null;
    super(defaultValue);

    this.persistable = true;
    this.setInitFunction((modelItem: ModelItem<Array<string>>) => {
        return new Promise((resolve) => {
          // TEMPORARILY DISABLING THIS MODELITEM, TO BE REACTIVATED WHEN METADATA STATUS MODE IS READY!!!
          const metadataStatusService = this.getService('MetaDataStatusService') as MetaDataStatusService;
          // set current
          this.set(metadataStatusService.metadataSelectedStatuses.getValue());
          // on init, set up a watch
          metadataStatusService.metadataSelectedStatusesObs().subscribe((active: Array<string>) => {
            if (active !== this.get()) {
              this.set(active);
            }
          });
          resolve();
        });
      });
  }
}
