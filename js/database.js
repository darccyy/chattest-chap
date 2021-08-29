const {MongoClient} = require("mongodb");

/* Setup Mongo Database */
function init() {
  return new Promise(resolve => {
    uri = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@cluster0.fhgwa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
    dbClient = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    dbClient.connect(err => {
      if (err) {
        throw err;
      }
      console.log("Connected to MongoDB");
      resolve(dbClient);
    });
  });
}

module.exports = {init};
