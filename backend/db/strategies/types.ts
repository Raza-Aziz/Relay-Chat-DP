export interface IDatabaseStrategy {
  connect(): Promise<void>;
  insert<T>(data: T, collectionName: string): Promise<T>;
  findOne<T>(findCondition: any, collectionName: string): Promise<T | null>;
  find<T>(condition: any, collectionName: string): Promise<T[]>;
  updateOne<T>(condition: any, data: any, collectionName: string): Promise<T | null>;
}
