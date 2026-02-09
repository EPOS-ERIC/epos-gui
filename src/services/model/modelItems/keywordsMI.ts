import { ModelItem } from './modelItem';

export class KeywordsMI extends ModelItem<Array<string>> {
  constructor(
  ) {
    const defaultValue: Array<string> = [];
    super(defaultValue);

    this.persistable = true;
    this.persistableOnConfigurables = true;
  }
}
