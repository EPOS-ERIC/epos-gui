import { DataType } from 'api/webApi/classes/dataType.enum';

export interface Typed {
  getDataType(): DataType;
}
