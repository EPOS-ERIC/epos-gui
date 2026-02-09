import { DistributionSummary } from './distributionSummary.interface';
import { DistributionType } from './distributionType.enum';
import { TemporalRange } from './temporalRange.interface';
import { SpatialRange } from './spatialRange.interface';
import { ParameterDefinitions } from './parameterDefinitions.interface';
import { DataProvider } from './dataProvider.interface';
import { DistributionLevel } from './distributionLevel.interface';
import { DistributionContactPoint } from './distributionContactPoint.interface';
import { DistributionCategories } from './distributionCategories.interface';


export interface DistributionDetails extends DistributionSummary {
  // id, name, usable,  getAvailableFormats

  getEndPoint(): string;

  getType(): DistributionType | string;
  getTypeString(): string;
  getTemporalRange(): TemporalRange;
  getSpatialRange(): SpatialRange;
  getLicense(): string;
  getDescription(): string;
  getWebServiceDescription(): string;
  getWebServiceProvider(): DataProvider | null;
  getWebServiceName(): string;
  getWebServiceSpatialRange(): null | SpatialRange;
  getWebServiceTemporalCoverage(): null | TemporalRange;
  getWebServiceEndpoint(): string;
  getDocumentation(): string;
  getDataProvider(): Array<DataProvider>;
  getInternalID(): Array<string>;
  getParameters(): ParameterDefinitions;
  getDOI(): Array<string>;
  getDownloadURL(): string;
  getContactPoints(): Array<string>;
  getKeywords(): Array<string>;
  getFrequencyUpdate(): string;
  getQualityAssurance(): string;
  getLevel(): Array<DistributionLevel>;
  getDomainCode(): string | undefined;
  getDomain(): string | undefined;
  getCategories(): DistributionCategories | null;
  getAvailableContactPoints(): Array<DistributionContactPoint>;
  getPage(): Array<string>;
  // for search calls in MetadataPreview mode
  getVersioningStatus(): null | Array<string>;
  getUid(): string;
  // for MetadataPreview mode informations on author of the version, last update etc.
  getVersioningInfo(): null | Record<string, { changeDate: string; editorFullName: string }[]>;
  getDetailsType(): string | null;
  getDetailsType(): string | null;
  getCodeRepository(): string | null;
  getProgrammingLanguage(): Array<string>;
  getMainEntityofPage(): string | null;
  getSoftwareVersion(): string | null;
  getRequirements(): Array<string>;
  getRuntimePlatform(): Array<string>;
  getCreator(): Array<string>;
}
