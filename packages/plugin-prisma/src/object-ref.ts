import { ObjectRef } from '@giraphql/core';
import { PrismaModelTypes } from '.';

export const prismaModelKey = Symbol.for('GiraphQL.prismaModelKey');

export class PrismaObjectRef<Model extends PrismaModelTypes, T = {}> extends ObjectRef<T> {
  [prismaModelKey]: Model;
}
