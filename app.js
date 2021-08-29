/* Import dependencies */
const express = require("express");
const exphbs = require("express-handlebars"); // Read .hbs file

const cookieParser = require("cookie-parser"); // Parse cookies from client
const expressSession = require("express-session"); // Uses cookies to save session in client
const crypto = require("crypto"); // Generates random string
const {stringify} = require("flatted"); // Stringifies circular JSON
const _ = require("underscore"); // Helpful functions

/* Import env variables */
require("dotenv").config(); // Read ./.env file (development)
const PORT = process.env.PORT;
const DOMAIN = process.env.LOCAL
  ? "localhost:" + PORT
  : "chat-test-auth.herokuapp.com";
const COOKIE = process.env.PROJECT_DOMAIN; //? What is this supposed to be? (It is 'biscuit' atm)

/* Import local files */
const Database = require("./js/database"); // Database functions (MongoDB)
const {getGitHubData} = require("./js/api"); // Interact with GitHub API
const Auth = require("./js/auth"); // Create authentication

async function main() {
  /* Start express app */
  const app = express();
  app.use(express.json()); //? What does this do?
  app.use(express.urlencoded({extended: true})); //? What does this do?

  /* Run other file functions */
  const dbClient = await Database.init();
  const passport = Auth.createAuth(app, DOMAIN, COOKIE);

  /* Create Handlebars renderer */
  const hbs = exphbs.create({
    layoutsDir: __dirname + "/views",
  });
  app.engine(
    ".hbs",
    exphbs({
      extname: ".hbs",
      helpers: {
        json: function (context) {
          return JSON.stringify(context);
        },
        json2: function (context) {
          return JSON.stringify(context, null, 2)
            .split(" ")
            .join("&nbsp;")
            .split("\n")
            .join("<br>");
        },
      },
    })
  );
  app.set("views", __dirname + "/views");
  app.set("view engine", ".hbs");

  /* Start cookie parser */
  app.use(cookieParser());
  app.use(
    expressSession({
      secret: crypto.randomBytes(64).toString("hex"),
      resave: true,
      saveUninitialized: true,
    })
  );

  //* Views
  /* Access public files */
  app.use("/public", express.static(__dirname + "/public"));

  /* Home page */
  app.get("/", async (req, res) => {
    let data = {};
    if (req.cookies[COOKIE]) {
      try {
        data.session = JSON.parse(req.cookies[COOKIE]);
      } catch (err) {
        console.log("Clearing cookie");
        res.cookie(COOKIE, "undefined");
      }
    }

    if (data.session && data.session.token) {
      let githubData;
      try {
        githubData = await getGitHubData(data.session.token);
      } catch (err) {
        githubData = {err};
        console.error("GitHubData Error: " + err);
      }
      _.extend(data, githubData);
    }

    if (data.session) {
      data.session.token = "mildly obfuscated.";
    }
    data.json = stringify(data, null, 2);

    res.render("main", {layout: false, ...data});
  });

  //* Requests
  /* Post message to database */
  app.get("/postmsg", async (req, res) => {
    var {channel, content} = req.query;
    channel = "root";

    var session = req.cookies[COOKIE] && JSON.parse(req.cookies[COOKIE]);
    if (!session || !session.token) {
      res.sendStatus(401);
    }

    let githubData;
    try {
      githubData = await getGitHubData(session.token);
    } catch (err) {
      githubData = {err};
      console.error("GitHubData Error: " + err);
    }

    const collection = dbClient.db(channel).collection("messages");
    collection
      .insertOne({
        channel,
        name: session.user.name,
        user: session.user.login,
        content,
        time: Date.now(),
      })
      .then(() => {
        res.sendStatus(200);
      })
      .catch(err => {
        console.error(err);
        res.sendStatus(500);
      });
  });

  /* Get all messages from database */
  app.get("/getmsg", (req, res) => {
    var {channel} = req.query;
    channel = "root";

    const collection = dbClient.db(channel).collection("messages");
    collection.find({}).toArray(function (error, result) {
      if (error) {
        console.error(error);
        res.sendStatus(500);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });

  /* Delete all messages from database */
  app.get("/deleteallmsg", async (req, res) => {
    var {channel} = req.query;
    channel = "root";

    var session = req.cookies[COOKIE] && JSON.parse(req.cookies[COOKIE]);
    if (!session || !session.token) {
      res.sendStatus(401);
    }

    let githubData;
    try {
      githubData = await getGitHubData(session.token);
    } catch (err) {
      githubData = {err};
      console.error("GitHubData Error: " + err);
    }

    console.log(`ALL MESSAGES DELETED BY ${session.user.login}`);

    const collection = dbClient.db(channel).collection("messages");
    collection.drop((error, delOK) => {
      if (error) {
        console.error(error);
        res.sendStatus(500);
      }
      if (delOK) {
        res.sendStatus(200);
      }
    });
  });

  //* Authentication links
  /* Log in / out functions */
  app.get("/logoff", function (req, res) {
    res.clearCookie(COOKIE);
    res.redirect("/");
  });

  app.get("/auth/github", passport.authenticate("github"));

  app.get(
    "/login/github/return",
    passport.authenticate("github", {
      successRedirect: "/setcookie",
      failureRedirect: "/",
    })
  );

  app.get("/setcookie", function (req, res) {
    if (req.session) {
      res.cookie(
        COOKIE,
        JSON.stringify({
          user: req.session.passport.user.profile._json,
          token: req.session.passport.user.token,
        })
      );
    }
    res.redirect("/");
  });

  /* Run server */
  app.listen(PORT, () => {
    console.log(`Server is running at http://${DOMAIN}`);
  });
}

console.log("\nStarting...");
main();
