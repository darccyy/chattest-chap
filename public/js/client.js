/* Global variables */
var session;
var global = {
  pageLoad: Date.now(),
  once_post: true,
  lastSent: Date.now(),
};

/* Run on load */
function init() {
  session = $("meta[name=session]").attr("value");
  if (session) {
    session = JSON.parse(session);
  } else {
    session = null;
  }
  content = $("#msg").html("");
  refresh();
}

var mouse = {};
addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
addEventListener("mousedown", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
addEventListener("mouseup", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

/* Post a message */
function send() {
  validateMessage();
  content = $("#msg").html();
  channel = $("#channel").html();
  console.log("Send message: ", content);

  $("#msg").html("");

  $.ajax({
    url: "postmsg",
    data: {
      content,
      channel,
      userData: session.user,
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
  // console.log("REFRESH!");
  $("#msgs").html("");
  $("#btn-refresh").addClass("active");

  $.ajax({
    url: "getmsg",
    data: {
      channel: $("#channel").html(),
    },
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
          name: "Darcy",
          user: "darccyy",
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
        str += getComponent("msg", {
          self: session && res[i].user === session.user.login ? "self" : "",
          icon: "",
          avatar: `src="${
            (res[i].userData && res[i].userData.avatar_url) || "#"
          }"`,
          ...res[i],
        });
      }
      $("#msgs").html(str);
      $("#btn-refresh").removeClass("active");
    },
    error: err => {
      console.error(err);
      $("#btn-refresh").removeClass("active");
      refresh();
    },
  });
}

/* Delete all messages (development) */
function delall() {
  $("#msgs").html("");

  $.ajax({
    url: "deleteallmsg",
    data: {
      channel: $("#channel").html(),
    },
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

/* Validate message input text */
function msgKeyDown(e) {
  if (e.key == "Enter") {
    if (!e.shiftKey) {
      if (global.once_post) {
        global.once_post = false;
        send();
      }
      e.preventDefault();
    }
  }
}

function msgKeyUp(e) {
  if (e.key == "Enter") {
    global.once_post = true;
  }
}

function msgChange() {
  validateMessage();
}

function validateMessage() {}

/* Validate channel name */
function changeChannel() {
  if (validateChannel()) {
    refresh();
  }
}

/* Set channel to 'root' when unfocused */
function changeChannelBlur() {
  if (!validateChannel(true) || $("#channel").html() === ":") {
    $("#channel").html("root");
  }
}

/* Focus channel element when container clicked */
function focusChannel() {
  if (!$("#channel").html()) {
    $("#channel").focus();
    return;
  }
  
  /* Decide which side to place caret on */
  rect0 = $(".channel-contain")[0].getBoundingClientRect();
  rect1 = $("#channel")[0].getBoundingClientRect();
  if (
    mouse.x >= rect0.left &&
    mouse.x < rect0.left + rect0.width &&
    mouse.y >= rect0.top &&
    mouse.y < rect0.top + rect0.height &&
    !(mouse.x >= rect1.left && mouse.x < rect1.left + rect1.width)
  ) {
    if (mouse.x < rect0.left + rect0.width / 2) {
      $("#channel").setCaret(0);
    } else {
      $("#channel").setCaret($("#channel").html().length);
    }
  }
}

/* Set channel to valid string */
function validateChannel(ignoreSame) {
  old = $("#channel").html();
  caret = $("#channel").getCaret();

  admin = false;
  if ($("#channel").html()[0] === ":") {
    admin = true;
    $("#channel").html($("#channel").html().slice(1, 32));
  }

  $("#channel").html(
    $("#channel")
      .html()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/gm, "")
  );

  if (admin) {
    $("#channel").html(":" + $("#channel").html());
  }

  if ($("#channel").html().length > 0) {
    caret -= old.length - $("#channel").html().length;
    $("#channel").html($("#channel").html().slice(0, 32));

    $("#channel").setCaret(
      Math.max(0, Math.min(caret, $("#channel").html().length))
    );
  }

  if (!ignoreSame && global.prev_channel === $("#channel").html()) {
    return false;
  }
  global.prev_channel = $("#channel").html();
  return $("#channel").html();
}
