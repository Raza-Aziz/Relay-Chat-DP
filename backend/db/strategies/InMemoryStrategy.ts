import {
  findOneFromDB as _findOneFromDB,
  findFromDB as _findFromDB,
  insertInDb as _insertInDb,
  updateOneFromDb as _updateOneFromDb
} from '../inMemDB';
import { IDatabaseStrategy } from './types';

export class InMemoryStrategy implements IDatabaseStrategy {
  async connect(): Promise<void> {
    // eslint-disable-next-line no-console
    console.log("Using Strategy: IN-MEMORY (Insecure/Temporary)");
  }

  async insert<T>(data: T, collectionName: string): Promise<T> {
    _insertInDb(data, collectionName);
    return data;
  }

  async findOne<T>(findCondition: any, collectionName: string): Promise<T | null> {
    return _findOneFromDB(findCondition, collectionName) as T;
  }

  async find<T>(condition: any, collectionName: string): Promise<T[]> {
    return _findFromDB(condition, collectionName);
  }

  async updateOne<T>(condition: any, data: any, collectionName: string): Promise<T | null> {
    return _updateOneFromDb(condition, data, collectionName) as Promise<T>;
  }
}
