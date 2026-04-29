import { openDB } from "idb";

const DB_NAME = "onesmart-inventory";
const DB_VERSION = 1;
const STORE_NAMES = ["products", "purchases", "bills", "returns"];

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      for (const store of STORE_NAMES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: "_id", autoIncrement: false });
        }
      }
    },
  });
}

export async function getAll(store) {
  const db = await getDB();
  return db.getAll(store);
}

export async function put(store, value) {
  const db = await getDB();
  return db.put(store, value);
}

export async function putBulk(store, values) {
  const db = await getDB();
  const tx = db.transaction(store, "readwrite");
  for (const v of values) {
    tx.store.put(v);
  }
  await tx.done;
}

export async function clear(store) {
  const db = await getDB();
  return db.clear(store);
}

export async function deleteDB() {
  return (await getDB()).close();
}

export async function clearAllData() {
  const db = await getDB();
  const tx = db.transaction(STORE_NAMES, "readwrite");

  for (const storeName of STORE_NAMES) {
    await tx.objectStore(storeName).clear();
  }

  await tx.done;
  console.log("All local data cleared successfully");
}

export async function clearSpecificStore(storeName) {
  if (!STORE_NAMES.includes(storeName)) {
    throw new Error(`Invalid store name: ${storeName}`);
  }

  const db = await getDB();
  await db.clear(storeName);
  console.log(`${storeName} store cleared successfully`);
}

// Helper function to get all data for debugging
export async function getAllDataFromAllStores() {
  const db = await getDB();
  const allData = {};

  for (const storeName of STORE_NAMES) {
    allData[storeName] = await db.getAll(storeName);
  }

  return allData;
}

