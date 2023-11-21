const { client } = require("../../Client");
const axios = require('axios');
const Helper = require("../../Helper")
const MAX_RETRY_COUNT = 5;
const RETRY_DELAY_MS = 1000;
function imagine() {
    client.on("messageCreate", async message => {
        if (message.author.bot || !message.content.startsWith("!imagine")) return undefined;
        Helper.removeMessage(message);
        request(message)
    });
}

module.exports = imagine;

async function request(message, retryCount = 0) {
    const prompt = message.content.replace("!imagine", "");
    try {
        const instance = axios.create({
            baseURL: process.env.SHUTTLE_BASE_URL,
            headers: {
                'Authorization': `Bearer ${process.env.SHUTTLE_API}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            }
        });

        const response = await instance.post('/images/generations', {
            model: 'dall-e-3',
            prompt,
        });

        if (response.data.error) throw new Error(response.error);
        console.log(response)
        const attachments = response.data.data.map((item, i) => {
            return { attachment: item.url, name: `prompt#${i}.png` };
        });

        await message.channel.send({ files: attachments, content: `<@${message.author.id}>\`\`\`${prompt}\`\`\`` });
    } catch (err) {
        console.error("Error occurred:", err.message);

        if (retryCount < MAX_RETRY_COUNT) {
            setTimeout(() => request(message, retryCount + 1), RETRY_DELAY_MS);
        } else {
            await message.channel.send("Image generation failed. Try again later.");
        }
    }
}