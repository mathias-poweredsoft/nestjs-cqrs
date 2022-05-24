import 'reflect-metadata';
import { ICommand } from '../index';
import { COMMAND_HANDLER_METADATA, COMMAND_METADATA, COMMAND_NAME_METADATA } from './constants';
import { v4 } from 'uuid';
import { Type } from '@nestjs/common';

/**
 * Decorator that marks a class as a Nest command handler. A command handler
 * handles commands (actions) executed by your application code.
 *
 * The decorated class must implement the `ICommandHandler` interface.
 *
 * @param command command *type* to be handled by this handler.
 *
 * @see https://docs.nestjs.com/recipes/cqrs#commands
 */
export const CommandHandler = (command: Type<ICommand>): ClassDecorator => {
  return (target: object) => {
    const commandName = Reflect.getMetadata(COMMAND_NAME_METADATA, command);
    if (commandName === undefined) {
      let name = command.name.toLowerCase();
      const index = name.lastIndexOf("command")
      if (index !== -1)
        name = name.substring(0, index);

      Reflect.defineMetadata(COMMAND_NAME_METADATA, name, command);
    }

    Reflect.defineMetadata(COMMAND_HANDLER_METADATA, command, target);
  };
};
