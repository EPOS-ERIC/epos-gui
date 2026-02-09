import { DistributionItem } from '../distributionItem.interface';
import { DistributionLevel } from '../distributionLevel.interface';
import { DistributionSummary } from '../distributionSummary.interface';

export class SimpleDistributionItem implements DistributionItem {

  constructor(
    public readonly id: string,
    public readonly distId: string,
    public readonly name: string,
    public readonly code: string | null,
    public readonly icon: string | null,
    public readonly color: string | null,
    public readonly lcolor: string | null,
    public readonly visibility: string[],
    public readonly isDownloadable: boolean,
    public readonly distSummary: DistributionSummary,
    public readonly isPinned: boolean,
    public readonly hideToResult: boolean,
    public readonly levels: Array<Array<DistributionLevel>>,
    public readonly status: number | null,
    public readonly statusTimestamp: string | null,
    public readonly statusURL: string | null,
    public readonly versioningStatus?: null | Array<string>,
    public readonly versioningStatusInfo?: null | Record<string, { changeDate: string; editorFullName: string }[]>,
    public readonly serviceProvider?: null | Record<string, {dataProviderLegalName: string; dataProviderUrl: string; instanceid: string; metaid: string; uid: string}>
  ) {
  }

  public static make(
    id: string,
    distId: string,
    name: string,
    code: string | null,
    icon: string | null,
    color: string | null,
    lcolor: string | null,
    visibility: string[],
    isDownloadable: boolean,
    distSummary: DistributionSummary,
    isPinned: boolean,
    hideToResult: boolean,
    levels: Array<Array<DistributionLevel>>,
    status: number | null,
    statusTimestamp: string | null,
    statusURL: string | null,
    versioningStatus: null | Array<string>,
    versioningStatusInfo: null | Record<string, { changeDate: string; editorFullName: string }[]>,
    serviceProvider: null | Record<string, {dataProviderLegalName: string; dataProviderUrl: string; instanceid: string; metaid: string; uid: string}>
  ): DistributionItem {

    return new SimpleDistributionItem(id,
      distId,
      name,
      code,
      icon,
      color,
      lcolor,
      visibility,
      isDownloadable,
      distSummary,
      isPinned,
      hideToResult,
      levels,
      status,
      statusTimestamp,
      statusURL,
      versioningStatus,
      versioningStatusInfo,
      serviceProvider);
  }

}
