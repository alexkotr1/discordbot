const { client } = require("../../Client.js");
const Sound = require("./Sound");
const Helper = require('../../Helper.js')
const emitter = require('../../Emitter.js')
function remove() {
  client.on("messageCreate", async (message) => {
    if (!(await Helper.checkCommand(message, "remove"))) return undefined;
    Helper.removeMessage(message);
    const args = message.content.split(" ");
    args.shift();
    args.map(async (s) => {
      try {
        const sound = await Sound.retrieveID(s, message.guild.id);
        if (!sound) return undefined;
        await sound.delete();
      } catch (err) {
        console.error(err);
      }
    });
    emitter.emit("soundsUpdated", message.guild.id);
  });
}

module.exports = remove;
