import { EposLeafletComponent } from './eposLeaflet.component';

/** The `export interface SetMapComponentable {` statement is defining an interface named
`SetMapComponentable`. This interface specifies that any class that implements it must have a method
called `setMapComponent` that takes an argument of type `EposLeafletComponent` and returns an
instance of the class that implements the `SetMapComponentable` interface. */
export interface SetMapComponentable {

  /** The `setMapComponent` method is a function that takes an argument of type `EposLeafletComponent` and
  returns the instance of the class that implements the `SetMapComponentable` interface. */
  setMapComponent(eposLeaflet: EposLeafletComponent): this;
}
