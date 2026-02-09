import { Subject, Observable } from 'rxjs';
import { Settable, Watchable } from './configAttributeInterfaces';

/** The `SimpleConfigObservable` class is a TypeScript implementation of an observable pattern that
allows setting and watching a value of type `T2` with a context of type `T1`. */
export class SimpleConfigObservable<T1, T2> implements Settable<T1, T2>, Watchable<T1, T2> {

  /** The line `protected _source: Subject<null | T2>;` is declaring a protected property `_source` of
  type `Subject<null | T2>`. */
  protected _source: Subject<null | T2>;

  /**
   * The constructor initializes a protected property and creates a new Subject.
   * @param {T1} _context - The `_context` parameter is of type `T1` and is used to store some context
   * information. It is marked as `protected`, which means it can only be accessed within the class and
   * its subclasses.
   */
  constructor(
    protected _context: T1,
  ) {
    this._source = new Subject<null | T2>();
  }

  /**
   * The context function returns the value of the _context property.
   * @returns The method `context()` is returning the value of the variable `_context`.
   */
  public context(): T1 {
    return this._context;
  }

  /**
   * The function sets the value of a variable and returns the context.
   * @param {null | T2} [value=null] - The `value` parameter in the `set` method can be of type `null`
   * or `T2`. If no value is provided, the default value is `null`.
   * @returns The method is returning the value of `_context`, which is of type `T1`.
   */
  public set(value: null | T2 = null): T1 {
    this._source.next(value);
    return this._context;
  }

  /**
   * The function returns an Observable that emits either null or a value of type T2.
   * @returns The `watch()` method is returning an `Observable` that emits values of type `null` or
   * `T2`.
   */
  public watch(): Observable<null | T2> {
    return this._source.asObservable();
  }
}
