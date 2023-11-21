const emitter = require("../../Emitter")
class SoundboardChannel {
  constructor(id, guild_id, message_ids) {
    this.id = id;
    this.guild_id = guild_id;
    this.message_ids = message_ids && message_ids.length ? message_ids : [];
  }
  static async get(guild_id) {
    try {
      const herbert = await emitter.requestHerbertData()
      const guild = herbert.guilds.get(guild_id)
      return guild.SoundboardChannel;
    } catch (err) {
      console.error(err)
      return null;
    }
  }
  async set() {
    try {
      const herbert = await emitter.requestHerbertData()
      const guild = herbert.guilds.get(this.guild_id)
      guild.SoundboardChannel = this
      emitter.emit("updateHerbertData_" + this.guild_id, guild)
      return null;
    } catch (err) {
      console.error(err)
    }
  }
}

module.exports = SoundboardChannel;
