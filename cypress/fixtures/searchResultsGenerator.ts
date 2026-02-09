
export class SearchResultsGenerator {

  constructor(
    protected domainCount = 10,
    protected filterChildCount = 10,
    protected subDomainCount = domainCount,
    protected distributionCount = domainCount,
  ) { }

  protected generateFilter(label: string, childCount = this.filterChildCount): {} {
    const countStringLength = (childCount - 1).toString().length;
    const children = new Array<Record<string, unknown>>();
    for (let i = 0; i < childCount; i++) {
      const countString = i.toString().padStart(countStringLength, '0');
      const child = {
        name: label + ' ' + countString,
        id: label.toLowerCase() + '_' + countString,
      };
      children.push(child);
    }
    return {
      name: label,
      children: children,
    };
  }

  protected generateDistributions(domainRef: string, subDomainRef: string, count = this.distributionCount): Array<{}> {
    const countStringLength = (count - 1).toString().length;
    const returnArray = new Array<Record<string, unknown>>();
    for (let i = 0; i < count; i++) {
      const countString = i.toString().padStart(countStringLength, '0');
      const item = {
        id: `dist_${domainRef}_${subDomainRef}_${countString}`,
        title: 'Distribution ' + countString,
        availableFormats: [{ 'label': 'GEOJSON', 'format': 'application/epos.geo+json', 'href': '', 'type': 'converted' }],
        converted: false,
      };
      returnArray.push(item);
    }
    return returnArray;
  }

  protected generateSubDomains(domainRef: string, count = this.subDomainCount): Array<{}> {
    const countStringLength = (count - 1).toString().length;
    const returnArray = new Array<Record<string, unknown>>();
    for (let i = 0; i < count; i++) {
      const countString = i.toString().padStart(countStringLength, '0');
      const item = {
        name: `Sub-domain ${domainRef}_${countString}`,
        distributions: this.generateDistributions(domainRef, countString),
      };
      returnArray.push(item);
    }
    return returnArray;
  }

  protected generateDomains(count = this.domainCount): Array<{}> {
    const countStringLength = (count - 1).toString().length;
    const returnArray = new Array<Record<string, unknown>>();
    for (let i = 0; i < count; i++) {
      const countString = i.toString().padStart(countStringLength, '0');
      const item = {
        name: `Domain ${countString}`,
        children: this.generateSubDomains(countString),
      };
      returnArray.push(item);
    }
    return returnArray;
  }

  public create(): {} {
    return {
      filters: [
        this.generateFilter('keywords'),
        this.generateFilter('organisations'),
      ],
      results: {
        name: 'domains',
        children: this.generateDomains(),
      },
    };
  }
}
