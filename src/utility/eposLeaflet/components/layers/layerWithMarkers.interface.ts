/** The `export interface LayerWithMarkers` statement is defining an interface named `LayerWithMarkers`.
This interface specifies the contract for objects that have markers and provides a method
`setZOffset` that can be used to set the z-offset of the markers. The `export` keyword makes the
interface accessible outside of the module. */
export interface LayerWithMarkers {

  /** The `setZOffset` method is a function that belongs to the `LayerWithMarkers` interface. It takes an
  optional parameter `index` of type `number` and does not return any value (`void`). */
  setZOffset(index?: number): void;
}
