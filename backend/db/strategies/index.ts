import { InMemoryStrategy } from './InMemoryStrategy';
import { MongoStrategy } from './MongoStrategy';
import { IDatabaseStrategy } from './types';

export const getDatabaseStrategy = (): IDatabaseStrategy => {
  const uri = process.env.MONGO_URI;
  
  if (uri && uri.trim() !== "" && uri !== "<username>:<password>") {
    return new MongoStrategy();
  }
  
  return new InMemoryStrategy();
};
