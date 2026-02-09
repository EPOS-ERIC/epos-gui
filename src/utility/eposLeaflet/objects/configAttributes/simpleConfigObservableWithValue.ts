import { BehaviorSubject } from 'rxjs';
import { SimpleConfigObservable } from './simpleConfigObservable';
import { Gettable } from './configAttributeInterfaces';

/** The `SimpleConfigObservableWithValue` class is a TypeScript class that extends the
`SimpleConfigObservable` class and adds the ability to set and get values of type `T2`, with a
default value of `null`. */
export class SimpleConfigObservableWithValue<T1, T2>
  extends SimpleConfigObservable<T1, T2>
  implements Gettable<T1, T2> {

  /** The line `protected _source: BehaviorSubject<null | T2>;` is declaring a protected property
  `_source` of type `BehaviorSubject<null | T2>`. */
  protected _source: BehaviorSubject<null | T2>;

  /**
   * The constructor initializes a BehaviorSubject with a default value and a provided value, if any.
   * @param {T1} context - The "context" parameter is of type T1 and is used to provide additional
   * context or information to the constructor.
   * @param {null | T2} [_default=null] - The `_default` parameter is a value of type `null | T2`,
   * which means it can either be `null` or of type `T2`. It is used as the default value for the
   * `_source` BehaviorSubject if no initial value is provided.
   * @param {null | T2} [value=null] - The `value` parameter is used to set the initial value of the
   * `_source` BehaviorSubject. If the `value` is not provided or is `null`, then the `_default` value
   * is used as the initial value.
   */
  constructor(
    context: T1,
    protected _default: null | T2 = null,
    value: null | T2 = null,
  ) {
    super(context);
    this._source = new BehaviorSubject<null | T2>((value == null) ? this._default : value);
  }

  /**
   * The function returns the value of the `_source` property, which can be either `null` or of type
   * `T2`.
   * @returns The method is returning either null or an object of type T2.
   */
  public get(): null | T2 {
    return this._source.getValue();
  }

  /**
   * The function "trigger" returns the result of calling the "set" function with the result of calling
   * the "get" function.
   * @returns The trigger function is returning the result of calling the set function with the result
   * of calling the get function.
   */
  public trigger(): T1 {
    return this.set(this.get());
  }

  /**
   * The function sets a value, which can be null, and returns the result of calling the super class's
   * set method with the value or a default value if the value is null.
   * @param {null | T2} [value=null] - The parameter "value" is of type null or T2, which means it can
   * either be null or of type T2.
   * @returns The method is returning a value of type T1.
   */
  public set(value: null | T2 = null): T1 {
    return super.set((value == null) ? this._default : value);
  }

}
