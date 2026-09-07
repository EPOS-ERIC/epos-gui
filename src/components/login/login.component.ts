import { Component, Output, EventEmitter } from '@angular/core';
import { AaaiService } from 'api/aaai.service';
import { Subscription } from 'rxjs';
import { AAAIUser } from 'api/aaai/aaaiUser.interface';
import { Model } from 'services/model/model.service';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { environment } from 'environments/environment';
import { MetaDataStatusService } from 'services/metaDataStatus.service';

/**
 * Displays the User Interface for triggering authentication related
 * activities and uses the {@link AaaiService} to fulfill the request.
 */
@Unsubscriber('subscriptions')
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  @Output() closeDropdown: EventEmitter<void> = new EventEmitter<void>();

  public user: null | AAAIUser;
  public manageUrl: string;

  private readonly subscriptions = new Array<Subscription>();

  constructor(
    private readonly aaai: AaaiService,
    private readonly model: Model,
    private readonly metadataStatusService: MetaDataStatusService
  ) {
    this.subscriptions.push(
      this.model.user.valueObs.subscribe((user: AAAIUser) => {
        this.user = user;
      }),
    );
    this.user = this.model.user.get();

    this.manageUrl = this.aaai.getManageUrl();
  }

  public logInOut(): void {
    if (this.user != null) {
      this.aaai.logout();
      this.closeDropdown.emit();
    } else {
      this.metadataStatusService.setPromptPending(true);
      this.aaai.login();
    }
  }

  public openTermsAndConditions(): void {
    window.open(environment.termsAndConditions, '_blank');
  }
}
