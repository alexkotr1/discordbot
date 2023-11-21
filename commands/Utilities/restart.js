const { client } = require("../../Client.js");
function restart() {
  client.on("messageCreate", async (message) => {
    if (message.content === "!restart" && message.author.id === "198005161807970304") {
      Helper.removeMessage(message);
      process.exit();
    }
  });
}

module.exports = restart;
