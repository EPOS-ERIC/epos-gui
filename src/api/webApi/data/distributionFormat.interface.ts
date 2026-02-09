import { Usable } from './usable';

/**
 * A (DDSS) distrubution can support multiple formats, those formats are represented by this interface.
 */
export interface DistributionFormat extends Usable {
  /**
   * Display label for the format.
   */
  getLabel(): string;

  /**
   * Identifier for the format.
   */
  getFormat(): string;

  /**
   * Identifier for the original format.
   */
  getOriginalFormat(): string;

  /**
   * The HREF (link) to access this format from a paticular distribition.
   */
  getUrl(): string;

  /**
   * The errr 'type' of the format whether its 'original' or 'converted'.
   */
  getType(): string;
}
