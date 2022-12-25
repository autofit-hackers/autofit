export default function assertIsDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value == null) {
    throw new Error(`Expected value to be defined, but received ${String(value)}`);
  }
}
