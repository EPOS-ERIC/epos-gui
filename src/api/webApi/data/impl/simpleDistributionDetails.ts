import { Confirm } from '../../utility/preconditions';
import { DistributionType } from '../distributionType.enum';
import { DistributionDetails } from '../distributionDetails.interface';
import { TemporalRange } from '../temporalRange.interface';
import { SpatialRange } from '../spatialRange.interface';
import { DistributionSummary } from '../distributionSummary.interface';
import { DistributionFormat } from '../distributionFormat.interface';
import { ParameterDefinitions } from '../parameterDefinitions.interface';
import { DataProvider } from '../dataProvider.interface';
import { DistributionLevel } from '../distributionLevel.interface';
import { DistributionContactPoint } from '../distributionContactPoint.interface';
import { DistributionCategories } from '../distributionCategories.interface';

export class SimpleDistributionDetails implements DistributionDetails {
  public readonly isDownloadable: boolean;
  public readonly isMappable: boolean;
  public readonly isGraphable: boolean;
  public readonly isTabularable: boolean;
  public readonly isOnlyDownloadable: boolean;
  public readonly statusNumber: number;
  public readonly statusTimestamp: string;
  public readonly statusURL: string;
  public readonly metadataStatusVersion: null | Array<string>;
  public readonly metadataStatusInfo: null | Record<string, { changeDate: string; editorFullName: string }[]>;
  public readonly uid: string;
  public readonly serviceProvider: null | Record<string, {dataProviderLegalName: string; dataProviderUrl: string; instanceid: string; metaid: string; uid: string}>;

  private constructor( //
    private readonly summary: DistributionSummary, //
    private readonly documentation: string, //
    private readonly webServiceDescription: string, //
    private readonly webServiceProvider: DataProvider | null, //
    private readonly webServiceName: string,
    private readonly webServiceSpatialRange: null | SpatialRange,
    private readonly webServiceTemporalCoverage: null | TemporalRange,
    private readonly webServiceEndpoint: string,
    private readonly description: string, //
    private readonly license: string, //
    private readonly endpoint: string, //
    private readonly type: DistributionType | string, //
    private readonly dataProvider: Array<DataProvider>, //
    private readonly doi: Array<string>,
    private readonly internalID: Array<string>, //
    private readonly paramDefs: ParameterDefinitions, //
    private readonly temporalRange: TemporalRange, //
    private readonly spatialRange: SpatialRange,
    private readonly downloadURL: string,
    private readonly contactPoints: Array<string>,
    private readonly keywords: Array<string>,
    private readonly frequencyUpdate: string,
    private readonly qualityAssurance: string,
    private readonly level: Array<DistributionLevel>,
    private readonly domainCode: string,
    private readonly availableContactPoints: Array<DistributionContactPoint>,
    private readonly categories: DistributionCategories | null,
    private readonly page: Array<string>,
    uid: string,
    private readonly detailsType: string | null,

    private readonly codeRepository: string | null,
    private readonly programmingLanguage: Array<string>,
    private readonly mainEntityOfPage: string | null,
    private readonly softwareVersion: string | null,
    private readonly requirements: Array<string>,
    private readonly runtimePlatform: Array<string>,
    private readonly creator: Array<string>
  ) {
    this.uid = (uid);
    this.isMappable = this.summary.isMappable;
    this.isGraphable = this.summary.isGraphable;
    this.isDownloadable = this.summary.isDownloadable;
    this.isTabularable = this.summary.isTabularable;
    this.isOnlyDownloadable = this.getType() === DistributionType.DOWNLOADABLE_FILE ? true : false;
    this.statusNumber = this.summary.getStatus();
    this.statusTimestamp = this.summary.getStatusTimestamp();
    this.statusURL = this.summary.getStatusURL();
    this.metadataStatusVersion = this.summary.getVersioningStatus();
    this.metadataStatusInfo = this.summary.getVersioningInfo();
    this.serviceProvider = this.summary.getServiceProvider();
  }

  public static makeUnsafeNullsAbound(
    summary: null | DistributionSummary, //
    documentation: string, //
    webServiceDescription: string, //
    webServiceProvider: DataProvider | null, //
    webServiceName: string,
    webServiceSpatialRange: null | SpatialRange,
    webServiceTemporalCoverage: null | TemporalRange,
    webServiceEndpoint: string,
    description: string, //
    license: string, //
    endpoint: string, //
    type: DistributionType | string, //
    dataProvider: Array<DataProvider>, //
    doi: Array<string>, //
    internalID: Array<string>, //
    paramDefs: ParameterDefinitions, //
    temporalRange: null | TemporalRange, //
    spatialRange: null | SpatialRange,
    downloadURL: string,
    contactPoints: Array<string>,
    keywords: Array<string>,
    frequencyUpdate: string,
    qualityAssurance: string,
    level: Array<DistributionLevel>,
    domainCode: string,
    availableContactPoints: Array<DistributionContactPoint>,
    categories: DistributionCategories | null,
    page: Array<string>,
    uid: string,
    detailsType: string | null,

    codeRepository: string | null,
    programmingLanguage: Array<string>,
    mainEntityOfPage: string | null,
    softwareVersion: string | null,
    requirements: Array<string>,
    runtimePlatform: Array<string>,
    creator: Array<string>
  ): DistributionDetails {
    // objects
    Confirm.requiresValid(summary);
    Confirm.requiresValid(temporalRange);
    Confirm.requiresValid(spatialRange);
    return new SimpleDistributionDetails(
      summary!, //
      documentation, //
      webServiceDescription, //
      webServiceProvider, //
      webServiceName,
      webServiceSpatialRange,
      webServiceTemporalCoverage,
      webServiceEndpoint,
      description, //
      license, //
      endpoint, //
      type, //
      dataProvider, //
      doi,
      internalID, //
      paramDefs, //
      temporalRange!, //
      spatialRange!,
      downloadURL,
      contactPoints,
      keywords,
      frequencyUpdate,
      qualityAssurance,
      level,
      domainCode,
      availableContactPoints,
      categories,
      page,
      uid,
      detailsType,
      codeRepository,
      programmingLanguage,
      mainEntityOfPage,
      softwareVersion,
      requirements,
      runtimePlatform,
      creator
    );
  }

  public static makeStrict(
    summary: DistributionSummary, //
    documentation: string, //
    webServiceDescription: string, //
    webServiceProvider: DataProvider | null, //
    webServiceName: string,
    webServiceSpatialRange: SpatialRange,
    webServiceTemporalCoverage: TemporalRange,
    webServiceEndpoint: string,
    webServiceParameters: ParameterDefinitions,
    description: string, //
    license: string, //
    endpoint: string, //
    type: DistributionType | string, //
    dataProvider: Array<DataProvider>, //
    doi: Array<string>, //
    internalID: Array<string>, //
    paramDefs: ParameterDefinitions, //
    temporalRange: TemporalRange, //
    spatialRange: SpatialRange,
    downloadURL: string,
    contactPoints: Array<string>,
    keywords: Array<string>,
    frequencyUpdate: string,
    qualityAssurance: string,
    level: Array<DistributionLevel>,
    domainCode: string,
    availableContactPoints: Array<DistributionContactPoint>,
    categories: DistributionCategories,
    page: Array<string>,
    uid: string,
    detailsType: string | null,
  ): DistributionDetails {
    // objects
    Confirm.requiresValid(summary);
    Confirm.requiresValid(type);
    Confirm.requiresValid(internalID);
    Confirm.requiresValid(dataProvider);
    Confirm.requiresValid(paramDefs);
    Confirm.requiresValid(temporalRange);
    Confirm.requiresValid(spatialRange);
    Confirm.requiresValid(level);
    Confirm.requiresValid(availableContactPoints);

    // strings
    Confirm.requiresValidString(documentation, true);
    Confirm.requiresValidString(webServiceDescription, true);
    Confirm.requiresValidString(description, true);
    Confirm.requiresValidString(license, true);
    Confirm.requiresValidString(endpoint, true);
    Confirm.requiresValidString(qualityAssurance, true);
    Confirm.requiresValidString(domainCode, true);
    Confirm.requiresValidString(uid, true);

    return new SimpleDistributionDetails(
      summary, //
      documentation, //
      webServiceDescription, //
      webServiceProvider, //
      webServiceName,
      webServiceSpatialRange,
      webServiceTemporalCoverage,
      webServiceEndpoint,
      description, //
      license, //
      endpoint, //
      type, //
      dataProvider, //
      doi,
      internalID, //
      paramDefs, //
      temporalRange, //
      spatialRange,
      downloadURL,
      contactPoints,
      keywords,
      frequencyUpdate,
      qualityAssurance,
      level,
      domainCode,
      availableContactPoints,
      categories,
      page,
      uid,
      detailsType,
      null, // codeRepository
      [], // programmingLanguage
      null, // mainEntityOfPage
      null, // softwareVersion
      [],   // requirements
      [],   // runtimePlatform
      []    // creator
          );
  }


  // FROM SUMMARY
  getName(): string {
    return this.summary.getName();
  }
    getUid(): string {
  return this.uid;
}


  getIdentifier(): string {
    return this.summary.getIdentifier();
  }

  getFormats(): Array<DistributionFormat> {
    return this.summary.getFormats();
  }
  getMappableFormats(): Array<DistributionFormat> {
    return this.summary.getMappableFormats();
  }
  getGraphableFormats(): Array<DistributionFormat> {
    return this.summary.getGraphableFormats();
  }
  getDownloadableFormats(): Array<DistributionFormat> {
    return this.summary.getDownloadableFormats();
  }
  getTabularableFormats(): Array<DistributionFormat> {
    return this.summary.getTabularableFormats();
  }

  // ADDITIONAL
  getDataProvider(): Array<DataProvider> {
    return this.dataProvider;
  }

  getDocumentation(): string {
    return this.documentation;
  }

  getWebServiceDescription(): string {
    return this.webServiceDescription;
  }

  getWebServiceProvider(): DataProvider | null {
    return this.webServiceProvider;
  }
  getWebServiceName(): string {
    return this.webServiceName;
  }
  getWebServiceSpatialRange(): null | SpatialRange {
    return this.webServiceSpatialRange;
  }

  getWebServiceTemporalCoverage(): null | TemporalRange {
    return this.webServiceTemporalCoverage;
  }

  getWebServiceEndpoint(): string {
    return this.webServiceEndpoint;
  }
  getDescription(): string {
    return this.description;
  }
  getEndPoint(): string {
    return this.endpoint;
  }

  getLicense(): string {
    return this.license;
  }

  getType(): DistributionType | string {
    return this.type;
  }
  getTypeString(): string {
    return DistributionType[this.type as DistributionType];
  }

  getInternalID(): Array<string> {
    return this.internalID;
  }

  getParameters(): ParameterDefinitions {
    return this.paramDefs;
  }

  getTemporalRange(): TemporalRange {
    return this.temporalRange;
  }
  getSpatialRange(): SpatialRange {
    return this.spatialRange;
  }

  getDOI(): Array<string> {
    return this.doi;
  }

  getDownloadURL(): string {
    return this.downloadURL;
  }
  getContactPoints(): Array<string> {
    return this.contactPoints;
  }
  getKeywords(): Array<string> {
    return this.keywords;
  }
  getFrequencyUpdate(): string {
    return this.frequencyUpdate;
  }

  getStatus(): number {
    return this.statusNumber;
  }

  getStatusTimestamp(): string {
    return this.statusTimestamp;
  }
  getStatusURL(): string {
    return this.statusURL;
  }

  getQualityAssurance(): string {
    return this.qualityAssurance;
  }

  getLevel(): DistributionLevel[] {
    return this.level;
  }

  /**
   * This function returns the code of the first child category within the "categories" property, if it
   * exists.
   * @returns The function `getDomainCode()` is returning the code of the first child category under
   * the `categories` property, if it exists. If the `categories` property or the first child category
   * does not exist, it will return `undefined`.
   */
  getDomainCode(): string | undefined {
    if (this.domainCode === '') {
      return this.categories?.children[0].code;
    } else {
      return this.domainCode;
    }
  }

  /**
   * The function `getDomain` returns the name of the first child category, or undefined if there are no
   * children.
   * @returns a string value or undefined.
   */
  getDomain(): string | undefined {
    return this.categories?.children[0].name;
  }

  /**
   * The function "getCategories" returns the distribution categories or null.
   * @returns The method is returning a variable called "categories" of type "DistributionCategories" or
   * null.
   */
  getCategories(): DistributionCategories | null {
    return this.categories;
  }

  /**
   * The function "getAvailableContactPoints" returns an array of DistributionContactPoint objects.
   * @returns An array of DistributionContactPoint objects.
   */
  getAvailableContactPoints(): Array<DistributionContactPoint> {
    return this.availableContactPoints;
  }

  getPage(): Array<string> {
    return this.page;
  }
  // metadata versioning (published, archived...)
  getVersioningStatus(): null | Array<string> {
    return this.metadataStatusVersion;
  }
  // metadata versioning Info (author, last edit...)
  getVersioningInfo(): null | Record<string, { changeDate: string; editorFullName: string }[]> {
    return this.metadataStatusInfo;
  }
  // service provider
  getServiceProvider(): null | Record<string, {dataProviderLegalName: string; dataProviderUrl: string; instanceid: string; metaid: string; uid: string}> {
    return this.serviceProvider;
  }

  getDetailsType(): string | null {
    return this.detailsType;
  }

  getCodeRepository(): string | null {
    return this.codeRepository;
  }

  getProgrammingLanguage(): Array<string> {
    return this.programmingLanguage;
  }

  getMainEntityofPage(): string | null {
    return this.mainEntityOfPage;
  }

  getSoftwareVersion(): string | null {
    return this.softwareVersion;
  }

  getRequirements(): Array<string> {
    return this.requirements;
  }

  getRuntimePlatform(): Array<string> {
    return this.runtimePlatform;
  }

  getCreator(): Array<string> {
    return this.creator;
  }
}
