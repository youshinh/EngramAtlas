const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const db = client.db('engram_atlas');
db.collection('engrams').findOne({}).then(res => {
  console.log("Success findOne", res ? "found" : "not found");
  client.close();
}).catch(console.error);
