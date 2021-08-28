console.log("Script loaded.");

function send() {
  msg = $("#msg").val();
  console.log("Send message: ", msg);

  $.ajax({
    url: "postmsg",
    data: {
      msg,
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

function refresh() {
  console.log("REFRESH!");
  $("#msgs").html("");

  $.ajax({
    type: "GET",
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
      for (i = res.length - 1; i >= 0; i--) {
        str += `
          <div>
            <h1>
              ${res[i].name}
              <code>
                ${res[i].user}
              </code>
            </h1>
            <p>
              ${res[i].msg}
            </p>
          </div>
        `;
      }
      $("#msgs").html(str);
    },
    error: err => {
      console.error(err);
    },
  });
}
