const GithubStrategy = require("passport-github").Strategy;
const passport = require("passport");

function createAuth(app, URL, COOKIE) {
  /* Create authentication */
  let scopes = ["notifications", "user:email", "read:org", "repo"];
  passport.use(
    new GithubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${URL}/login/github/return`,
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

  return passport;
}

module.exports = {createAuth};