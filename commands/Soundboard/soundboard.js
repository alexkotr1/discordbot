const { client } = require("../../Client.js");
const emitter = require("../../Emitter.js")
const SoundboardChannel = require("./SoundboardChannel.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Sound = require("./Sound.js");

function postSoundBoard() {
  emitter.on("soundsUpdated", async guild_id => {
    await setButtons(guild_id)
  });
}

async function setButtons(guild_id) {
  try {
    var db_channel = await SoundboardChannel.get(guild_id);
    if (!db_channel) return null;
    const guild = await client.guilds.fetch(guild_id);
    if (!guild) return undefined;
    const channel = await guild.channels.fetch(db_channel.id);
    if (!channel) return undefined

    if (db_channel.message_ids) {
      for (var i = 0; i < db_channel.message_ids.length; i++) {
        let previous_msg;
        try {
          previous_msg = await channel.messages.fetch(db_channel.message_ids[i]);
        } catch (err) {
          console.error("Error fetching previous message:", err);
        }
        if (previous_msg) {
          try {
            await previous_msg.delete();
          } catch (err) {
            console.error("Error deleting previous message:", err);
          }
        }
      }
      db_channel.message_ids = []
    }
    const sounds = await Sound.retrieveAll(db_channel.guild_id);
    sounds.sort((a, b) => a.id - b.id);

    var message_times = Math.ceil(sounds.length / 25);
    var soundIndex = 0;
    for (var x = 0; x < message_times; x++) {
      const rows = [];
      for (var y = 0; y < 5 && soundIndex < sounds.length; y++) {
        const row = new ActionRowBuilder();
        const buttons = [];
        for (var z = 0; z < 5 && soundIndex < sounds.length; z++) {
          const button = new ButtonBuilder()
            .setCustomId("soundboard" + soundIndex.toString())
            .setLabel(`${sounds[soundIndex].id} - ${sounds[soundIndex].name}`)
            .setStyle(ButtonStyle.Primary);
          buttons.push(button);
          soundIndex++;
        }
        if (buttons.length) {
          row.addComponents(buttons);
          rows.push(row);
        }
      }
      const msg = await channel.send({
        components: rows,
      });
      db_channel.message_ids.push(msg.id);
      await db_channel.set();
      client.on("interactionCreate", async (interaction) => {
        if (
          !interaction.isButton() ||
          !interaction.customId.startsWith("soundboard")
        )
          return undefined;
        const index = parseInt(interaction.customId.replace("soundboard", ""));
        if (isNaN(index)) return undefined;
        try {
          await interaction.deferUpdate();
        } catch (err) {
          console.error(err);
        }
        if (interaction.member.voice.channel) {
          const sound = sounds[index];
          if (!sound) {
            try {
              await interaction.reply("Error!");
            } catch (err) {
              console.error(err);
            }
          }
          try {
            await sound.play(interaction.member.voice.channel);
          } catch (err) {
            console.error(err);
          }

        }

      });
    }
  } catch (err) {
    console.error(err);
  }
}
module.exports = postSoundBoard;
