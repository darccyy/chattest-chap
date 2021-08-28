/* Import dependencies */
const express = require("express");
const exphbs = require("express-handlebars"); // Read .hbs file

const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
const crypto = require("crypto");
const passport = require("passport");
const GithubStrategy = require("passport-github").Strategy;
const {stringify} = require("flatted");
const _ = require("underscore");

/* Import env variables */
require("dotenv").config();
const port = process.env.PORT;
const domain = process.env.LOCAL
  ? "localhost:" + port
  : "chat-test-auth.herokuapp.com";
const COOKIE = process.env.PROJECT_DOMAIN;

/* Import local files */
const Chat = require("./js/database");
const getGitHubData = require("./js/api");
const Database = require("./js/database");
const {decircleJSON} = require("./js/functions");

/* Start express app */
const app = express();

// app.use(express.json()); //? Delete?
app.use(express.urlencoded({extended: true}));

/* Create Handlebars renderer */
const hbs = exphbs.create({
  layoutsDir: __dirname + "/views",
});
app.engine(".hbs", exphbs({extname: ".hbs"}));
app.set("views", __dirname + "/views");
app.set("view engine", ".hbs");

/* Create authentication */ //TODO Move to auth.js
let scopes = ["notifications", "user:email", "read:org", "repo"];
passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `http://${domain}/login/github/return`,
      scope: scopes.join(" "),
    },
    function (token, tokenSecret, profile, cb) {
      return cb(null, {profile: profile, token: token});
    }
  )
);
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});
app.use(passport.initialize());
app.use(passport.session());

/* Start cookie parser */
app.use(cookieParser());
app.use(
  expressSession({
    secret: crypto.randomBytes(64).toString("hex"),
    resave: true,
    saveUninitialized: true,
  })
);

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
  let data = {
    user: req.session.passport.user.profile._json,
    token: req.session.passport.user.token,
  };
  res.cookie(COOKIE, JSON.stringify(data));
  res.redirect("/");
});

/* Access public files */ //TODO Move to pages.js (Rest of app.get)
app.use("/public", express.static(__dirname + "/public"));

/* Home page */
app.get("/", async (req, res) => {
  let data = {
    session: req.cookies[COOKIE] && JSON.parse(req.cookies[COOKIE]),
  };

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
    data.userJson = stringify(data.session.user, null, 2);
  }
  data.json = stringify(data, null, 2);

  res.render("main", {layout: false, ...data});
});

app.get("/postmsg", async (req, res) => {
  var {channel, name, msg} = req.query;
  channel = "root";
  name = "unsn";

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

  const collection = Database.db(channel).collection("messages");
  collection
    .insertOne({
      channel,
      name: session.user.name,
      user: session.user.login,
      msg,
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

app.get("/getmsg", (req, res) => {
  var {channel} = req.query;
  channel = "root";
  console.log(`Get message`);

  const collection = Database.db(channel).collection("messages");
  collection.find({}).toArray(function (error, result) {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.send(JSON.stringify(result));
    }
  });
});

/* Run server */
app.listen(port, () => {
  console.log(`🌏 Server is running at http://${domain}`);
});
