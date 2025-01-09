import BasicComponent from './BasicComponent';
import Container from './Container';
import StringFormatter from './StringFormatter';

/**
 * Component implementation for the string type
 * 
 * @author Michael Hagen
 */
export default class StringComponent extends BasicComponent<string> {

  constructor(parent: Container | null, name: string = null, value: string = null) {
    super(parent, name, value);
    this.setFormatter(new StringFormatter());
  }
  
}
