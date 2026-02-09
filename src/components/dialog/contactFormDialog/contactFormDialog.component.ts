import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NotificationService } from 'services/notification.service';
import { LiveDeploymentService } from 'services/liveDeployment.service';
import { DialogData } from '../baseDialogService.abstract';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SearchService } from 'services/search.service';
import { DistributionDetails } from 'api/webApi/data/distributionDetails.interface';
import { DistributionContactPoint } from 'api/webApi/data/distributionContactPoint.interface';
import { AaaiService } from 'api/aaai.service';
import { AAAIUser } from 'api/aaai/aaaiUser.interface';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { Tracker } from 'utility/tracker/tracker.service';
import { TrackerAction, TrackerCategory } from 'utility/tracker/tracker.enum';

export interface DetailsDataIn {
  distId: string;
  context: string;
}

@Component({
  selector: 'app-contact-form-dialog',
  templateUrl: './contactFormDialog.component.html',
  styleUrls: ['./contactFormDialog.component.scss']
})
export class ContactFormDialogComponent implements OnInit {
  public readonly defaultAlert = 'This field is required';

  public show: 'loader' | 'form' | 'error' = 'loader';
  public isLive: boolean;
  public submitDisabled = false;
  public detailsData: DistributionDetails | undefined;
  public availablesContactPoints: Array<DistributionContactPoint>;
  public user: AAAIUser | null;
  public itemName: string | null;

  public formGroup: FormGroup;
  public feedback: null | Record<string, unknown> = null;

  public readonly typeOptionLabel = new Map(Object.entries(
    {
      SERVICEPROVIDERS: 'Service',
      DATAPROVIDERS: 'Data',
      ALL: 'Both',
    }));

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData<DetailsDataIn>,
    private readonly formBuilder: FormBuilder,
    private readonly http: HttpClient,
    private readonly notificationService: NotificationService,
    liveDeploymentService: LiveDeploymentService,
    private readonly searchService: SearchService,
    private readonly aaai: AaaiService,
    private readonly localStoragePersister: LocalStoragePersister,
    private readonly tracker: Tracker,
  ) {
    this.isLive = liveDeploymentService.getIsLiveDeployment();
  }

  /**
 * FormControl of the subject field.
 * @return {FormControl}
 */
  get subject(): FormControl {
    return this.formGroup.get('subject') as FormControl;
  }
  /**
   * FormControl of the message field.
   * @return {FormControl}
   */
  get message(): FormControl {
    return this.formGroup.get('message') as FormControl;
  }

  /**
 * FormControl of the type field.
 * @return {FormControl}
 */
  get type(): FormControl {
    return this.formGroup.get('type') as FormControl;
  }

  public ngOnInit(): void {

    void this.searchService.getDetailsById(this.data.dataIn.distId, this.data.dataIn.context)
      .then((distributionDetails: DistributionDetails) => {
        this.detailsData = distributionDetails;
        if (this.detailsData !== undefined) {
          this.availablesContactPoints = this.detailsData.getAvailableContactPoints();
          this.itemName = this.detailsData.getName();
        }
      });
    this.user = this.aaai.getUser();

    this.createForm();
    this.show = 'form';
  }

  /**
   * Submits the data to the Gitlab project if Live.
   * @param post {object} Data object to be submitted.
   */
  public onSubmit(post: Record<string, string>): Promise<void> {
    this.submitDisabled = true;

    let message = '';
    if (this.detailsData !== undefined) {
      message += 'Message about: ' + this.detailsData.getName() + '\n';
    }
    message += post.message.trim();

    const body = {
      subject: 'EPOS Platform | User request | ' + post.subject.trim(),
      bodyText: message,
    };

    const postUrl = post.type;
    const user = this.aaai.getUser();

    const httpOptions = {
      headers: new HttpHeaders({
        Authorization: 'Bearer ' + user?.getToken(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/json',
      }),
    };

    return this.http.post(postUrl, body, httpOptions).toPromise()
      .catch((err) => {

        // real error handling
        this.notificationService.sendNotification(
          'Error sending message. Please try again.',
          'Close',
          'error'
        );
        this.submitDisabled = false;
      })
      .then((res: Record<string, unknown>) => {
        this.feedback = res;

        if (this.detailsData !== undefined) {
          this.tracker.trackEvent(TrackerCategory.DISTRIBUTION, TrackerAction.CONTACT_US, this.detailsData.getDomainCode() + Tracker.TARCKER_DATA_SEPARATION + this.detailsData.getName());
        }

      });
  }

  public close(): void {
    this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, '', false, LocalStorageVariables.LS_LAST_DETAIL_DIALOG_ID);

    this.data.close();
  }

  private createForm() {
    this.formGroup = this.formBuilder.group({
      // eslint-disable-next-line @typescript-eslint/unbound-method
      type: [null, Validators.required],

      // eslint-disable-next-line @typescript-eslint/unbound-method
      subject: [null, [Validators.required, this.noWhitespaceValidator]],
      // eslint-disable-next-line @typescript-eslint/unbound-method
      message: [null, [Validators.required, this.noWhitespaceValidator]],
    });
    this.formGroup.reset();
  }

  private noWhitespaceValidator(control: FormControl) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return (control.value || '').trim().length ? null : { whitespace: true };
  }
}
