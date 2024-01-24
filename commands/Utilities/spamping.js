const { client } = require("../../Client");
const { PermissionsBitField } = require('discord.js')
const Helper = require('../../Helper')
function spamping() {
    client.on("messageCreate", async message => {
        if (!(await Helper.checkCommand(message, "spamping")) || !message.member.permissions.has(PermissionsBitField.Flags.Administrator) || message.author.id !== "198005161807970304") return undefined
        Helper.removeMessage(message)
        const args = message.content.split(" ").slice(1)
        var answered = false;
        const id = args[0].replace(/[<>!@]/g,"")
        const filter = (newMessage) => newMessage.author.id === id || (newMessage.author.id === message.author.id && newMessage.content.toLowerCase().includes("stop"));
        const collector = message.channel.createMessageCollector({ filter, time: 0 });
        const messages = []
        collector.on("collect", () => {
                answered = true;
                collector.stop(); 
                console.log("STOP")
        });
        client.on("voiceStateUpdate", (oldState, newState)=>{
            if (newState.channel && newState.member.id === id) answered = true
        })
        sendMessage()
        function sendMessage(){
            if (!answered) {
                message.channel.send("<@" + id + ">").then(msg => {
                    messages.push(msg)
                    setTimeout(sendMessage, 100)
                })
            } else {
                message.channel.bulkDelete(messages)
            }
        }


    })
}


module.exports = spamping