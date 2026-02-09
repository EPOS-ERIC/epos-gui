import { Usable } from './usable';
import { DistributionFormat } from './distributionFormat.interface';
import { DistributionIdentifiable } from './distributionIdentifiable.interface';

/**
 * A (DDSS) distrubution, with default format return when default URL queried.
 */
export interface DistributionSummary extends DistributionIdentifiable, Usable {
  getFormats(): Array<DistributionFormat>;
  getMappableFormats(): Array<DistributionFormat>;
  getGraphableFormats(): Array<DistributionFormat>;
  getDownloadableFormats(): Array<DistributionFormat>;
  getTabularableFormats(): Array<DistributionFormat>;
  getStatus(): number;
  getStatusTimestamp(): string;
  getStatusURL(): string;
  // for search calls in MetadataPreview mode
  getVersioningStatus(): null | Array<string>;
  // for MetadataPreview mode informations like author, last edit etc.
  getVersioningInfo(): null | Record<string, { changeDate: string; editorFullName: string }[]>;
  // service provider
  getServiceProvider(): null | Record<string, {dataProviderLegalName: string; dataProviderUrl: string; instanceid: string; metaid: string; uid: string}>;
}
