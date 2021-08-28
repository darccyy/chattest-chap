console.log("Script loaded.");

function send() {
  console.log("Send message: ", $("#msg").val());
  
  refresh();
}

function refresh() {
  console.log("REFRESH!");
}