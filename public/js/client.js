/* Global variables */
var session;

/* Run on load */
function init() {
  session = $("meta[name=session]").attr("value");
  if (session) {
    session = JSON.parse(session);
  } else {
    session = null;
  }
  content = $("#msg").val("");
  refresh();
}

/* Post a message */
function send() {
  content = $("#msg").val();
  console.log("Send message: ", content);

  $.ajax({
    url: "postmsg",
    data: {
      content,
    },
    success: res => {
      console.log(res);
      refresh();
    },
    error: err => {
      console.error(err);
      refresh();
    },
  });
}

/* Refresh and load messages */
function refresh() {
  console.log("REFRESH!");
  $("#msgs").html("");

  $.ajax({
    url: "getmsg",
    data: {},
    success: res => {
      try {
        JSON.parse(res);
      } catch (err) {
        console.warn("Messages not JSON:", res);
        return;
      }

      res = JSON.parse(res);
      let str = "";
      /* res = [
        {
          name: "NameHere",
          user: "username_login",
          content:
            "This is an example of the message content. This is what it looks like 😀 Lorem ipsum dolor sit, amet consectetur adipisicing elit. Error obcaecati dolorem eaque alias ratione praesentium a nostrum eum officia voluptatem fugit ducimus cupiditate sapiente",
        },
        {
          name: "Name",
          user: "1",
          content: "msg",
        },
        {
          name: "testName",
          user: "this-is-a-really-long-user-name",
          content: "There is another message heres",
        },
      ]; */
      for (i = res.length - 1; i >= 0; i--) {
        // console.log(session, res[i].user === session.user);;
        str += getComponent("msg", {
          self: (session && res[i].user === session.user.login) ? "self" : "",
          icon: "",
          ...res[i],
        });
      }
      $("#msgs").html(str);
    },
    error: err => {
      console.error(err);
    },
  });
}

/* Delete all messages (development) */
function delall() {
  $("#msgs").html("");

  $.ajax({
    url: "deleteallmsg",
    data: {},
    success: res => {
      console.warn("Deleted all messages");
      refresh();
    },
    error: err => {
      console.error(err);
    },
  });
}

/* Get formatted HTML template from <components> tag */
function getComponent(name, format) {
  var html = $(`comp[name=${name}]`).html();
  if (!html) {
    throw `Component Error: '${name}' is not a valid template`;
  }
  for (var i in format) {
    html = html.split(`{${i}}`).join(format[i]);
  }
  return html;
}
