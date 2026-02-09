import { Country } from 'assets/data/countries';
import { ModelItem } from './modelItem';

/** The class CountryMI is a model item that represents a country and can be persisted and used in
configurable objects. */
export class CountryMI extends ModelItem<null | Country> {

  /**
   * The constructor initializes the object with persistable and persistableOnConfigurables properties
   * set to true.
   */
  constructor(
  ) {

    super(null);
    this.persistable = true;
    this.persistableOnConfigurables = true;
  }
}
