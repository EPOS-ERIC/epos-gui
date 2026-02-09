import { Typed } from 'api/webApi/data/typed.interface';
import { Described } from 'api/webApi/data/described.interface';
import { Identifiable } from 'api/webApi/data/identifiable.interface';
import { Located } from 'api/webApi/data/located.interface';


/**
 *
 */
export interface ItemSummary extends Identifiable, Typed, Described, Located {
  // union of types
}

