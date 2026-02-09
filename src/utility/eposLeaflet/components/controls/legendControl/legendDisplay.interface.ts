import { Legend } from './legend';

/** The `export interface LegendDisplay` statement is defining an interface named `LegendDisplay`. This
interface specifies the structure and behavior of an object that represents a legend display. It
includes properties and methods that can be implemented by classes that want to provide a legend
display functionality. */
export interface LegendDisplay {

  /** The `cssClassName` property is defining a string that represents the CSS class name for the legend
  display. This class name can be used to apply specific styles to the legend display element in the
  HTML/CSS code. */
  cssClassName: string;

  /** The `displayLegend` function is a method that takes in two parameters: `legends` and
  `setContentFunction`. */
  displayLegend(
    legends: Array<Legend>,
    setContentFunction: (contentElement: HTMLElement, headerElements?: Array<HTMLElement>) => void,
  ): void;
}
