const { client } = require("../../Client");
const emitter = require("../../Emitter")
const { PermissionsBitField } = require('discord.js')
const Helper = require('../../Helper')
const SoundBoardChannel = require("../Soundboard/SoundboardChannel")
function setchannel() {
    client.on("messageCreate", async message => {
        if (!(await Helper.checkCommand(message, "setchannel")) || !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return undefined
        const selected = await Helper.userinput(message.channel, ["Soundboard Channel", "AI Chat Channel"], "Channel Selection", "Please provide which type of channel you would like to select")
        if (selected === "Soundboard Channel") {
            const db_channel = new SoundBoardChannel(
                message.channel.id,
                message.guild.id,
                null
            );
            db_channel.set()
            emitter.emit("soundsUpdated", message.guild.id)
        } else if (selected === "AI Chat Channel") {
            const herbert = await emitter.requestHerbertData();
            const guild = herbert.guilds.get(message.guild.id);
            guild.AIChannelID = message.channel.id
            emitter.emit("updateHerbertData_" + message.guild.id, guild)
        }
    })
}


module.exports = setchannel