import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from 'environments/environment';
import { DialogData } from '../baseDialogService.abstract';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmationDataIn } from '../confirmationDialog/confirmationDialog.component';
import { InformationsService } from 'services/informationsService.service';
import { BehaviorSubject } from 'rxjs';
import { TourService } from 'services/tour.service';

@Component({
  selector: 'app-informations-dialog',
  templateUrl: './informationsDialog.component.html',
  styleUrls: ['./informationsDialog.component.scss']
})
export class InformationsDialogComponent implements OnInit, OnDestroy {
  public readonly defaultAlert = 'This field is required';

  public show: 'loader' | 'form' | 'error' = 'loader';

  public noShowAgain = false;

  public formGroup: UntypedFormGroup;
  public feedback: null | Record<string, unknown> = null;
  public errors: Array<string> = [];
  public tourActive = new BehaviorSubject<string>('');

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
    @Inject(MAT_DIALOG_DATA) public data: DialogData<ConfirmationDataIn, boolean>,
    private readonly formBuilder: UntypedFormBuilder,
    private readonly http: HttpClient,
    private readonly informationsService: InformationsService,
    private readonly tourService: TourService,
  ) { }

  /**
   * FormControl of the firstName field.
   * @return {FormControl}
   */
  get firstName(): UntypedFormControl {
    return this.formGroup.get('firstName') as UntypedFormControl;
  }

  /**
   * FormControl of the email field.
   * @return {FormControl}
   */
  get email(): UntypedFormControl {
    return this.formGroup.get('email') as UntypedFormControl;
  }

  /**
   * FormControl of the consent field.
   * @return {FormControl}
   */
  get consent(): UntypedFormControl {
    return this.formGroup.get('consent') as UntypedFormControl;
  }

  public ngOnInit(): void {
    this.createForm();
    this.show = 'form';
    this.checkIfTourEnabled();
  }

  public ngOnDestroy(): void {
    if (this.noShowAgain) {
      this.informationsService.setInfoCheck(true);
    }
  }

  /**
   * Returns an error for the email field or an empty string if it is valid.
   */
  public getErrorEmail(): string {
    return this.email.hasError('required') ? this.defaultAlert :
      (this.email.hasError('email') ? 'Not a valid e-mail address' : '');
  }

  /**
   * Submits the data to the Epos Website project.
   * @param post {object} Data object to be submitted.
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
        consent: `${post.consent}` === 'true' ? 1 : null,
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

        if (this.feedback) {
          setTimeout(() => {
            this.confirm();
          }, 3000);
        }
      });
  }

  public confirm(): void {
    this.data.dataOut = true;

    if (this.noShowAgain) {
      this.informationsService.setInfoCheck(true);
    }

    this.data.close();
  }

  public handleTourStart(event: Event): void {
    this.tourService.startEposFiltersTour(event);
    // void this.dialogService.openTourDialog('manual');
  }

  private createForm() {
    this.formGroup = this.formBuilder.group({
      // eslint-disable-next-line @typescript-eslint/unbound-method
      firstName: [null, Validators.required],
      // eslint-disable-next-line @typescript-eslint/unbound-method
      email: [null, [Validators.required, Validators.email]],
      // eslint-disable-next-line @typescript-eslint/unbound-method
      consent: [false, Validators.required]
    });
    // this.formGroup.reset();
  }

  private checkIfTourEnabled(): void {
    if (this.informationsService.tourIsActive === 'true') {
      this.tourActive.next('true');
    } else if (this.informationsService.tourIsActive === 'false') {
      this.tourActive.next('false');
    }
  }
}
