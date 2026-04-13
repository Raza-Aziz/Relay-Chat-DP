import { Db, MongoClient, ServerApiVersion } from 'mongodb';

import { IDatabaseStrategy } from './types';

export class MongoStrategy implements IDatabaseStrategy {
  private client: MongoClient;
  private db: Db | null = null;
  private uri: string;
  private dbName: string;

  constructor() {
    this.uri = process.env.MONGO_URI || '';
    this.dbName = process.env.MONGO_DB_NAME || '';
    this.client = new MongoClient(this.uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
  }

  async connect(): Promise<void> {
    if (!this.uri) throw new Error("Mongo URI is missing!");
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    // eslint-disable-next-line no-console
    console.log("Using Strategy: MONGODB (Production Ready)");
  }

  async insert<T>(data: T, collectionName: string): Promise<T> {
    if (!this.db) throw new Error("DB not connected");
    await this.db.collection(collectionName).insertOne(data as any);
    return data;
  }

  async findOne<T>(findCondition: any, collectionName: string): Promise<T | null> {
    if (!this.db) throw new Error("DB not connected");
    return this.db.collection(collectionName).findOne(findCondition, { sort: { _id: -1 } }) as Promise<T | null>;
  }

  async find<T>(condition: any, collectionName: string): Promise<T[]> {
    if (!this.db) throw new Error("DB not connected");
    return this.db.collection(collectionName).find(condition).toArray() as Promise<T[]>;
  }

  async updateOne<T>(condition: any, data: any, collectionName: string): Promise<T | null> {
    if (!this.db) throw new Error("DB not connected");
    await this.db.collection(collectionName).updateOne(condition, { $set: data });
    return this.findOne<T>(condition, collectionName);
  }
}
