const pool = require('../../DB')
class AIChannel {
    constructor(channel_id, guild_id) {
        this.channel_id = channel_id;
        this.guild_id = guild_id;
    }
    static async verify() {
        try {
            await pool.query(`
            CREATE TABLE IF NOT EXISTS aichannel (
              id VARCHAR(255) NOT NULL,
              guild_id VARCHAR(255) NOT NULL,
            )
          `);
        } catch (err) {
            console.error(
                "Error verifying or creating aichannel table:",
                err
            );
            throw err;
        }
    }
    async set() {
        await pool.query({
            text: "INSERT INTO aichannel (id, guild_id, message_ids) VALUES ($1, $2, $3)",
            values: [this.id, this.guild_id, JSON.stringify(this.message_ids)],
        });
    }
    async delete() {

    }
}