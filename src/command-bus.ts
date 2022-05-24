import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import 'reflect-metadata';
import { COMMAND_HANDLER_METADATA, COMMAND_NAME_METADATA } from './decorators/constants';
import { CommandHandlerNotFoundException } from './exceptions/command-not-found.exception';
import { DefaultCommandPubSub } from './helpers/default-command-pubsub';
import { InvalidCommandHandlerException } from './index';
import {
  ICommand,
  ICommandBus,
  ICommandHandler,
  ICommandPublisher
} from './interfaces/index';
import { ObservableBus } from './utils/observable-bus';

export type CommandHandlerType = Type<ICommandHandler<ICommand>>;

@Injectable()
export class CommandBus<CommandBase extends ICommand = ICommand>
  extends ObservableBus<CommandBase>
  implements ICommandBus<CommandBase> {
  private handlers = new Map<string, ICommandHandler<CommandBase>>();
  private _publisher: ICommandPublisher<CommandBase>;

  constructor(private readonly moduleRef: ModuleRef) {
    super();
    this.useDefaultPublisher();
  }

  get publisher(): ICommandPublisher<CommandBase> {
    return this._publisher;
  }

  set publisher(_publisher: ICommandPublisher<CommandBase>) {
    this._publisher = _publisher;
  }

  execute<T extends CommandBase, R = any>(command: T): Promise<R> {
    const commandId = this.getCommandName(command);
    const handler = this.handlers.get(commandId);
    if (!handler) {
      throw new CommandHandlerNotFoundException(commandId);
    }
    this.subject$.next(command);
    return handler.execute(command);
  }

  bind<T extends CommandBase>(handler: ICommandHandler<T>, name: string) {
    this.handlers.set(name, handler);
  }

  register(handlers: CommandHandlerType[] = []) {
    handlers.forEach((handler) => this.registerHandler(handler));
  }

  resolveCommandTypeByName(name: string) {
    name = name.toLowerCase();
    const handler = this.handlers.get(name);
    if (handler === undefined)
      throw new CommandHandlerNotFoundException(name);

    return this.reflectCommand(handler.constructor as any);
  }

  protected registerHandler(handler: CommandHandlerType) {
    const instance = this.moduleRef.get(handler, { strict: false });
    if (!instance) {
      return;
    }
    const target = this.reflectCommandName(handler);
    if (!target) {
      throw new InvalidCommandHandlerException();
    }
    this.bind(instance as ICommandHandler<CommandBase>, target);
  }


  private getCommandName(command: CommandBase) {
    const { constructor: commandType } = Object.getPrototypeOf(command);
    return Reflect.getMetadata(
      COMMAND_NAME_METADATA,
      commandType,
    );
  }

  private reflectCommand(handler: CommandHandlerType) : Type<ICommand> {
    return Reflect.getMetadata(
      COMMAND_HANDLER_METADATA,
      handler,
    );
  }

  private reflectCommandName(handler: CommandHandlerType) {
    const command: Type<ICommand> = Reflect.getMetadata(
      COMMAND_HANDLER_METADATA,
      handler
    );

    return Reflect.getMetadata(
      COMMAND_NAME_METADATA,
      command
    );
  }

  private useDefaultPublisher() {
    this._publisher = new DefaultCommandPubSub<CommandBase>(this.subject$);
  }
}
