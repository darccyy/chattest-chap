/* Setup Mongo Database */
const {MongoClient} = require("mongodb");
uri = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@cluster0.fhgwa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect(err => {
  if (err) {
    throw err;
  }
  console.log("Connected to MongoDB");
});

module.exports = client;