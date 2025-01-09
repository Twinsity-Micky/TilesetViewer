import Command from './Command';

export default class BasicCommand implements Command {

  protected commandName: string;

  constructor(commandName = 'BasicCommand') {
    this.commandName = commandName;
  }

  execute() {
    console.log('--> execute command: ' + this.commandName);
  }
}
