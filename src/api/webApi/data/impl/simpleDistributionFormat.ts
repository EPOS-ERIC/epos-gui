import { DistributionFormat } from '../distributionFormat.interface';
import { Confirm } from 'api/webApi/utility/preconditions';
import { DistributionFormatType } from '../distributionFormatType';

export class SimpleDistributionFormat implements DistributionFormat {
  public readonly isDownloadable: boolean;
  public readonly isMappable: boolean;
  public readonly isGraphable: boolean;
  public readonly isTabularable: boolean;
  public readonly isOnlyDownloadable: boolean;

  protected constructor( //
    protected readonly label: string, //
    protected readonly format: string, //
    protected readonly originalFormat: string, //
    protected readonly url: string, //
    protected readonly type: string
  ) {
    this.isDownloadable = DistributionFormatType.isDownloadable(this.format);
    this.isMappable = DistributionFormatType.isMappable(this.format);
    this.isGraphable = DistributionFormatType.isGraphable(this.format);
    this.isTabularable = DistributionFormatType.isTabularable(this.format);
    this.isOnlyDownloadable = false;
  }

  public static make(
    label: string,
    format: string,
    originalFormat: string,
    url: string,
    type: string
  ): DistributionFormat {
    Confirm.requiresValidString(label);
    Confirm.requiresValidString(format);
    Confirm.requiresValidString(originalFormat);
    Confirm.requiresValidString(type);
    Confirm.requiresValidString(url);
    return new SimpleDistributionFormat(label, format, originalFormat, url, type);
  }

  getUrl(): string {
    return this.url;
  }
  getLabel(): string {
    return this.label;
  }
  getFormat(): string {
    return this.format;
  }
  getOriginalFormat(): string {
    return this.originalFormat;
  }
  getType(): string {
    return this.type;
  }
}
