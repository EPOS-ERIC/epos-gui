import { BehaviorSubject, Observable } from 'rxjs';

/** The `Accessor` class is a TypeScript class that provides a way to get, set, and trigger updates to a
value using a BehaviorSubject and an Observable. */
export class Accessor<T = unknown> {

  /** The line `private readonly src: BehaviorSubject<T>;` is declaring a private property named `src` of
  type `BehaviorSubject<T>`. */
  private readonly src: BehaviorSubject<T>;

  /** The `public readonly observable: Observable<T>;` line is declaring a public property named
  `observable` of type `Observable<T>`. */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public readonly observable: Observable<T>;

  /**
   * The constructor initializes a BehaviorSubject with a given value and creates an observable from
   * it.
   * @param {T} value - The `value` parameter is the initial value that will be emitted by the
   * `BehaviorSubject`.
   */
  constructor(value: T) {
    this.src = new BehaviorSubject<T>(value);
    this.observable = this.src.asObservable();
  }

  /**
   * The function returns the value of the "src" property.
   * @returns The value of `this.src.value` is being returned.
   */
  public get(): T {
    return this.src.value;
  }
  /**
   * The function sets the value of a variable and notifies subscribers.
   * @param {T} value - The "value" parameter is of type T, which means it can be any type specified
   * when the class or function is instantiated. It represents the value that will be passed to the
   * "next" method of the "src" object.
   * @returns The code is returning the result of calling the `next` method on the `src` object with
   * the `value` parameter.
   */
  public set(value: T): void {
    return this.src.next(value);
  }
  /**
   * The trigger function returns the next value of the source.
   * @returns The `trigger()` function is returning the result of calling `next()` on the `src` object
   * with the current value of `src`.
   */
  public trigger(): void {
    return this.src.next(this.src.value);
  }
}
