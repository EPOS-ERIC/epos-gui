export class Optional<T> {
  private constructor(private readonly value: T) { }

  static ofNullable<T>(value: T | null): Optional<null | T> {
    return new Optional(value);
  }

  static ofNonNullable<T>(value: T): Optional<T> {
    if (value == null) {
      throw new TypeError('optional value is null or undefined');
    }
    return new Optional(value);
  }

  static empty(): Optional<null> {
    return new Optional<null>(null);
  }

  isPresent(): boolean {
    return (this.value != null);
  }

  isEmpty(): boolean {
    return !this.isPresent();
  }

  get(): T {
    if (!this.isPresent()) {
      throw new TypeError('optional value is null or undefined');
    }
    return this.value;
  }

  ifPresent(consumer: (value: T) => void): void {
    if (this.isPresent()) {
      consumer(this.value);
    }
  }

  ifEmpty(run: () => void): void {
    if (this.isEmpty()) {
      run();
    }
  }

  map<U>(mapper: (value: T) => U): Optional<null | U> {
    return this.isPresent() ? Optional.ofNullable(mapper(this.value)) : Optional.empty();
  }

  orElse(other: null | T = null): null | T {
    return this.isPresent() ? this.value : other;
  }

  orThrow(error: unknown): T {
    if (!this.isEmpty()) {
      throw error;
    }
    return this.value;
  }

  orUse(supplier: () => T): Optional<null | T> {
    return this.isPresent() ? this : Optional.ofNullable(supplier());
  }

  orNull(): null | T {
    return this.isPresent() ? this.value : null;
  }

  filter(predicate: (value: T) => boolean): Optional<null | T> {
    if (this.isPresent()) {
      return (predicate(this.value)) ? this : Optional.empty();
    }

    return this;
  }

  toJSON(key: string): unknown {
    return this.isPresent() ? this.value : null;
  }
}
