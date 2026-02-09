export interface DistributionCategories {
  name: string;
  code: string;
  children: Array<DistributionCategories>;
}
