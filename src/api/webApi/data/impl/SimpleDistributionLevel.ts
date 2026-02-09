import { DistributionLevel } from '../distributionLevel.interface';

export class SimpleDistributionLevel implements DistributionLevel {

  constructor(
    public readonly id: number,
    public readonly value: string,
    // public readonly children: Array<DistributionLevel>,
    // public readonly count: number,
    // public readonly level: number,
  ) {
  }
}


