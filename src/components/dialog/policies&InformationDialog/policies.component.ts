import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from 'environments/environment';
import moment from 'moment-es6';
import { PoliciesService } from 'services/policiesService.service';
import { InformationsService } from 'services/informationsService.service';


@Component({
  selector: 'app-policies',
  templateUrl: 'policies.component.html',
  styleUrls: ['policies.component.scss'],
})
export class PoliciesComponent implements OnInit, OnDestroy {

  public readonly defaultAlert = 'This field is required';
  public cookiePolicy = true;
  public emailEnabled = false;
  public show: 'loader' | 'form' | 'error' = 'loader';
  public noShowAgain = false;
  public formGroup: UntypedFormGroup;
  public feedback: null | Record<string, unknown> = null;
  public errors: Array<string> = [];

  // Setting this to true will overide environment url and token
  private readonly LOCAL_TESTING = false;
  private readonly SUBMIT_FORM_ID = 'data_portal_informations';

  // Live credentials obtained during build
  private readonly EPOS_SITE_API_URL = (this.LOCAL_TESTING)
    ? 'https://some-web-form/submit'
    : environment.eposSiteApiRestUrl;

  private readonly EPOS_SITE_API_REST_KEY = (this.LOCAL_TESTING)
    ? 'some-api-key'
    : environment.eposSiteApiRestKey;

  constructor(
    private readonly policiesService: PoliciesService,
    private readonly informationsService: InformationsService,
    private readonly formBuilder: UntypedFormBuilder,
    private readonly http: HttpClient,
  ) {
  }

  get firstName(): UntypedFormControl {
    return this.formGroup.get('firstName') as UntypedFormControl;
  }

  get emailCtrl(): UntypedFormControl {
    return this.formGroup.get('email') as UntypedFormControl;
  }

  ngOnInit(): void {
    this.createForm();
    this.show = 'form';
  }

  ngOnDestroy(): void {
    if (this.noShowAgain) {
      this.informationsService.setInfoCheck(true);
    }
  }

  public toggleEmailDetails(details: HTMLDetailsElement, event: { checked: boolean }): void {
    details.open = event.checked;
    this.emailEnabled = event.checked;
    if (this.emailEnabled) {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      this.firstName.setValidators(Validators.required);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      this.emailCtrl.setValidators([Validators.required, Validators.email]);
    } else {
      this.firstName.clearValidators();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      this.emailCtrl.setValidators([Validators.email]);
    }
    this.firstName.updateValueAndValidity();
    this.emailCtrl.updateValueAndValidity();
  }

  public isSubmitDisabled(termsChecked: boolean, privacyChecked: boolean): boolean {
    if (!termsChecked || !privacyChecked) {
      return true;
    }
    if (this.emailEnabled && !this.formGroup.valid) {
      return true;
    }
    return false;
  }

  public getErrorEmail(): string {
    return this.emailCtrl.hasError('required') ? this.defaultAlert :
      (this.emailCtrl.hasError('email') ? 'Not a valid e-mail address' : '');
  }

  /**
   * Submits the email form data to the EPOS website API.
   * Matches the original informationsDialog POST request.
   */
  public onSubmit(post: Record<string, string>): Promise<void> {
    this.errors = [];

    // if not live, post locally to allow browser inspection
    return this.http.post(this.EPOS_SITE_API_URL,
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        webform_id: this.SUBMIT_FORM_ID,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        first_name: `${post.firstName}` === 'null' ? null : `${post.firstName}`,
        email: `${post.email}`,
        consent: 1,
      }, {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'api-key': this.EPOS_SITE_API_REST_KEY
      }
    }).toPromise()
      .catch((err: HttpErrorResponse) => {
        if (err.status === 400) {
          if (err.error !== null) {

            /* eslint-disable */
            if (err.error.error.first_name !== undefined) {
              this.errors.push(`${err.error.error.first_name}`);
            }

            if (err.error.error.email !== undefined) {
              this.errors.push(`${err.error.error.email}`);
            }

            if (err.error.error.consent !== undefined) {
              this.errors.push(`${err.error.error.consent}`);
            }

            /* eslint-enable */
          }
        }
      })
      .then((res: Record<string, unknown>) => {
        this.feedback = res !== undefined ? res : null;
      });
  }

  /**
   * Combined submit: stores consent + optionally submits email, then reloads.
   */
  public submitAll(): void {
    // Store policies consent
    this.policiesService.setConsentsTimestamp(moment());
    this.policiesService.setCookieConsent(this.cookiePolicy);

    // Store info check
    this.informationsService.setInfoCheck(true);

    // If user filled in the email form, submit it
    const emailValue = this.emailCtrl.value as string | null;
    const nameValue = this.firstName.value as string | null;
    if (emailValue && nameValue && this.formGroup.valid) {
      void this.onSubmit(this.formGroup.value as Record<string, string>).then(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }

  private createForm(): void {
    this.formGroup = this.formBuilder.group({
      firstName: [null],
      // eslint-disable-next-line @typescript-eslint/unbound-method
      email: [null, [Validators.email]],
    });
  }
}
