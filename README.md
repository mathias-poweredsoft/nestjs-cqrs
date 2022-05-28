<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

## Description

A fork of the original [@nestjs/cqrs](https://github.com/nestjs/cqrs) package that uses the names of queries and commands instead of a generated uuid. The pros of this version that handlers are mapped by command/query name which let you resolve them by name instead of type without losing any performance and can let you map your commands/queries without using nestjs controllers. The consequence is that commands and queries names needs to be unique.

## What's new
CommandBus
```ts
resolveCommandTypeByName(name: string): Type<ICommand>;
// throw CommandHandlerNotFoundException if the command wasn't found
```

QueryBus
```ts
resolveQueryTypeByName(name: string): Type<IQuery>;
// throw QueryHandlerNotFoundException if the query wasn't found
```

Magic Trick example
```ts
const commandName = 'test';
const body = { value: 1 };

// resolve command
let command: ICommand;
try {
  const commandType = this.commandBus.resolveCommandTypeByName(commandName);
  // plainToClass from class-transformer package
  command = plainToClass(commandType, body);
  commandResult = await this.commandBus.execute(command);
} catch(error) {
  if (error instanceof CommandHandlerNotFoundException) {
    // command not found, do something here
  }
  throw error;
}
```

## Installation

```bash
$ npm install --save mps-nestjs-cqrs
```

## License

Nest is [MIT licensed](LICENSE).
