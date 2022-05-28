import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import 'reflect-metadata';
import { QUERY_HANDLER_METADATA, QUERY_NAME_METADATA } from './decorators/constants';
import { QueryHandlerNotFoundException } from './exceptions';
import { InvalidQueryHandlerException } from './exceptions/invalid-query-handler.exception';
import { DefaultQueryPubSub } from './helpers/default-query-pubsub';
import {
  IQuery,
  IQueryBus,
  IQueryHandler,
  IQueryPublisher,
  IQueryResult
} from './interfaces';
import { ObservableBus } from './utils/observable-bus';

export type QueryHandlerType<QueryBase extends IQuery = IQuery,
  QueryResultBase extends IQueryResult = IQueryResult> = Type<IQueryHandler<QueryBase, QueryResultBase>>;

@Injectable()
export class QueryBus<QueryBase extends IQuery = IQuery>
  extends ObservableBus<QueryBase>
  implements IQueryBus<QueryBase> {
  private handlers = new Map<string, IQueryHandler<QueryBase, IQueryResult>>();
  private _publisher: IQueryPublisher<QueryBase>;

  constructor(private readonly moduleRef: ModuleRef) {
    super();
    this.useDefaultPublisher();
  }

  get publisher(): IQueryPublisher<QueryBase> {
    return this._publisher;
  }

  set publisher(_publisher: IQueryPublisher<QueryBase>) {
    this._publisher = _publisher;
  }

  async execute<T extends QueryBase, TResult = any>(
    query: T,
  ): Promise<TResult> {
    const queryName = this.getQueryName(query);
    const handler = this.handlers.get(queryName);
    if (!handler) {
      throw new QueryHandlerNotFoundException(queryName);
    }

    this.subject$.next(query);
    const result = await handler.execute(query);
    return result as TResult;
  }

  bind<T extends QueryBase, TResult = any>(
    handler: IQueryHandler<T, TResult>,
    name: string,
  ) {
    this.handlers.set(name, handler);
  }

  register(handlers: QueryHandlerType<QueryBase>[] = []) {
    handlers.forEach((handler) => this.registerHandler(handler));
  }
  
  resolveQueryTypeByName(name: string) {
    name = name.toLowerCase();
    const handler = this.handlers.get(name);
    if (handler === undefined)
      throw new QueryHandlerNotFoundException(name);

    return this.reflectQuery(handler.constructor as any);
  }

  protected registerHandler(handler: QueryHandlerType<QueryBase>) {
    const instance = this.moduleRef.get(handler, { strict: false });
    if (!instance) {
      return;
    }
    const target = this.reflectQueryName(handler);
    if (!target) {
      throw new InvalidQueryHandlerException();
    }
    this.bind(instance as IQueryHandler<QueryBase, IQueryResult>, target);
  }

  private getQueryName(query: QueryBase) {
    const { constructor: queryType } = Object.getPrototypeOf(query);
    return Reflect.getMetadata(
      QUERY_NAME_METADATA,
      queryType,
    );
  }

  private reflectQuery(handler: QueryHandlerType) : Type<IQuery> {
    return Reflect.getMetadata(
      QUERY_HANDLER_METADATA,
      handler,
    );
  }

  private reflectQueryName(handler: QueryHandlerType) {
    const query = this.reflectQuery(handler);

    return Reflect.getMetadata(
      QUERY_NAME_METADATA,
      query
    );
  }

  private useDefaultPublisher() {
    this._publisher = new DefaultQueryPubSub<QueryBase>(this.subject$);
  }
}
