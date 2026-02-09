import { ModelItem } from './modelItem';
import { Injector } from '@angular/core';
import { DataConfigurableDataSearch } from 'utility/configurablesDataSearch/dataConfigurableDataSearch';
import { DataConfigurableDataSearchI } from 'utility/configurablesDataSearch/dataConfigurableDataSearchI.interface';


/** The `DataSearchConfigurablesMI` class is a model item that represents an array of
`{@link DataConfigurableDataSearchI}` objects and provides functions for persisting and retrieving data. */
export class DataSearchConfigurablesMI extends ModelItem<Array<DataConfigurableDataSearchI>> {

  /**
   * The constructor initializes a class instance and sets up functions for persisting and retrieving
   * data.
   */
  constructor(
  ) {
    super([]);
    this.setPersistFunctions(
      (modelItem: ModelItem<Array<DataConfigurableDataSearchI>>) => {
        const toPersist = modelItem.get()
          .filter(configurable => configurable instanceof DataConfigurableDataSearch)
          .map((configurable: DataConfigurableDataSearch) => {
            return configurable.toSimpleObject();
          });
        return JSON.stringify(toPersist);
      },
      (modelItem: ModelItem<Array<DataConfigurableDataSearchI>>, value: string) => {
        const injector = this.getService('Injector') as Injector;
        const objectsArray = JSON.parse(value) as Array<Record<string, unknown>>;
        return Promise.all(
          objectsArray.map((obj: Record<string, unknown>) => DataConfigurableDataSearch.makeFromSimpleObject(obj, injector, modelItem.getContext()))
        ).then((objs: Array<null | DataConfigurableDataSearch>) => {
          // filter out nulls from unsuccessfully cached objects
          return objs.filter((obj) => (obj != null)) as Array<DataConfigurableDataSearchI>;
        });
      }
    );
  }

}
