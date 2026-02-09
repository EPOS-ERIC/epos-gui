import { NgModule } from '@angular/core';
import { ShowDisclaimerDirective } from './showDisclaimer.directive';
import { AppRouterOutletDirective } from './appRouterOutlet.directive';
import { LinkIfUrlDirective } from './linkIfUrl.directive';
import { TourStageDirective } from './tourStage.directive';
import { MatBadgeFaIconDirective } from './matBadgeFaIcon.directive';
import { ResultPanelFluidHeightDirective } from './resultPanelFluidHeight.directive';

/**
 * Module for registering new directives that may be used anywhere in the app.
 */
@NgModule({
  declarations: [
    ShowDisclaimerDirective,
    AppRouterOutletDirective,
    LinkIfUrlDirective,
    TourStageDirective,
    ResultPanelFluidHeightDirective,
    MatBadgeFaIconDirective,
  ],
  imports: [
  ],
  providers: [],
  exports: [
    ShowDisclaimerDirective,
    AppRouterOutletDirective,
    LinkIfUrlDirective,
    TourStageDirective,
    ResultPanelFluidHeightDirective,
    MatBadgeFaIconDirective,
  ],
  bootstrap: []
})
export class DirectivesModule { }
