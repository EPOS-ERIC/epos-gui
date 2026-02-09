import { Injectable } from '@angular/core';
import { ApiService } from 'api/api.service';
import { DistributionFormat } from 'api/webApi/data/distributionFormat.interface';
import { ParameterValue } from 'api/webApi/data/parameterValue.interface';
import { LoggingService } from './logging.service';
import { ParameterDefinitions } from 'api/webApi/data/parameterDefinitions.interface';
import { DistributionSummary } from 'api/webApi/data/distributionSummary.interface';
import { DistributionDetails } from 'api/webApi/data/distributionDetails.interface';
import { NotificationService } from './notification.service';
import * as Mime from 'mime';
import { DistributionFormatType } from 'api/webApi/data/distributionFormatType';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import * as HttpStatus from 'http-status-codes';

/**
 * A service that exposes methods for accessing the webAPI execution functionality
 * to the rest of the GUI.
 */
@Injectable()
export class ExecutionService {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  private eposMime = DistributionFormatType.getEposMime();

  constructor(
    private readonly apiService: ApiService,
    private readonly loggingService: LoggingService,
    private readonly notificationService: NotificationService,
  ) {
  }

  /**
   * Triggers callout from the [ApiService]{@link ApiService#executeAuthenticatedUrl} and uses the
   * [openDownload]{@link #openDownload} function to display the response.
   * @param url resource url
   */
  public doAuthenticatedDownload(
    url: string,
    fileName?: null | string
  ): Promise<void> {
    return this.apiService.executeAuthenticatedUrl(
      url,
    )
      .then((blob: Blob) => {
        return this.openDownload(blob, fileName);
      })
      .catch(error => {
        this.notifyError(error, '', '', 'An error occured whilst accessing a download where authentication is required.');
      });
  }

  public doDownload(
    url: string,
    fileName?: null | string
  ): Promise<void> {
    return this.apiService.executeUrl(
      url
    )
      .then((blob: Blob) => {
        return this.openDownload(blob, fileName);
      })
      .catch(error => {
        this.notifyError(error, '', '', 'An error occured whilst accessing a download.');
      });
  }

  /**
   * Triggers the execute callout from the {@link ApiService} and returns the response.
   *
   * {@link ParameterValue}
   *
   * @param format Represents the response type relating to the item
   * that should be executed.
   * @param paramDefinitions Represents the parameters of the item.
   * (Required if overriding default values).
   * @param params Array of {ParameterValue}s.  (Required if overriding default values).
   *
   * @returns The value from the response from the callout url.
   */
  public executeDistributionFormat(
    distSummary: DistributionSummary,
    format: DistributionFormat,
    paramDefinitions?: ParameterDefinitions,
    params: null | Array<ParameterValue> = null,
  ): Promise<Record<string, unknown> | Blob> {

    return this._executeDistributionFormat(format, paramDefinitions, params)
      .catch(error => {
        this.notifyError(error, distSummary.getIdentifier(), distSummary.getName(), 'An error occured whilst executing a distribution.');
        throw (error);
      });
  }

  /**
   * Uses the {@link ApiService} and returns the execute url.
   *
   * {@link ParameterValue}
   *
   * @param format Represents the response type relating to the item
   * that should be executed.
   * @param paramDefinitions Represents the parameters of the item.
   * (Required if overriding default values).
   * @param params Array of {ParameterValue}s.  (Required if overriding default values).
   *
   * @returns The callout url.
   */
  public getExecuteUrl(
    format: DistributionFormat,
    paramDefinitions: null | ParameterDefinitions = null,
    params: null | Array<ParameterValue> = null,
  ): string {
    return this.apiService.getExecuteUrl(
      format,
      params,
    );
  }


  /**
   * Method that calls the [getExecuteUrl]{@link #getExecuteUrl} function then opens a new window at that
   * location.
   *
   * {@link ParameterValue}
   *
   * @param distDetails Details object defining the source of the data.
   * @param format Represents the response type relating to the item
   * that should be executed.
   * @param params Array of {ParameterValue}s.  (Required if overriding default values).
   * @param [multipleDownload=false] - boolean
   */
  public downloadDistributionFormat(
    distDetails: DistributionDetails,
    format: DistributionFormat,
    params?: Array<ParameterValue>,
    multipleDownload = false
  ): void {
    // Allow auth for a limited number of services
    const authRequired = (
      // Anthropogenic Hazard Observations -> Episodes => *
      (distDetails.getIdentifier().startsWith('anthropogenic_hazards/distribution/episode-elements/'))
      // Geoelectromagnetism -> Geomagnetic models and data
      // -> INTERMAGNET Geomagnetic Observatory Data
      || (distDetails.getIdentifier() === 'https://www.epos-eu.org/epos-dcat-ap/GeoElectroMagnetism/WP13-DDSS-001/INTERMAGNET/Distribution')
      // is epos geojson and served by the API
      || (DistributionFormatType.is(format.getFormat(), DistributionFormatType.APP_EPOS_GEOJSON))
      || (DistributionFormatType.is(format.getFormat(), DistributionFormatType.APP_EPOS_TABLE_GEOJSON))
    );
    this.loggingService.info(`Downloading (${format.getLabel()}) - ${distDetails.getName()}`, true);

    if (authRequired || multipleDownload) {
      this._executeDistributionFormat(format, distDetails.getParameters(), params, true)
        .then((blob: Blob) => {

          let filename = 'raw_service_response_' + distDetails.getName();

          // check service only downloadable
          if (distDetails.isOnlyDownloadable) {
            const url = distDetails.getDownloadURL();
            filename = url.substring(url.lastIndexOf('/') + 1);
          }

          this.openDownload(blob, filename, format.getFormat());
        })
        .catch(error => {
          // eslint-disable-next-line max-len
          this.notifyError(error, distDetails.getIdentifier(), distDetails.getName(), 'An error occured whilst downloading a distribution format.');
        });
    } else {
      const url = this.getExecuteUrl(format, distDetails.getParameters(), params);
      window.open(url);
    }

  }


  /**
   * TODO: What is the originator url for?
   *
   * @param distributionSummary Summary object defining the source of the data.
   * @param paramDefinitions Represents the parameters of the item.
   * (Required if overriding default values).
   * @param params Array of {ParameterValue}s.  (Required if overriding default values).
   */
  public getOriginatorUrl(
    distributionSummary: DistributionSummary,
    paramDefinitions?: ParameterDefinitions,
    params: null | Array<ParameterValue> = null,
  ): Promise<null | string> {
    return this.apiService.getOriginatorUrl(distributionSummary, params);
  }

  /**
   * It creates an anchor element, sets the href to the blob, sets the download attribute to the
   * filename, clicks the anchor, and then removes the anchor
   * @param {Blob} blob - The blob to download.
   * @param {null | string} [filename] - The name of the file to be downloaded. If null or empty, the
   * file will be downloaded with the name "download".
   */
  public openDownload(
    blob: Blob,
    filename?: null | string,
    format?: string | undefined,
  ): void {
    const anchor = document.createElement('a');
    document.body.appendChild(anchor);
    const windowUrl = window.URL;
    const thisUrl = windowUrl.createObjectURL(blob);
    anchor.href = thisUrl;

    filename = (null == filename) ? '' : filename.trim();
    // default filename
    if ('' === filename) {
      filename = 'download';
    }

    let extension: string | null = null;
    if (format !== undefined) {
      // try to get extension from format payload
      extension = Mime.getExtension(format);
    }

    // if file extension doesn't exist try to determine one from mime type
    if (filename.indexOf('.') === -1 && extension === '') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      extension = this.eposMime.getExtension(blob.type) || Mime.getExtension(blob.type);
    }

    if (null !== extension) {
      filename = `${filename}.${extension}`;
    }

    anchor.download = filename;
    anchor.click();
    windowUrl.revokeObjectURL(thisUrl);
    anchor.parentElement!.removeChild(anchor);
  }

  /**
   * Triggers the execute callout from the {@link ApiService} and returns the response.
   *
   * {@link ParameterValue}
   *
   * @param format Represents the response type relating to the item
   * that should be executed.
   * @param paramDefinitions Represents the parameters of the item.
   * (Required if overriding default values).
   * @param params Array of {ParameterValue}s.  (Required if overriding default values).
   * @param forDownload boolean to select Blob return value rather than json object.
   *
   * @returns The response from the callout url.
   */
  private _executeDistributionFormat(
    format: DistributionFormat,
    paramDefinitions?: ParameterDefinitions,
    params: null | Array<ParameterValue> = null,
    forDownload = false,
  ): Promise<Record<string, unknown> | Blob> {
    return this.apiService.executeDistributionFormat(
      format,
      params,
      forDownload,
    );
  }

  private notifyError(
    error: unknown,
    serviceId: string,
    serviceName: string,
    nonAuthErrorMessage: string,
  ): void {
    // TODO: show a better, nicer looking, generic authentication failed dialog??
    if ((error instanceof HttpResponse) && (error.status as HttpStatus.StatusCodes === HttpStatus.StatusCodes.UNAUTHORIZED)) {
      const message = `The "${serviceName}" service requires the user to be authenticated, please login.`;
      this.notificationService.sendNotification(message, 'x', NotificationService.TYPE_WARNING, 10000);
    }

    if (error instanceof HttpErrorResponse) {
      // eslint-disable-next-line max-len
      const message = `Problems on request for "${serviceName}" service.<br /><strong>Error message from web server:</strong> "${error.message}"`;
      this.notificationService.sendDistributionNotification({
        id: serviceId,
        title: 'Service Error',
        message: message,
        type: NotificationService.TYPE_ERROR,
        showAgain: false
      });
    } else {
      this.notificationService.sendNotification(nonAuthErrorMessage, 'x', NotificationService.TYPE_ERROR, 10000);
    }
  }

}
