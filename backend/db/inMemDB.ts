export type MongoDataType = Record<any, any> | null;
const findOneFromArr = (arr: [], findCondition:any): MongoDataType =>
  arr.find((data) => {
    const conditionKeys = Object.keys(findCondition);
    const results = conditionKeys.filter(
      (key) => findCondition[key] && data[key] === findCondition[key]
    );
    return results.length === conditionKeys.length;
  });

const storage = {};
let pk = 0;

export const insertInDb = (data, collectionName: string): void => {
  if (!storage[collectionName]) {
    storage[collectionName] = [];
  }
  const collection = storage[collectionName];
  collection.push({
    pk,
    ...data
  });
  pk += 1;
};
export const findOneFromDB = (findCondition, collectionName: string) => {
  if (!storage[collectionName]) {
    return null;
  }
  const collection = storage[collectionName];
  return findOneFromArr(collection, findCondition);
};
export const findFromDB = (condition: any, collectionName: string): any[] => {
  if (!storage[collectionName]) {
    return [];
  }
  const collection = storage[collectionName] as any[];
  return collection.filter((data) => {
    const conditionKeys = Object.keys(condition);
    const results = conditionKeys.filter(
      (key) => condition[key] && data[key] === condition[key]
    );
    return results.length === conditionKeys.length;
  });
};

export const updateOneFromDb = (condition, data, collectionName: string): MongoDataType  => {
  if (!storage[collectionName]) {
    return null;
  }
  const collection = storage[collectionName];
  const originalData = findOneFromArr(collection, condition);

  if (!originalData) {
    return null;
  }

  Object.keys(data).forEach((key) => {
    const val = data[key];
    originalData[key] = val;
  });

  return originalData;
};
