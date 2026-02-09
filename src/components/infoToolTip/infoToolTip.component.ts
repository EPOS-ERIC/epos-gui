import { Component, Input } from '@angular/core';

/**
 * A wrapper for
 * [Angular Material Tooltips]{@link https://material.angular.io/components/tooltip/overview}
 * that allows us standardize it for info icons.
 */
@Component({
  selector: 'app-info-tool-tip',
  templateUrl: './infoToolTip.component.html',
  styleUrls: ['./infoToolTip.component.scss']
})
export class InfoToolTipComponent {
  @Input() toolTipString: string;

  public setToolTipString(toolTipComment: string): void {
    this.toolTipString = toolTipComment;
  }

}
