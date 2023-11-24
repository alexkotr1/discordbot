const pool = require('./DB.js');
const SoundBoardChannel = require('./commands/Soundboard/SoundboardChannel.js')

class HerbertGuild {
    constructor(guild_id) {
        this.GuildID = guild_id;
        this.SoundboardChannel = null;
        this.JoinLeaveLogsChannelID = null;
        this.VoiceLogsChannelID = null;
        this.MessageLogsChannelID = null;
        this.MemberUpdateLogsChannelID = null;
        this.AIChannelID = null;
        this.Prefix = '!';
    }

    async verify() {
        try {
            const tableCheck = await pool.query(`
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_name = 'guilds'
                );
            `);

            if (!tableCheck.rows[0].exists) {
                await pool.query(`
                    CREATE TABLE guilds (
                        guild_id VARCHAR(255) PRIMARY KEY,
                        soundboard_channel VARCHAR(255),
                        join_leave_logs_channel_id VARCHAR(255),
                        voice_logs_channel_id VARCHAR(255),
                        message_logs_channel_id VARCHAR(255),
                        member_update_logs_channel_id VARCHAR(255),
                        ai_channel_id VARCHAR(255),
                        prefix VARCHAR(255) DEFAULT '!'
                    );
                `);
            } else {
                const columns = [
                    'soundboard_channel',
                    'join_leave_logs_channel_id',
                    'voice_logs_channel_id',
                    'message_logs_channel_id',
                    'member_update_logs_channel_id',
                    'ai_channel_id',
                    'prefix'
                ];

                for (const column of columns) {
                    const columnCheck = await pool.query(`
                        SELECT EXISTS (
                            SELECT 1
                            FROM information_schema.columns
                            WHERE table_name = 'guilds'
                            AND column_name = '${column}'
                        );
                    `);

                    if (!columnCheck.rows[0].exists) await pool.query(`ALTER TABLE guilds ADD COLUMN ${column} VARCHAR(255);`);
                }
            }
        } catch (err) {
            console.error("Error verifying or creating guilds table:", err);
            throw err;
        }
    }

    async refresh() {
        await this.verify();
        const results = await pool.query({
            text: "SELECT * FROM guilds WHERE guild_id = $1",
            values: [this.GuildID],
        });
        if (results.rows.length > 0) {
            const row = results.rows[0];
            if (row.soundboard_channel) {
                try {
                    const data = JSON.parse(row.soundboard_channel);
                    this.SoundboardChannel = new SoundBoardChannel(data.id, data.guild_id, data.message_ids);
                } catch (error) {
                    console.error(error);
                }
            }

            this.JoinLeaveLogsChannelID = row.join_leave_logs_channel_id || null;
            this.VoiceLogsChannelID = row.voice_logs_channel_id || null;
            this.MessageLogsChannelID = row.message_logs_channel_id || null;
            this.MemberUpdateLogsChannelID = row.member_update_logs_channel_id || null;
            this.AIChannelID = row.ai_channel_id || null;
            this.Prefix = row.prefix || '!';
            return true;
        } else return false;
    }

    async save() {
        await this.verify();
        try {
            await pool.query({
                text: `INSERT INTO guilds (guild_id, soundboard_channel, join_leave_logs_channel_id, voice_logs_channel_id, message_logs_channel_id, member_update_logs_channel_id, ai_channel_id, prefix) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (guild_id)
                    DO UPDATE SET
                        soundboard_channel = $2,
                        join_leave_logs_channel_id = $3,
                        voice_logs_channel_id = $4,
                        message_logs_channel_id = $5,
                        member_update_logs_channel_id = $6,
                        ai_channel_id = $7,
                        prefix = $8`,
                values: [
                    this.GuildID,
                    this.SoundboardChannel ? JSON.stringify(this.SoundboardChannel) : null,
                    this.JoinLeaveLogsChannelID,
                    this.VoiceLogsChannelID,
                    this.MessageLogsChannelID,
                    this.MemberUpdateLogsChannelID,
                    this.AIChannelID,
                    this.Prefix,
                ],
            });
        } catch (err) {
            console.error(err);
        }
    }

    // Getters and Setters

    get soundboardChannel() {
        return this.SoundboardChannel;
    }

    set soundboardChannel(value) {
        this.SoundboardChannel = value;
        this.save();
    }

    get joinLeaveLogsChannelID() {
        return this.JoinLeaveLogsChannelID;
    }

    set joinLeaveLogsChannelID(value) {
        this.JoinLeaveLogsChannelID = value;
        this.save();
    }

    get voiceLogsChannelID() {
        return this.VoiceLogsChannelID;
    }

    set voiceLogsChannelID(value) {
        this.VoiceLogsChannelID = value;
        this.save();
    }

    get messageLogsChannelID() {
        return this.MessageLogsChannelID;
    }

    set messageLogsChannelID(value) {
        this.MessageLogsChannelID = value;
        this.save();
    }

    get memberUpdateLogsChannelID() {
        return this.MemberUpdateLogsChannelID;
    }

    set memberUpdateLogsChannelID(value) {
        this.MemberUpdateLogsChannelID = value;
        this.save();
    }

    get aiChannelID() {
        return this.AIChannelID;
    }

    set aiChannelID(value) {
        this.AIChannelID = value;
        console.log("updating ai channel id ")
        this.save();
    }

    get prefix() {
        return this.Prefix;
    }

    set prefix(value) {
        this.Prefix = value;
        this.save();
    }
}

module.exports = { HerbertGuild };
