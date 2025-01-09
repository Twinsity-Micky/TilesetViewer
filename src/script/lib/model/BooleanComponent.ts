import BasicComponent from './BasicComponent';
import BooleanFormatter from './BooleanFormatter';
import Container from './Container';

export default class BooleanComponent extends BasicComponent<boolean> {
  constructor(parent: Container | null, name: string = null, value: boolean = null) {
    super(parent, name, value);
    this.setFormatter(new BooleanFormatter());
  }
}
