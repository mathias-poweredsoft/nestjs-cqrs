import 'reflect-metadata';
import { IQuery } from '../interfaces';
import { QUERY_HANDLER_METADATA, QUERY_NAME_METADATA } from './constants';
import { Type } from '@nestjs/common';

/**
 * Decorator that marks a class as a Nest query handler. A query handler
 * handles queries executed by your application code.
 *
 * The decorated class must implement the `IQueryHandler` interface.
 *
 * @param query query *type* to be handled by this handler.
 *
 * @see https://docs.nestjs.com/recipes/cqrs#queries
 */
export const QueryHandler = (query: Type<IQuery>): ClassDecorator => {
  return (target: object) => {
    const commandName = Reflect.getMetadata(QUERY_NAME_METADATA, query);
    if (commandName === undefined) {
      let name = query.name.toLowerCase();
      const index = name.lastIndexOf("query")
      if (index !== -1)
        name = name.substring(0, index);

      Reflect.defineMetadata(QUERY_NAME_METADATA, name, query);
    }

    Reflect.defineMetadata(QUERY_HANDLER_METADATA, query, target);
  };
};
