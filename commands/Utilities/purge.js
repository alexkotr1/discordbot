const { client } = require("../../Client.js");
const Helper = require("../../Helper.js");
const { PermissionsBitField } = require('discord.js')
function purge() {
  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.content.startsWith("!purge")) return undefined;
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return Helper.prompt(message, "You don't have permissions to delete messages!")
    Helper.removeMessage(message);
    const args = message.content.split(" ");
    const count = parseInt(args[1]);
    if (isNaN(count)) {
      Helper.prompt(message, "Invalid arguments!");
      return undefined;
    }
    let fetchedMessages = await message.channel.messages.fetch({
      limit: count,
    });
    fetchedMessages.filter(m => isOlderThan13Days(m.createdAt)).map(m => {
      try {
        m.delete();
      } catch (err) {
        console.error(err);
      }
    })
    await message.channel.bulkDelete(
      fetchedMessages.filter((m) => !isOlderThan13Days(m.createdAt))
    );
  });
}

module.exports = purge;

function isOlderThan13Days(date) {
  const today = new Date();
  const thirteenDaysAgo = new Date(today.getTime() - 13 * 24 * 60 * 60 * 1000);
  return date < thirteenDaysAgo;
}
