import { DistributionLevel } from './distributionLevel.interface';
import { DistributionSummary } from './distributionSummary.interface';

export interface DistributionItem {
  id: string;
  distId: string;
  name: string;
  code: string | null;
  icon: string | null;
  color: string | null;
  lcolor: string | null;
  visibility: string[];
  isDownloadable: boolean;
  distSummary: DistributionSummary;
  isPinned: boolean;
  hideToResult: boolean;
  levels: Array<Array<DistributionLevel>>;
  status: number | null;
  statusTimestamp: string | null;
  statusURL: string | null;
}
