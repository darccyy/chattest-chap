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

/* Local files */
const Chat = require("./chat");
const getGitHubData = require("./api");
const {decircleJSON} = require("./functions");

/* Import env variables */
require("dotenv").config();
const port = process.env.PORT;
const domain = process.env.LOCAL
  ? "localhost:" + port
  : "chat-test-auth.herokuapp.com";
const COOKIE = process.env.PROJECT_DOMAIN;

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

/* Create authentication */
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

/* Access public files */
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
    } catch (error) {
      githubData = {error};
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

/* Run server */
app.listen(port, () => {
  console.log(`🌏 Server is running at http://${domain}`);
});
