const { HerbertGuild } = require('./HerbertGuild')
class Herbert {
    constructor() {
        this.guilds = new Map();
    }

    async initializeGuilds(connectedGuilds) {
        try {
            connectedGuilds.map(async guild => {
                const db_guild = new HerbertGuild(guild.id)
                const exists = await db_guild.refresh();
                if (!exists) {
                    db_guild.GuildID = guild.id;
                }
                this.guilds.set(guild.id, db_guild);
            })
            return null;
        } catch (err) {
            console.error(err)
        }
    }

}

module.exports = { Herbert }