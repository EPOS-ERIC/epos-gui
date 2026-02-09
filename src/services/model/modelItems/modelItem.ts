import { BehaviorSubject, Observable } from 'rxjs';
import { Persister } from '../persisters/persister';
import { Model, modelContext } from '../model.service';
import { LocalStorageVariables } from '../persisters/localStorageVariables.enum';

/**
 * {@link ModelItem}s are primarily used by the {@link Model}, either as they come, or exteded
 * to add functionality.
 * {@link ModelItem}s are holders of values and have methods to "get", "set", "watch" for changes,
 * and "trigger" the change notification without updating the value.
 */
export class ModelItem<T> {

  /** The line `public isModelItem = true; // identifies this as a modalItem when type unknown` is
  declaring a public property `isModelItem` with a default value of `true`. This property is used to
  identify an instance of the `ModelItem` class when its type is unknown. It can be used to check if
  an object is an instance of `ModelItem` even if its type information is not available. */
  public isModelItem = true; // identifies this as a modalItem when type unknown

  /** The `public identifier: string;` line is declaring a public property `identifier` of type `string`
  in the `ModelItem` class. This property is used to uniquely identify the model item within the
  model. It can be used to retrieve or set the value of the model item using its identifier. */
  public identifier: string;

  /** The line `public initialised = false;` is declaring a public property `initialised` with a default
  value of `false`. This property is used to track whether the `ModelItem` has been initialized or
  not. It is initially set to `false` and can be updated to `true` once the `init` method is called on
  the `ModelItem`. */
  public initialised = false;

  /** The line `public populatedOnInit = false;` is declaring a public property `populatedOnInit` with a
  default value of `false`. This property is used to track whether the `ModelItem` has been populated
  with a value during initialization or not. It is initially set to `false` and can be updated to
  `true` once the `populateValueOnInit` method is called on the `ModelItem`. */
  public populatedOnInit = false;

  /** The line `public persistableOnConfigurables = false;` is declaring a public property
  `persistableOnConfigurables` with a default value of `false` in the `ModelItem` class. This property
  is used to determine whether the model item should be persisted on configurable variables. If set to
  `true`, the model item's value will be persisted when the configurable variables are saved. If set
  to `false`, the model item's value will not be persisted on configurable variables. */
  public persistableOnConfigurables = false;

  /** The line `public prePersistConverter: (modelItem: ModelItem<T>) => unknown;` is declaring a public
  property `prePersistConverter` in the `ModelItem` class. This property is a function that takes a
  `ModelItem` object as a parameter and returns a value of type `unknown`. It is used as a converter
  function to transform the value of the `ModelItem` before persisting it. This allows for custom
  logic to be applied to the value before it is stored in a persister. */
  public prePersistConverter: (modelItem: ModelItem<T>) => unknown;

  /** The `postPersistConverter` property is a function that takes a `ModelItem` object and a value of
  type `unknown` as parameters and returns a promise that resolves to a value of type `T`. It is used
  as a converter function to transform the value retrieved from persistence before it is set as the
  value of the `ModelItem`. This allows for custom logic to be applied to the retrieved value before
  it is used. */
  public postPersistConverter: (modelItem: ModelItem<T>, value: unknown) => Promise<T>;

  /** The `defaultValueSetter` property is a function that takes a `ModelItem` object as a parameter and
  returns a promise that resolves to a value of type `T`. It is used to set the default value of the
  `ModelItem`. When the `ModelItem` is initialized, if the value is not populated from persistence,
  the `defaultValueSetter` function is called to set the default value of the `ModelItem`. The
  function can perform any necessary logic to determine the default value and return it as a promise. */
  public defaultValueSetter: (modelItem: ModelItem<T>) => Promise<T>;

  /** The above code is defining a public property called `initFunction` which is a function that takes a
  parameter `modelItem` of type `ModelItem<T>`. The function returns a `Promise` that resolves to
  `void`. */
  public initFunction: (modelItem: ModelItem<T>) => Promise<void>;

  /** The above code is declaring a public variable called `valueObs` of type `Observable<T>`. */
  public valueObs: Observable<T>;

  /** The above code is declaring a protected variable called `valueSource` of type `BehaviorSubject<T>`. */
  protected valueSource: BehaviorSubject<T>;

  /** The above code is declaring a protected property called "persister" with a type of either null or
  Persister. */
  protected persister: null | Persister;

  /** The above code is declaring a protected property named "persistable" and assigning it a value of
  false. */
  protected persistable = false;

  /** The above code is declaring a protected property called "services" of type "Record<string,
  unknown>". The "services" property is an object that can hold key-value pairs, where the keys are
  strings and the values can be of any type. */
  protected services: Record<string, unknown>;

  /** The above code is defining a class in TypeScript with a protected property called "logging" that is
  set to false. */
  protected logging = false;

  /**
   * The function is a constructor that initializes a BehaviorSubject with a default value and sets up
   * an observable for the value.
   * @param {T} defaultValue - The `defaultValue` parameter is the initial value that will be set for
   * the `valueSource` BehaviorSubject. It is of type `T`, which means it can be any type specified
   * when creating an instance of the class.
   */
  protected constructor(defaultValue: T) {
    this.valueSource = new BehaviorSubject<T>(defaultValue);
    this.valueObs = this.valueSource.asObservable();
    if (defaultValue != null) {
      this.setDefaultValueFunction(() => Promise.resolve(defaultValue));
    }
  }

  /**
   * The function "makeNullable" returns a new instance of "ModelItem" with a default value that can be
   * null or of type T1.
   * @param {null | T1} [defaultValue=null] - The `defaultValue` parameter is an optional parameter
   * that allows you to specify a default value for the `ModelItem`. It has a type of `null | T1`,
   * which means it can either be `null` or of type `T1`. If no value is provided for `defaultValue`,
   * it
   * @returns The method is returning a new instance of the `ModelItem` class with a generic type of
   * `null | T1`, where `T1` is a type parameter. The constructor of `ModelItem` is being called with
   * the `defaultValue` parameter as an argument.
   */
  public static makeNullable<T1>(defaultValue: null | T1 = null): ModelItem<null | T1> {
    return new ModelItem<null | T1>(defaultValue);
  }

  /**
   * The function "make" creates a new instance of the ModelItem class with a specified default value.
   * @param {T1} defaultValue - The `defaultValue` parameter is the initial value that will be assigned
   * to the `ModelItem` object. It is of type `T1`, which means it can be any type specified when
   * calling the `make` method.
   * @returns The method is returning an instance of the `ModelItem<T1>` class with the specified
   * `defaultValue` as its constructor argument.
   */
  public static make<T1>(defaultValue: T1): ModelItem<T1> {
    return new ModelItem<T1>(defaultValue);
  }

  /**
   * The `init` function initializes the object with the provided services and executes an optional
   * initialization function before marking the object as initialized.
   * @param services - The `services` parameter is a record (or dictionary) that maps string keys to
   * unknown values. It is used to store various services or dependencies that the class or function
   * may need to access or use.
   */
  public init(services: Record<string, unknown>): void {
    this.services = services;
    if (this.initFunction != null) {
      void this.initFunction(this)
        .then(() => this.setInitialised());
    } else {
      this.setInitialised();
    }
  }

  /**
   * The function sets the persistable property of an object and returns the object itself.
   * @param [persistable=true] - The "persistable" parameter is a boolean value that determines whether
   * an object should be persisted or not. If set to true, the object will be saved and stored for
   * future use. If set to false, the object will not be persisted and will not be saved for future
   * use.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setPersistable(persistable = true): this {
    this.persistable = persistable;
    return this;
  }

  /**
   * The function sets pre-persist and post-persist converters for a model item.
   * @param prePersistConverter - The prePersistConverter is a function that takes a modelItem of type
   * ModelItem<T> and converts it to an unknown type. It is used before persisting the modelItem.
   * @param postPersistConverter - The postPersistConverter is a function that takes two parameters:
   * modelItem and value. It is used to convert the persisted value back to its original type T. The
   * modelItem parameter represents the ModelItem object that was persisted, and the value parameter
   * represents the persisted value. The function should return a Promise
   * @returns The method is returning the current instance of the class.
   */
  public setPersistFunctions(
    prePersistConverter = (modelItem: ModelItem<T>) => modelItem.get() as unknown,
    postPersistConverter = (modelItem: ModelItem<T>, value: unknown) => Promise.resolve(value as T),
  ): this {
    this.prePersistConverter = prePersistConverter;
    this.postPersistConverter = postPersistConverter;
    this.setPersistable();
    return this;
  }

  /**
   * The function sets a default value for a model item using a provided callback function.
   * @param defaultValueSetter - The `defaultValueSetter` parameter is a function that takes a
   * `modelItem` of type `ModelItem<T>` and returns a `Promise` of type `T`. It is used to set the
   * default value for the `modelItem`.
   * @returns the instance of the class that the method is being called on.
   */
  public setDefaultValueFunction(
    defaultValueSetter: (modelItem: ModelItem<T>) => Promise<T>,
  ): this {
    this.defaultValueSetter = defaultValueSetter;
    return this;
  }

  /**
   * The `setInitFunction` method sets the initialization function for a model item and returns the
   * instance of the class.
   * @param initFunc - The initFunc parameter is a function that takes a modelItem of type T as an
   * argument and returns a Promise that resolves to void.
   * @returns The method is returning the instance of the class on which it is called.
   */
  public setInitFunction(
    initFunc: (modelItem: ModelItem<T>) => Promise<void>,
  ): this {
    this.initFunction = initFunc;
    return this;
  }

  /**
   * The function sets the identifier property of an object and returns the object itself.
   * @param {string} id - The "id" parameter is a string that represents the identifier value.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setIdentifier(id: string): this {
    this.identifier = id;
    return this;
  }

  /**
   * The function sets the value of the "persistableOnConfigurables" property and returns the instance
   * of the class.
   * @param {boolean} value - A boolean value that determines whether the object should be persistable
   * on configurables.
   * @returns The method is returning the instance of the class on which the method is called.
   */
  public setPersistableOnConfigurables(value: boolean): this {
    this.persistableOnConfigurables = value;
    return this;
  }

  /**
   * The function sets the persister property of an object and returns the object itself.
   * @param {null | Persister} persister - The `persister` parameter is of type `null` or `Persister`.
   * It is used to set the persister for the current object.
   * @returns The method is returning the instance of the class itself (this).
   */
  public setPersister(persister: null | Persister): this {
    this.persister = persister;
    return this;
  }

  /**
   * The function "populateValueOnInit" checks if a model item exists, sets its value from persistence,
   * sets a default value if necessary, and marks it as populated on initialization.
   * @returns The method `populateValueOnInit()` returns an instance of the current class (`this`).
   */
  public populateValueOnInit(): this {
    void this.setFromPersistence()
      .then(() => {
        if (this.get() == null) {
          void this.setFromDefault();
        }
        this.populatedOnInit = true;
      });
    return this;

  }

  /**
   * Sets the value
   * @param {T} value New value.
   * @param {boolean} force Forces change notifications even if old and new values were the same.
   */
  public set(value: T, force = false): void {
    // check if changed
    if (force || (this.initialised)) {
      this.log('DM set', this.identifier, value);
      this.valueSource.next(value);

      if ((this.persistable) && (this.persister != null)) {
        const persistValue = (this.prePersistConverter != null) ? this.prePersistConverter(this) : value;
        this.persister.set(this.identifier, persistValue, false, false);

        if (this.persistableOnConfigurables) {
          this.persister.set(LocalStorageVariables.LS_CONFIGURABLES, persistValue, false, this.identifier);
        }
      }
    }
  }

  /**
   * @returns {T} Current Value
   */
  public get(): T {
    this.log('DM get', this.identifier, this.valueSource.getValue());
    return this.valueSource.getValue();
  }

  /**
   * Results in the emitting of a notifications of change, but with the same value as before.
   */
  public trigger(): void {
    this.log('DM trigger', this.identifier);
    this.set(this.valueSource.getValue());
  }

  /**
   * @returns {Model} The Model that this item is registered to.
   */
  public getModel(): Model {
    return this.services.Model as Model;
  }

  /**
   * The function `getService` retrieves a service based on its id and returns it, or logs an error if
   * the service is not set.
   * @param {string} service - The `service` parameter is a string that represents the id of the
   * service that you want to retrieve from the `services` object.
   * @returns The requested service is being returned.
   */
  public getService(service: string): unknown {
    const requestedService = this.services[service];
    if (requestedService == null) {
      console.error(`No service set with id '${service}'.  Please set it in the ModelPrimer.service.`);
    }
    return requestedService;
  }

  /**
   * The getContext function returns the context associated with a given identifier in the modelContext
   * array.
   * @returns a string value.
   */
  public getContext(): string {
    const modelContextTemp = modelContext.find(e =>
      e.variable === this.identifier);

    if (modelContextTemp === undefined) {
      return '';
    }

    return modelContextTemp.context;
  }


  /**
   * The log function logs a message and optional parameters if logging is enabled.
   * @param {string} [message] - A string representing the log message. It is an optional parameter,
   * meaning it can be omitted when calling the function.
   * @param optionalParams - An array of unknown type, which means it can accept any type of values as
   * its elements.
   */
  protected log(message?: string, ...optionalParams: Array<unknown>): void {
    if (this.logging) {
      console.log(message, ...optionalParams);
    }
  }


  /**
   * The function `getPersistedValue` returns a promise that resolves to the persisted value of a model
   * item, if available.
   * @returns A Promise that resolves to an unknown value.
   */
  protected getPersistedValue(): Promise<unknown> {
    return new Promise((resolve) => {
      if (this.persister != null) {
        this.log('ModelItem: try setting value from persistence', this.identifier);
        void this.persister.get(this.identifier)
          .then((rawValue: unknown) => {
            this.log('ModelItem: raw value from persistence', this.identifier, rawValue);
            resolve(rawValue);
          });
      } else {
        resolve(null);
      }
    });
  }

  /**
   * The function `setFromPersistence` retrieves a persisted value, converts it if necessary, and sets
   * it on the model item.
   * @returns a Promise that resolves to void (undefined).
   */
  protected setFromPersistence(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.persistable) {
        resolve();
      } else {
        void this.getPersistedValue()
          .then((rawValue: unknown) => {
            if (rawValue != null) {
              void ((this.postPersistConverter == null)
                ? Promise.resolve(rawValue)
                : this.postPersistConverter(this, rawValue)
              ).then((value: T) => {
                this.set(value);
                resolve();
                this.log('ModelItem: set value from persistence', this.identifier, value);
              });
            } else {
              resolve();
              this.log('ModelItem: no value from persistence', this.identifier);
            }
          });
      }
    });
  }


  /**
   * The function `setFromDefault` sets the value of a model item from its default value, if available.
   * @returns The function `setFromDefault()` returns a Promise that resolves to `void`.
   */
  protected setFromDefault(): Promise<void> {
    if (this.defaultValueSetter != null) {
      this.log('ModelItem: try setting value from default', this.identifier);
      return this.defaultValueSetter(this)
        .then((value: T) => {
          this.log('ModelItem: set value from default', this.identifier, value);
          this.set(value);
        });
    } else {
      return Promise.resolve();
    }
  }

  /**
   * The function sets the value of the "initialised" property to true by default, but can also accept
   * a different value.
   * @param [initialised=true] - The "initialised" parameter is a boolean value that indicates whether
   * an object or variable has been initialized or not.
   */
  private setInitialised(initialised = true) {
    this.initialised = initialised;
  }

}
