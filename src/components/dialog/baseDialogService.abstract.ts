import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';

export abstract class BaseDialogService {

  private readonly customBackdropCounts = new Map<HTMLElement, number>();
  private readonly customBackdrop: HTMLElement;

  constructor(
    public readonly dialog: MatDialog,
  ) {
    this.customBackdrop = document.createElement('div');
    this.customBackdrop.classList.add('dialog-custom-backdrop');
  }

  protected makeDialogData<DataInType, DataOutType>(
    id: string,
    closable = true,
    dataIn: null | Record<string, unknown> = null,
  ): DialogData<DataInType, DataOutType> {
    const data = {
      closable: closable,
      requiresRefreshOnClose: false,
      close: () => {
        const dialogRef = this.dialog.getDialogById(id);
        if (null == dialogRef) {
          console.log(`Attempt to close non-existent dialog with id "${id}."`);
        } else {
          dialogRef.close(data);
        }
      },
      dataIn: dataIn ?? {},
      dataOut: {},
    } as unknown as DialogData<DataInType, DataOutType>;
    return data;
  }

  protected openDialog<DataInType = unknown, DataOutType = unknown>(
    dialogId: string,
    contentComponent: ComponentType<unknown>,
    panelClass: string,
    closable = true,
    customData: null | Record<string, unknown> = null,
    configIn: null | MatDialogConfig = null,
    parentElement: null | HTMLElement = null,
  ): Promise<null | DialogData<DataInType, DataOutType>> {

    // don't open if already open
    let dialogRef = this.dialog.getDialogById(dialogId);
    return new Promise((resolve) => {
      if (null != dialogRef) {
        console.warn('Dialog already open');
        resolve(null);
      } else {
        const dialogData = this.makeDialogData<DataInType, DataOutType>(dialogId, closable, customData);

        let config = {
          maxHeight: '98vh',
          maxWidth: '95vw',
          panelClass: panelClass,
          data: dialogData,
          id: dialogId,
          hasBackdrop: (null == parentElement),
          disableClose: !closable,
        } as Record<string, unknown>;

        if (null != configIn) {
          config = {
            ...config,
            ...configIn,
          };
        }


        this.addCustomBackdrop(parentElement);
        dialogRef = this.dialog.open(contentComponent, config);

        void dialogRef.afterClosed().toPromise().then(e => {
          if (null != parentElement) {
            this.tryRemoveCustomBackdrop(parentElement);
          }
        });
        resolve(dialogRef.afterClosed().toPromise());
      }
    });
  }

  protected addCustomBackdrop(parentElement: null | HTMLElement): void {
    if (null != parentElement) {
      if (this.customBackdropCounts.has(parentElement)) {
        this.customBackdropCounts.set(parentElement, this.customBackdropCounts.get(parentElement)! + 1);
      } else {
        this.customBackdropCounts.set(parentElement, 1);
        parentElement.classList.add('dialog-custom-backdrop-wrapper');
        parentElement.appendChild(this.customBackdrop);
      }
    }
  }
  protected tryRemoveCustomBackdrop(parentElement: HTMLElement): void {
    if ((null != parentElement) && (this.customBackdropCounts.has(parentElement))) {
      this.customBackdropCounts.set(parentElement, this.customBackdropCounts.get(parentElement)! - 1);
      if (0 === this.customBackdropCounts.get(parentElement)) {
        this.customBackdropCounts.delete(parentElement);
        parentElement.classList.remove('dialog-custom-backdrop-wrapper');
        parentElement.removeChild(this.customBackdrop);
      }
    }
  }

}

export interface DialogData<DataInType = unknown, DataOutType = unknown> {
  closable: boolean;
  requiresRefreshOnClose: boolean;
  close: (moreData?: Record<string, unknown>) => void;
  dataIn: DataInType;
  dataOut: DataOutType;
}

