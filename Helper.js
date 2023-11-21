const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js")

class Helper {
  constructor() { }

  static async prompt(message, text) {
    var reply;
    try {
      reply = await message.channel.send(
        `<@!${message.author.id}>, ${text}`
      )
    }
    catch (error) {
      console.log("error replying to message")
    }
    try {
      await message.delete();
    } catch (err) {
      console.error("error deleting message id:" + message.id)
    }
    setTimeout(async function () {
      try {
        await reply.delete();
      } catch (error) {
        console.error("error deleting reply message");
      }
    }, 3000);
  }

  static async removeMessage(message) {
    try {
      message.delete()
    } catch (error) {
      console.error(error)
    }
  }

  static async userinput(channel, choices, title, description) {
    return new Promise(async (resolve) => {
      const embed = new EmbedBuilder()
        .setTitle(title ? title : 'Select an Option')
        .setDescription(description ? description : 'Choose from the following options:')
        .setColor('#3498db');

      const row = new ActionRowBuilder();

      choices.forEach((choice) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(choice)
            .setLabel(choice)
            .setStyle('Primary'),
        );
      });

      const message = await channel.send({
        embeds: [embed],
        components: [row],
      });

      const filter = (interaction) => {
        return interaction.isButton() && choices.includes(interaction.customId);
      };

      const collector = message.createMessageComponentCollector({
        filter,
        time: 15000,
      });

      collector.on('collect', (interaction) => {
        const selectedChoice = interaction.customId;
        const responseEmbed = new EmbedBuilder()
          .setDescription(`You selected: **${selectedChoice}**`)
          .setColor('#2ecc71');

        interaction.reply({
          embeds: [responseEmbed],
          ephemeral: true,
        });

        collector.stop();
        Helper.removeMessage(message)
        resolve(selectedChoice);
      });
    });
  }
}

module.exports = Helper;
