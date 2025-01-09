import BasicComponent from './BasicComponent';
import Command from './Command';
import Container from './Container';

export default class CommandComponent extends BasicComponent<Command> {
  constructor(parent: Container | null, name: string = null, value: Command = null) {
    super(parent, name, value);
  }
}
