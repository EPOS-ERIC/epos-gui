import { ModelItem } from './modelItems/modelItem';
import { Persister } from './persisters/persister';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Handles the initialisation of the {@link Model} and makes that class simpler by having all
 * of the workings in here.
 */
export abstract class ModelBase {
  /** A flat array of the {@link ModelItem}s. (More convenient to use internally.) */
  private readonly modelItems = new Array<ModelItem<unknown>>();
  /** The class used for persisting data. */
  private persister: null | Persister = null;
  /** A rxjs/BehaviorSubject for whether this class has completed its initialisation. */
  private readonly initialisedSource = new BehaviorSubject<boolean>(false);

  /**
   * Sets an object of services.
   *
   * TODO: Change to take "Injector" Injectable object
   */
  public setServicesAndTriggerInitialValues(services: Record<string, unknown>): void {
    services = {
      ...services,
      Model: this, // TODO: with stricter typing this might need to be passed in separately
    };
    this.modelItems.forEach((modelItem: ModelItem<unknown>) => {
      modelItem.init(services);
    });
    this.populateValueOnInit();
  }
  /**
   * @return Whether initialised yet.
   */
  public isInitialised(): boolean {
    return this.initialisedSource.getValue();
  }
  /**
   * @return An rxjs/Observable<boolean> that indicates whether the service is initialised or not.
   */
  public watchInitialised(): Observable<boolean> {
    return this.initialisedSource.asObservable();
  }

  /**
   * Sets the persister object to set and get values to (called optionally).
   * @param persister {Persister}
   */
  protected setPersister(persister: Persister): this {
    this.persister = persister;
    return this;
  }

  /**
   * Called once the inheritor is ready.
   */
  protected init(): void {
    this.initModelItems(this as Record<string, unknown>);
    this.setInitialised();
  }

  /**
   * Iterates through the attributes of the model assigning unique id strings
   * (the model variable name)
   * @param object {any} The model object.
   */
  private initModelItems(object: Record<string, unknown>): void {
    // loop through attributes, getting names and values
    Object.keys(object).forEach((key: string) => {
      const value = object[key] as ModelItem<unknown>;
      if (value != null) {
        // if it's a model item
        if (value.isModelItem) {
          const modelItem = value
            .setIdentifier(key)
            .setPersister(this.persister);
          // place it in the array of items for quick reference later
          this.modelItems.push(modelItem);
        }
      }
    });
  }

  /**
   * Try to populate an initial value for the each {@link ModelItem}.
   */
  private populateValueOnInit(): this {
    this.modelItems.forEach((modelItem: ModelItem<unknown>) => {
      modelItem.populateValueOnInit();
    });
    return this;
  }

  /**
   * Marks the service as initialised.
   */
  private setInitialised(): void {
    this.initialisedSource.next(true);
  }

}
