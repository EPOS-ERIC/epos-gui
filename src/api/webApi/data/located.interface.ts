import { Point } from 'api/webApi/data/impl/simplePoint';

export interface Located {
  getPoints(): Array<Point>;
}
