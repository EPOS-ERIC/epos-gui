import { Domain } from 'api/webApi/data/domain.interface';
import { ModelItem } from './modelItem';

export class DomainMI extends ModelItem<Domain> {
  constructor(
  ) {
    const defaultValue: Domain = { id: '0', code: 'ALL', isSelected: true };
    super(defaultValue);
  }
}
