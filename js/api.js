const GitHub = require("github-api");

async function getGitHubData(token) {
  let gh = new GitHub({token});

  let data = {};
  let me = gh.getUser();
  let repos = await me.listRepos();
  data.repos = repos.data;
  return me;
}

module.exports = {getGitHubData};
