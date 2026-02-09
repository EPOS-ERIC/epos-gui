import { Confirm } from 'api/webApi/utility/preconditions';
import { DataType } from 'api/webApi/classes/dataType.enum';
import { ItemSummary } from 'api/webApi/data/itemSummary.interface';
import { Point } from 'api/webApi/data/impl/simplePoint';


/**
 *
 */
export class SimpleItemSummary implements ItemSummary {

  private constructor(
    private readonly identifier: string,
    private readonly name: string,
    private readonly datatype: DataType,
    private readonly description: string,
    private readonly points: Point[],
  ) {
    this.identifier = identifier;
    this.name = name;
    this.description = description;
    this.datatype = datatype;
    this.points = points;
  }

  public static make(identifier: string, name: string, datatype: DataType, description: string): SimpleItemSummary {
    Confirm.requiresValid(identifier);
    Confirm.requiresValidString(name);
    Confirm.requiresValid(description);
    Confirm.requiresValid(datatype);
    return new SimpleItemSummary(identifier, name, datatype, description, new Array<Point>());
  }
  public static makeWithPoints(
    identifier: string,
    name: string,
    datatype: DataType,
    description: string,
    points: Point[],
  ): SimpleItemSummary {
    Confirm.requiresValid(identifier);
    Confirm.requiresValidString(name);
    Confirm.requiresValid(description);
    Confirm.requiresValid(datatype);
    Confirm.requiresValid(points);
    return new SimpleItemSummary(identifier, name, datatype, description, points);
  }
  // temorary
  public static makeDummyWithId(identifier: string, datatype?: DataType): SimpleItemSummary {
    Confirm.requiresValid(identifier);
    datatype = (datatype != null) ? datatype : DataType.UNKNOWN;
    const text = '***NOT A REAL ITEM SUMMARY***';
    return new SimpleItemSummary(identifier, text, datatype, text, new Array<Point>());
  }

  getName(): string {
    return this.name;
  }
  getIdentifier(): string {
    return this.identifier;
  }
  getDataType(): DataType {
    return this.datatype;
  }
  getDescription(): string {
    return this.description;
  }
  getPoints(): Point[] {
    return this.points;
  }

}

