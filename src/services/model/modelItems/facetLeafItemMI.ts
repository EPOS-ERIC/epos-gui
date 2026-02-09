import { ModelItem } from './modelItem';

export class FacetLeafItemMI extends ModelItem<null | Array<string>> {

  constructor(
  ) {

    super(null);
    this.persistable = true;
    this.persistableOnConfigurables = true;
  }
}
