import { MongoClient } from "mongodb";

const options = {
  maxPoolSize: 10, // Recommended for Atlas M0 (500 cluster connection limit)
  minPoolSize: 0,
  maxIdleTimeMS: 60000,
  serverSelectionTimeoutMS: 5000,
};

let cachedPromise = null;

export function getClientPromise() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please add your Mongo URI to .env");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect().catch((err) => {
        delete global._mongoClientPromise;
        throw err;
      });
    }
    return global._mongoClientPromise;
  }

  // In production, reuse the cached promise across requests
  if (!cachedPromise) {
    const client = new MongoClient(uri, options);
    cachedPromise = client.connect().catch((err) => {
      cachedPromise = null;
      throw err;
    });
  }
  return cachedPromise;
}

