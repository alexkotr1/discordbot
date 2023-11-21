const { client } = require("../../Client.js");
const Sound = require("./Sound.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const Helper = require("../../Helper.js");
const soundsDir = path.join(__dirname, "../../sounds");
const SoundboardChannel = require("./SoundboardChannel.js");
const { v4: uuidv4 } = require('uuid')
const emitter = require("../../Emitter.js")
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir);
}

function add() {
  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.attachments.size) return undefined;
    const db_channel = await SoundboardChannel.get(message.guild.id);
    if (message.channel.id !== db_channel.id || message.guild.id !== db_channel.guild_id) return undefined;
    Helper.removeMessage(message)
    await Sound.verify();
    if (!db_channel) return undefined;
    if (
      message.guild.id !== db_channel.guild_id ||
      message.channel.id !== db_channel.id
    )
      return undefined;
    try {
      const added = await Promise.all(
        message.attachments.map(async (attachment) => {
          const name = getFileNameFromURL(attachment.url)
          const ext = name.split(".")[1]
          if (ext != 'mp3') {
            await Helper.prompt(message, `\`\`${name}\`\` wasn't added because its file format is not supported.`)
            return false;
          }
          const sound = await addSound(attachment, message.guild.id);
          return sound;
        })
      );
      const filteredAdded = added.filter((sound) => sound !== false);
      emitter.emit("soundsUpdated", message.guild.id);
      await Helper.prompt(
        message,
        `${filteredAdded.length} sound${filteredAdded.length != 1 ? "s" : ""} ${filteredAdded.length == 1 ? "was" : "were"
        } added!`
      );
    } catch (error) {
      console.error(error);
    }
  });
}

module.exports = add;

async function addSound(attachment, guild_id) {
  if (!attachment.contentType.startsWith("audio")) return false;
  console.log(123123)
  const ext = getFileExtension(attachment.name);
  const name = attachment.name.replace("." + ext, "");
  console.log(name)
  const filename = name.slice(0, 220) + "_" + uuidv4() + ".mp3";
  console.log(filename)
  try {
    const filepath = await downloadFile(
      attachment.url,
      path.join(soundsDir),
      filename

    );
    console.log(filepath)
    const sound = new Sound(name, filepath, 0, 100, null, guild_id);
    await sound.save();
  } catch (err) {
    Helper.prompt(message, err.message);
  } finally {
    return true;
  }
}
async function downloadFile(url, destinationPath, fileName) {
  try {
    console.log(fileName)
    const response = await axios.get(url, { responseType: "stream" });
    const filePath = path.join(destinationPath, fileName);

    const writeStream = fs.createWriteStream(filePath);
    response.data.pipe(writeStream);

    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => resolve(filePath));
      writeStream.on("error", (err) => {
        console.error(err)
        reject(err)
      });
    });
  } catch (err) {
    console.error(err)
  }
}

function getFileExtension(fileName) {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) return "";
  return fileName.slice(lastDotIndex + 1).toLowerCase();
}

function getFileNameFromURL(url) {
  const matches = url.match(/\/([^/?#]+)[^/]*$/);
  if (matches && matches.length > 1) {
    return matches[1];
  }
  return null;
}

