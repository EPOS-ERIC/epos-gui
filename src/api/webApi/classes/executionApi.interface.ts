import { DistributionSummary } from '../data/distributionSummary.interface';
import { DistributionFormat } from '../data/distributionFormat.interface';
import { ParameterValue } from '../data/parameterValue.interface';

export interface ExecutionApi {

  executeAuthenticatedUrl(
    url: string,
  ): Promise<Blob>;

  executeUrl(
    url: string,
  ): Promise<Blob>;

  executeDistributionFormat(
    format: DistributionFormat,
    params: null | Array<ParameterValue>,
    asBlob: boolean,
  ): Promise<Record<string, unknown> | Blob>;

  getExecuteUrl(
    format: DistributionFormat,
    params: null | Array<ParameterValue>,
  ): string;


  /**
   * Not for execution, just for reference to the originator (TCS)
   */
  getOriginatorUrl(
    distribution: DistributionSummary,
    params: null | Array<ParameterValue>
  ): Promise<string>;
}
