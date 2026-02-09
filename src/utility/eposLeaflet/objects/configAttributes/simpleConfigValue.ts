import { Gettable, Settable } from './configAttributeInterfaces';

/** The `SimpleConfigValue` class is a TypeScript class that represents a configurable value with a
default value and the ability to get and set the value. */
export class SimpleConfigValue<T1, T2> implements Gettable<T1, T2>, Settable<T1, T2> {
  /**
   * The constructor initializes the protected variables _context, _default, and _value, and calls the
   * set method with the _value parameter.
   * @param {T1} _context - The `_context` parameter is of type `T1` and represents the context or
   * environment in which the constructor is being called. It is a protected property, meaning it can
   * only be accessed within the class and its subclasses.
   * @param {null | T2} [_default=null] - The `_default` parameter is an optional parameter that
   * specifies the default value for the `_value` property. If no value is provided for `_value` during
   * object creation, the `_default` value will be used instead.
   * @param {null | T2} [_value=null] - The `_value` parameter is used to set the initial value of the
   * object being constructed. It can be of type `null` or `T2`, where `T2` is a generic type.
   */
  constructor(
    protected _context: T1,
    protected _default: null | T2 = null,
    protected _value: null | T2 = null,
  ) {
    this.set(_value);
  }

  /**
   * The context function returns the value of the _context property.
   * @returns The method `context()` is returning the value of the variable `_context`.
   */
  public context(): T1 {
    return this._context;
  }

  /**
   * The function returns either null or a value of type T2.
   * @returns The method is returning either null or a value of type T2.
   */
  public get(): null | T2 {
    return this._value;
  }

  /**
   * The function sets a value to a variable, either using the provided value or a default value if the
   * provided value is null.
   * @param {null | T2} [value=null] - The `value` parameter is of type `null | T2`, which means it can
   * either be `null` or of type `T2`.
   * @returns The method is returning the `_context` variable.
   */
  public set(value: null | T2 = null): T1 {
    this._value = (value == null) ? this._default : value;
    return this._context;
  }
}
