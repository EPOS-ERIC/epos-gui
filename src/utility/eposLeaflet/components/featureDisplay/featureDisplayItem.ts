/** The `FeatureDisplayItem` class is a TypeScript class that represents a display item for a feature,
with properties for the feature object, content, and click event handler. */
export class FeatureDisplayItem {

  /**
   * The constructor function takes in a feature object, a function to get content, and an optional
   * click event handler.
   * @param {unknown} featureObject - The `featureObject` parameter is of type `unknown`, which means
   * it can hold any type of value. It is a public property of the class and can be accessed from
   * outside the class.
   * @param getContent - The `getContent` parameter is a function that returns either `null`, an
   * `HTMLElement`, or a `string`. It is optional and has a default value of an empty string.
   * @param [click] - The `click` parameter is an optional callback function that takes a `MouseEvent`
   * as its argument. It is used to handle the click event on an element.
   */
  constructor(
    /** The line `public featureObject: unknown` is declaring a public property named `featureObject` of
    type `unknown` in the `FeatureDisplayItem` class. The `unknown` type is used when the type of a
    value is not known or cannot be determined at compile-time. It allows any type of value to be
    assigned to the `featureObject` property. */
    public featureObject: unknown,

    /** The line `public getContent: () => null | HTMLElement | string = () => ''` is declaring a public
    property named `getContent` of type function in the `FeatureDisplayItem` class. */
    public getContent: () => null | HTMLElement | string = () => '',

    /** The line `public click?: (event: MouseEvent) => void` is declaring a public property named `click`
    of type function in the `FeatureDisplayItem` class. The function type `(event: MouseEvent) => void`
    specifies that the `click` property can hold a callback function that takes a `MouseEvent` as its
    argument and does not return any value (`void`). The `?` indicates that the `click` property is
    optional and can be omitted when creating an instance of the `FeatureDisplayItem` class. */
    public click?: (event: MouseEvent) => void,
  ) { }
}
