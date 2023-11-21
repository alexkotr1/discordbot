const pool = require("../../DB.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const fs = require("fs");

class Sound {
  constructor(name, filepath, timesPlayed, volume, id, guild_id) {
    this.id = id;
    this.name = name;
    this.filepath = filepath;
    this.timesPlayed = timesPlayed;
    this.volume = volume;
    this.guild_id = guild_id;
  }

  static async verify() {
    try {
      // Create the sounds table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sounds (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          filepath VARCHAR(255) NOT NULL,
          timesPlayed INTEGER NOT NULL,
          volume INTEGER NOT NULL,
          guild_id VARCHAR(255) NOT NULL
        )
      `);

      // Create the guild_sounds table with guild-specific sound_counter
      await pool.query(`
        CREATE TABLE IF NOT EXISTS guild_sounds (
          guild_id VARCHAR(255) REFERENCES guilds(guild_id),
          sound_id INT REFERENCES sounds(id),
          guild_sound_id SERIAL,
          PRIMARY KEY (guild_id, sound_id),
          UNIQUE(guild_id, guild_sound_id)
        )
      `);
    } catch (err) {
      console.error("Error verifying or creating tables:", err);
      throw err;
    }
  }

  async play(channel) {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guildId,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
    const player = createAudioPlayer();
    try {
      await entersState(connection, "ready", 30e3);
      await entersState(player, AudioPlayerStatus.Idle, 30e3);
    } catch (error) {
      console.error(error);
      connection.destroy();
      return interaction.reply("Failed to play the file!");
    }
    if (!this.filepath) {
      console.error("No file path defined for this sound");
      return;
    }
    const resource = createAudioResource(fs.createReadStream(this.filepath));

    player.play(resource);
    connection.subscribe(player);
    player.on("error", (error) => {
      console.error(
        `Error: ${error.message} with resource ${error.resource.metadata}`
      );
      connection.destroy();
    });
  }

  async delete() {
    try {
      await Sound.verify();

      // Find the corresponding sound_id for the given guild_sound_id
      const soundIdResult = await pool.query({
        text: "SELECT sound_id FROM guild_sounds WHERE guild_sound_id = $1",
        values: [this.id],
      });

      const soundId = soundIdResult.rows[0].sound_id;

      // Delete from guild_sounds table
      await pool.query({
        text: "DELETE FROM guild_sounds WHERE guild_sound_id = $1",
        values: [this.id],
      });

      // Adjust the sequence for guild_sounds table
      const sequenceName = "guild_sounds_guild_sound_id_seq";
      const query = `
        SELECT setval($1::regclass, COALESCE((SELECT MAX(guild_sound_id) FROM guild_sounds), 1));
      `;
      const values = [sequenceName];
      await pool.query(query, values);

      // Delete from sounds table
      await pool.query({
        text: "DELETE FROM sounds WHERE id = $1",
        values: [soundId],
      });

      console.log("Sound deleted successfully!");
    } catch (err) {
      console.error(err);
    }
  }

  async save() {
    try {
      await Sound.verify();

      // Insert into sounds table
      const soundResult = await pool.query({
        text:
          "INSERT INTO sounds (name, filepath, timesPlayed, volume, guild_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        values: [this.name, this.filepath, this.timesPlayed, this.volume, this.guild_id],
      });

      const soundId = soundResult.rows[0].id;

      // Determine guild_sound_id by counting sounds of the same guild
      const soundCountResult = await pool.query({
        text:
          "SELECT COALESCE(MAX(guild_sound_id), 0) + 1 AS count FROM guild_sounds WHERE guild_id = $1",
        values: [this.guild_id],
      });

      const guildSoundId = soundCountResult.rows[0].count;

      // Insert into guild_sounds table with guild-specific sound_counter
      await pool.query({
        text: "INSERT INTO guild_sounds (guild_id, sound_id, guild_sound_id) VALUES ($1, $2, $3)",
        values: [this.guild_id, soundId, guildSoundId],
      });
    } catch (error) {
      throw error;
    }
  }

  static async retrieveAll(guild_id) {
    const sounds = [];
    try {
      await Sound.verify();

      // Retrieve sounds associated with a specific guild including guild_sound_id
      const result = await pool.query(`
        SELECT sounds.*, guild_sounds.guild_sound_id
        FROM sounds
        JOIN guild_sounds ON sounds.id = guild_sounds.sound_id
        WHERE guild_sounds.guild_id = $1
      `, [guild_id]);

      result.rows.forEach((row) => {
        sounds.push(
          new Sound(row.name, row.filepath, row.timesPlayed, row.volume, row.guild_sound_id, row.guild_id)
        );
      });
    } catch (err) {
      console.error("Error retrieving sounds:", err);
      throw err;
    }
    return sounds;
  }

  static async retrieveID(id, guild_id) {
    try {
      await Sound.verify();
      const query = {
        text: `
          SELECT sounds.*, guild_sounds.guild_sound_id
          FROM sounds
          JOIN guild_sounds ON sounds.id = guild_sounds.sound_id
          WHERE sounds.id = $1 AND guild_sounds.guild_id = $2
        `,
        values: [id, guild_id],
      };
      const result = await pool.query(query);
      if (result.rows.length === 0) return null;
      console.log(result.rows[0])
      const sound = new Sound(
        result.rows[0].name,
        result.rows[0].filepath,
        result.rows[0].timesPlayed,
        result.rows[0].volume,
        result.rows[0].guild_sound_id,
        result.rows[0].guild_id
      );
      return sound;
    } catch (err) {
      console.error("Error retrieving sound:", err);
      throw err;
    }
  }

}

module.exports = Sound;
