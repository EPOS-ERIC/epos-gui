export interface DistributionLevel {
  id: number;
  value: string;
  children?: Array<DistributionLevel>;
  count?: number;
  level?: number;
  distId?: string;
  parentName?: string;
}
