import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AAAIUser } from 'api/aaai/aaaiUser.interface';
import { AaaiService } from 'api/aaai.service';
import { DialogData } from '../baseDialogService.abstract';
import { Subscription } from 'rxjs';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { Model } from 'services/model/model.service';
import { environment } from 'environments/environment';
import { MetaDataStatusService } from 'services/metaDataStatus.service';

@Unsubscriber('subscriptions')
@Component({
  selector: 'app-please-login-content',
  templateUrl: './pleaseLoginContent.component.html',
  styleUrls: ['./pleaseLoginContent.component.scss']
})
export class PleaseLoginContentComponent {

  public user: null | AAAIUser;
  public title: string;
  public message: string;
  public manageUrl: string;

  private readonly subscriptions = new Array<Subscription>();

  constructor(
    private readonly aaai: AaaiService,
    private readonly model: Model,
    private readonly metadataStatusService: MetaDataStatusService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData<LoginMessageObject>,
  ) {
    this.title = data.dataIn.title as string;
    this.message = data.dataIn.message as string;
    this.manageUrl = this.aaai.getManageUrl();

    this.subscriptions.push(
      this.model.user.valueObs.subscribe((user: AAAIUser) => {
        this.user = user;
      })
    );
  }

  public login(): void {
    if (this.user == null) {
      this.metadataStatusService.setPromptPending(true);
      this.aaai.login();
    }
  }

  public openTermsAndConditions(): void {
    window.open(environment.termsAndConditions, '_blank');
  }

}

export interface LoginMessageObject {
  title: string;
  message: string;
}
