const axios = require('axios');
const { client } = require("../../Client");
const emitter = require("../../Emitter");
const MAX_RETRY_COUNT = 5;
const RETRY_DELAY_MS = 1000;
const fs = require('fs');
const conversation = new Map();
function ai() {

    client.on("messageCreate", async message => {
        const herbert = await emitter.requestHerbertData();
        if (herbert.guilds.get(message.guild.id).AIChannelID !== message.channel.id || message.author.bot || !message.content || !message.content.length || message.content.startsWith("!")) return undefined;
        request(message, 0)
    });
}

module.exports = ai;

async function request(message, retryCount) {
    fs.readFile('./commands/AI/AIPretext.txt', 'utf8', async (err, data) => {
        if (err) return console.error(err)
        const convo = conversation.get(message.guild.id) ? conversation.get(message.guild.id) : []
        try {
            message.channel.sendTyping();
            const message_content = message.cleanContent.replace(/@/g, "")
            convo.push({ role: "user", content: message_content, name: message.member.displayName })
            const instance = axios.create({
                baseURL: process.env.SHUTTLE_BASE_URL,
                headers: {
                    'Authorization': `Bearer ${process.env.SHUTTLE_API}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                }
            });
            const requestData = err ? convo : [{ role: "system", content: data }].concat(convo)
            console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")
            console.log(requestData)
            const response = await instance.post('/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: requestData,
            });
            if (response.error) throw new Error(response.error)
            const res = response.data.choices[0].message.content;
            convo.push({ role: "assistant", content: res })
            if (convo.length >= 10) {
                convo.shift()
                convo.shift()
            }
            await message.reply(res);
            conversation.set(message.guild.id, convo)
        } catch (err) {
            console.error("Error occurred:", err.message);
            convo.pop()
            if (retryCount < MAX_RETRY_COUNT) {
                setTimeout(() => request(message, retryCount + 1), RETRY_DELAY_MS);
            } else {
                await message.reply("AI Module offline. Try again later.")
            }
        }
    });
}

