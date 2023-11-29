const { client } = require("../../Client")
const Helper = require('../../Helper')
const { PermissionsBitField } = require('discord.js')
const emitter = require('../../Emitter')
function prefix() {
    client.on("messageCreate", async message => {
        if (!(await Helper.checkCommand(message, "prefix")) || !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return undefined
        const herbertGuild = await emitter.requestHerbertData(message.guild.id)
        const prefix = message.content.split(" ").shift().join(" ")
        herbertGuild.Prefix = prefix
        await emitter.updateGuildData(herbertGuild)
        Helper.prompt("Prefix was successfully updated to \`\`" + prefix + "\`\`")
    })
}

module.exports = prefix