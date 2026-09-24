import { MongoClient } from "mongodb";

const options = {};
let globalClientPromise;

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
  } else {
    return MongoClient.connect(uri, options);
  }
}

