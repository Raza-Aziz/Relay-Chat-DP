/**
 * DatabaseService — Singleton Pattern
 * 
 * Ensures only one database connection/strategy exists across
 * the entire application lifecycle. All controllers access the
 * database through DatabaseService.getInstance().
 */

import { getDatabaseStrategy } from './strategies';
import { IDatabaseStrategy } from './strategies/types';
import { InMemoryStrategy } from './strategies/InMemoryStrategy';

class DatabaseService {
  private static instance: DatabaseService | null = null;
  private strategy: IDatabaseStrategy;

  private constructor() {
    this.strategy = getDatabaseStrategy();
  }

  /**
   * Singleton access point — returns the single DatabaseService instance.
   * Creates one on first call; returns the same one on all subsequent calls.
   */
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async connectDb(): Promise<void> {
    try {
      await this.strategy.connect();
    } catch (err) {
      console.error("Failed to connect to primary DB strategy. Falling back to In-Memory.");
      console.error(err);
      this.strategy = new InMemoryStrategy();
      await this.strategy.connect();
    }
  }

  async insertInDb<T>(data: T, collectionName: string): Promise<T> {
    return this.strategy.insert(data, collectionName);
  }

  async findOneFromDB<T>(findCondition: any, collectionName: string): Promise<T | null> {
    return this.strategy.findOne<T>(findCondition, collectionName);
  }

  async findFromDB<T>(condition: any, collectionName: string): Promise<T[]> {
    return this.strategy.find<T>(condition, collectionName);
  }

  async updateOneFromDb<T>(condition: any, data: any, collectionName: string): Promise<T | null> {
    return this.strategy.updateOne<T>(condition, data, collectionName);
  }
}

// Export a convenient default object that mirrors the old API
// so existing imports (`import db from '../../db'`) keep working.
const db = DatabaseService.getInstance();

export default {
  connectDb: () => db.connectDb(),
  insertInDb: <T>(data: T, col: string) => db.insertInDb(data, col),
  findOneFromDB: <T>(cond: any, col: string) => db.findOneFromDB<T>(cond, col),
  findFromDB: <T>(cond: any, col: string) => db.findFromDB<T>(cond, col),
  updateOneFromDb: <T>(cond: any, data: any, col: string) => db.updateOneFromDb<T>(cond, data, col),
};

export { DatabaseService };
