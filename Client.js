require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { Herbert } = require('./Herbert');
const emitter = require('./Emitter');
var herbert = new Herbert();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});



emitter.on("requestHerbertData", () => emitter.emit("receiveHerbertData", herbert))

emitter.requestHerbertData = async function (guild_id) {
  return new Promise(resolve => {
    emitter.once("receiveHerbertData", data => {
      resolve(guild_id ? data.guilds.get(guild_id) : data)
    })
    emitter.emit("requestHerbertData")
  })
}


client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const guilds = [...client.guilds.cache.values()];
  await herbert.initializeGuilds(guilds);
  setTimeout(function () {
    guilds.map(guild => {
      emitter.emit("soundsUpdated", guild.id)
      emitter.on("updateHerbertData_" + guild.id, data => {
        if (!data) return undefined;
        herbert.guilds.set(guild.id, data);
        herbert.guilds.get(guild.id).save()
      })
    })
  }, 500)
});

client.on("rateLimit", (rateLimitInfo) => {
  console.log("Rate limit hit!");
  console.log(rateLimitInfo);
});

client.on("error", err => {
  console.error(err);
});

client.login(process.env.BOT_TOKEN);

module.exports = { client };



