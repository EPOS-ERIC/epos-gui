import { Directive, HostListener } from '@angular/core';
import { DialogService } from 'components/dialog/dialog.service';

/**
 * Direcive for showing the [disclaimer]{@link DisclaimerDialogComponent} via the {@link DialogService}.
 */
@Directive({
  selector: '[appShowDisclaimerDirective]'
})
export class ShowDisclaimerDirective {

  constructor(
    private readonly dialogService: DialogService,
  ) { }

  /**
   * Sets up the onClick trigger.
   */
  @HostListener('click') onClick(): void {
    void this.dialogService.openDisclaimerDialog();
  }

}
