import { DistributionSummary } from '../data/distributionSummary.interface';
import { DistributionDetails } from '../data/distributionDetails.interface';

/**
 * API for accessing the detail information of an item in the catalogue.
 */
export interface DetailsApi {
  /**
   * Get details.
   */
  getDetails(summary: DistributionSummary, context: string): Promise<null | DistributionDetails>;

  getDetailsById(id: string, context: string): Promise<null | DistributionDetails>;
}
