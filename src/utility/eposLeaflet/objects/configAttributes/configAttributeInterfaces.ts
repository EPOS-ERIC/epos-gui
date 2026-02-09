import { Observable } from 'rxjs';


/** The `export interface Gettable<T1, T2>` is defining an interface named `Gettable` with two generic
type parameters `T1` and `T2`. This interface represents an object that can be retrieved or accessed
to get a value of type `T2` from a context object of type `T1`. It includes the following methods: */
export interface Gettable<T1, T2> {

  /** The `context(): T1;` method in the `Gettable`, `Settable`, and `Watchable` interfaces is defining a
  method named `context` that returns a value of type `T1`. This method is used to retrieve the
  context object from which the value is being retrieved, set, or watched. The context object
  represents the environment or container in which the value exists. */
  context(): T1;

  /** The `get(): null | T2;` method in the `Gettable` interface is defining a method named `get` that
  returns a value of type `null` or `T2`. This method is used to retrieve the value of type `T2` from
  the context object. If the value is not available, it returns `null`. */
  get(): null | T2;
}

/** The `export interface Settable<T1, T2>` is defining an interface named `Settable` with two generic
type parameters `T1` and `T2`. This interface represents an object that can be set or updated with a
value of type `T2` in a context object of type `T1`. It includes the following methods: */
export interface Settable<T1, T2> {

  /** The `context(): T1;` method in the `Gettable`, `Settable`, and `Watchable` interfaces is defining
  a method named `context` that returns a value of type `T1`. This method is used to retrieve the
  context object from which the value is being retrieved, set, or watched. The context object
  represents the environment or container in which the value exists. */
  context(): T1;

  /** The `set(value: null | T2): T1;` method in the `Settable` interface is defining a method named
  `set` that takes a parameter `value` of type `null` or `T2` and returns a value of type `T1`. This
  method is used to set the value of type `T2` in the context object. If the value is `null`, it
  means that the value is being unset or cleared. The method returns the updated context object
  after setting the value. */
  set(value: null | T2): T1;
}

/** The `export interface Watchable<T1, T2>` is defining an interface named `Watchable` with two generic
type parameters `T1` and `T2`. This interface represents an object that can be watched for changes
in a value of type `T2` in a context object of type `T1`. It includes the following methods: */
export interface Watchable<T1, T2> {

  /** The `context(): T1;` method is defining a method named `context` that returns a value of type
  `T1`. This method is used to retrieve the context object from which the value is being retrieved,
  set, or watched. The context object represents the environment or container in which the value
  exists. */
  context(): T1;

  /** The `watch(): Observable<null | T2>;` method in the `Watchable` interface is defining a method
  named `watch` that returns an `Observable` object. This method is used to watch for changes in the
  value of type `T2` in the context object. */
  watch(): Observable<null | T2>;
}
