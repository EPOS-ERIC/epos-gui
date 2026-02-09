import { DistributionSummary } from '../distributionSummary.interface';
import { Confirm } from '../../utility/preconditions';
import { DistributionFormat } from '../distributionFormat.interface';

export class SimpleDistributionSummary implements DistributionSummary {
  public readonly isDownloadable: boolean;
  public readonly isMappable: boolean;
  public readonly isGraphable: boolean;
  public readonly isTabularable: boolean;
  public readonly isOnlyDownloadable: boolean;
  public readonly statusTimestampString: string;
  public readonly statusURLString: string;
  public readonly metadataVersioningStatus: null | Array<string>;
  public readonly metadataVersioningInfo: null | Record<string, { changeDate: string; editorFullName: string }[]> = {};
  public readonly serviceProviderInfo: null | Record<string, {dataProviderLegalName: string; dataProviderUrl: string; instanceid: string; metaid: string; uid: string}> = {};
  public readonly uid: string;


  protected constructor(
    protected readonly identifier: string, //
    protected readonly name: string, //
    protected readonly formats: Array<DistributionFormat>,
    protected readonly status: number,
    protected readonly statusTimestamp: string,
    protected readonly statusURL: string,
    protected readonly versioningStatus: null | Array<string>,
    protected readonly versioningStatusInfo: null | Record<string, { changeDate: string; editorFullName: string }[]> = {},
    protected readonly serviceProvider: null | Record<string, {dataProviderLegalName: string; dataProviderUrl: string; instanceid: string; metaid: string; uid: string}>  = {},
    uid: string
  ) {
    this.uid = uid;
    this.isMappable = (this.getMappableFormats().length > 0);
    this.isGraphable = (this.getGraphableFormats().length > 0);
    this.isDownloadable = (this.getDownloadableFormats().length > 0);
    this.isTabularable = (this.getTabularableFormats().length > 0);
    this.isOnlyDownloadable = false;
    this.statusTimestampString = statusTimestamp;
    this.statusURLString = statusURL;
    this.metadataVersioningStatus = versioningStatus;
    this.metadataVersioningInfo = versioningStatusInfo;
    this.serviceProvider = serviceProvider;
  }

  public static make(
    identifier: string,
    name: string,
    formats: Array<DistributionFormat>,
    status: number,
    statusTimestamp: string,
    statusURL: string,
    versioningStatus,
    versioningStatusInfo,
    serviceProvider,
    uid: string
  ): DistributionSummary {
    Confirm.requiresValidString(identifier);
    Confirm.requiresValidString(name);
    Confirm.requiresValid(formats);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return new SimpleDistributionSummary(identifier, name, formats, status, statusTimestamp,statusURL, versioningStatus, versioningStatusInfo,serviceProvider,uid);
  }


  getName(): string {
    return this.name;
  }

  getIdentifier(): string {
    return this.identifier;
  }

  getFormats(): Array<DistributionFormat> {
    return this.formats;
  }

  getMappableFormats(): Array<DistributionFormat> {
    return this.formats.filter((format: DistributionFormat) => format.isMappable);
  }
  getGraphableFormats(): Array<DistributionFormat> {
    return this.formats.filter((format: DistributionFormat) => format.isGraphable);
  }

  getDownloadableFormats(): Array<DistributionFormat> {
    return this.formats.filter((format: DistributionFormat) => format.isDownloadable);
  }

  getTabularableFormats(): Array<DistributionFormat> {
    return this.formats.filter((format: DistributionFormat) => format.isTabularable);
  }

  getStatus(): number {
    return this.status;
  }

  getStatusTimestamp(): string {
    return this.statusTimestamp;
  }
  getStatusURL(): string {
    return this.statusURL;
  }
 // for Metadata Preview mode
  getVersioningStatus(): null | Array<string> {
    return this.versioningStatus;
  }
  // for metadata preview mode informations like author, last edit etc.
  getVersioningInfo(): null | Record<string, { changeDate: string; editorFullName: string }[]> {
    return this.versioningStatusInfo;
  }
  getUid(): string {
  return this.uid;
}


  // service provider
  getServiceProvider(): null | Record<string, {dataProviderLegalName: string; dataProviderUrl: string; instanceid: string; metaid: string; uid: string}> {
    return this.serviceProvider;
  }

}
