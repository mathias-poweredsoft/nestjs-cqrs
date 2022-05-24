import { COMMAND_NAME_METADATA } from "./constants";

export interface ICommandOptions {
  name?: string;
}

export function Command(options: ICommandOptions = {}) {
  return <T extends { new(...args: any[]): {} }>(constructor: T) => {
      if (!options.name) {
          const name = constructor.name.toLowerCase();
          let index = name.lastIndexOf("command")
          if (index === -1)
              options.name = name;
          else
              options.name = name.substring(0, index);
      }

      Reflect.defineMetadata(COMMAND_NAME_METADATA, options.name, constructor);
      return class extends constructor {};
  }
}