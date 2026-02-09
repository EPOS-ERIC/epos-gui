import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from 'services/notification.service';
import { LiveDeploymentService } from 'services/liveDeployment.service';
import { DialogData } from '../baseDialogService.abstract';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Tracker } from 'utility/tracker/tracker.service';
import { TrackerAction, TrackerCategory } from 'utility/tracker/tracker.enum';

/**
 * This is the component used to display the feedback form.
 * It calls out for Domain drop-down options.
 * Submitting the form adds an issue to the associated gitlab project.
 *
 * The gitlab end-point is set in this project's pipeline variables (via the environment files)
 * and the build process.
 */
@Component({
  selector: 'app-feedback-dialog',
  templateUrl: './feedbackDialog.component.html',
  styleUrls: ['./feedbackDialog.component.scss']
})
export class FeedbackDialogComponent implements OnInit {
  public readonly defaultAlert = 'This field is required';

  public show: 'loader' | 'form' | 'error' = 'loader';
  public isLive: boolean;
  public submitDisabled = false;

  public readonly FEEDBACK_TYPE_ENUM = FeedbackType;

  public formGroup: UntypedFormGroup;
  public feedback: null | Record<string, unknown> = null;

  public formInitialState = {
    feedbackType: FeedbackType.FEATURE_REQUEST,
  };

  // Live credentials obtained during build, from gitlab variables.
  private readonly FEEDBACK_API_URL = window.location.href + (window.location.href.endsWith('/') ? '' : '/') + 'api/v1/submit_feedback';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private readonly formBuilder: UntypedFormBuilder,
    private readonly http: HttpClient,
    private readonly notificationService: NotificationService,
    liveDeploymentService: LiveDeploymentService,
    private readonly tracker: Tracker,
  ) {
    this.isLive = liveDeploymentService.getIsLiveDeployment();
  }

  /**
   * FormControl of the name field.
   * @return {FormControl}
   */
  get name(): UntypedFormControl {
    return this.formGroup.get('name') as UntypedFormControl;
  }
  /**
   * FormControl of the affiliation field.
   * @return {FormControl}
   */
  get affiliation(): UntypedFormControl {
    return this.formGroup.get('affiliation') as UntypedFormControl;
  }
  /**
   * FormControl of the email field.
   * @return {FormControl}
   */
  get email(): UntypedFormControl {
    return this.formGroup.get('email') as UntypedFormControl;
  }
  /**
   * FormControl of the confirm-email field.
   * @return {FormControl}
   */
  get confirmEmail(): UntypedFormControl {
    return this.formGroup.get('confirmEmail') as UntypedFormControl;
  }
  /**
   * FormControl of the subject field.
   * @return {FormControl}
   */
  get subject(): UntypedFormControl {
    return this.formGroup.get('subject') as UntypedFormControl;
  }
  /**
   * FormControl of the message field.
   * @return {FormControl}
   */
  get message(): UntypedFormControl {
    return this.formGroup.get('message') as UntypedFormControl;
  }
  /**
   * FormControl of the domain field.
   * @return {FormControl}
   */
  get domain(): UntypedFormControl {
    return this.formGroup.get('domain') as UntypedFormControl;
  }
  /**
   * FormControl of the domain field.
   * @return {FormControl}
   */
  get feedbackType(): UntypedFormControl {
    return this.formGroup.get('feedbackType') as UntypedFormControl;
  }

  public ngOnInit(): void {
    this.createForm();
    this.show = 'form';
  }

  /**
   * Called when the email field changes and triggers re-evaluation of the confirm-email field.
   */
  public emailChanged(): void {
    this.confirmEmail.setValue(this.confirmEmail.value);
  }

  /**
   * Returns an error for the email field or an empty string if it is valid.
   */
  public getErrorEmail(): string {
    return this.email.hasError('required') ? this.defaultAlert :
      this.email.hasError('email') ? 'Not a valid email address' : '';
  }

  /**
   * Submits the data to the Gitlab project if Live.
   * @param post {object} Data object to be submitted.
   */
  public onSubmit(post: Record<string, string>): Promise<void> {
    this.submitDisabled = true;

    // if not live, post locally to allow browser inspection
    const postUrl = (!this.isLive) ? '' : `${this.FEEDBACK_API_URL}`;
    return this.http.post(postUrl,
      {
        title: post.subject,
        labels: ['Triage', this.feedbackType.value].join(','),
        description:
          `name: ${post.name}  \n` +
          `affiliation: ${post.affiliation}  \n` +
          `email: ${post.email}  \n` +
          `message: ${post.message}`
      }).toPromise()
      .catch((err) => {
        if (!this.isLive) {
          // fake a successful response
          return this.getFakeSubmissionResponse();
        } else {
          // real error handling
          this.notificationService.sendNotification(
            'Error sending feedback form. Please try again.',
            'Close',
            'error'
          );
          this.submitDisabled = false;
        }
      })
      .then((res: Record<string, unknown>) => {
        this.tracker.trackEvent(TrackerCategory.GENERAL, TrackerAction.FEEDBACK, 'Submit');
        this.feedback = res;
      });
  }

  private createForm() {
    this.formGroup = this.formBuilder.group({
      // eslint-disable-next-line @typescript-eslint/unbound-method
      name: [null, Validators.required],
      affiliation: [null, []],
      // eslint-disable-next-line @typescript-eslint/unbound-method
      email: [null, [Validators.required, Validators.email]],
      confirmEmail: [null, []],
      domain: [null, []],
      // eslint-disable-next-line @typescript-eslint/unbound-method
      feedbackType: [null, Validators.required],
      // eslint-disable-next-line @typescript-eslint/unbound-method
      subject: [null, Validators.required],
      // eslint-disable-next-line @typescript-eslint/unbound-method
      message: [null, Validators.required],
    });
    this.formGroup.reset(this.formInitialState);

    this.confirmEmail.setValidators([this.sameValueValidator(this.email)]);
  }

  /**
   * A validator function for comparing the host FormControl value with the refControl value.
   * @param refControl {FormControl} FormControl to compare the host control with.
   */
  private sameValueValidator(refControl: UntypedFormControl): ValidatorFn {
    return (control: AbstractControl): { [key: string]: Record<string, unknown> } | null => {
      const different = (control.value !== refControl.value);
      return (different) ? { differvalue: { value: control.value } } : null;
    };
  }

  private getFakeSubmissionResponse(): Promise<Record<string, unknown>> {
    return Promise.resolve({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      fake_response: true,
    });

  }
}

enum FeedbackType {
  BUG_REPORT = 'Bugreport',
  FEATURE_REQUEST = 'Newfeaturerequest',
  REQUEST_SUPPORT = 'Requestsupport',
}
