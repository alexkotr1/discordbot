
const { SongQueue } = require('./SongQueue.js');
const { Song } = require('./Song.js')
const { client } = require("../../Client.js")
const yts = require('yt-search')

var hasPause = true;
let songqueue;
function play() {
  client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!play') || message.author.bot) return undefined
    const args = message.content.split(' ');
    var url = args.slice(1).join(" ")
    if (!url) return message.reply('Please provide a valid YouTube URL.');
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('You need to be in a voice channel to play music.');
    if (!songqueue) {
      songqueue = new SongQueue(voiceChannel);
    }
    await songqueue.start();
    try {
      if (isURL(url) && isYoutubeUrl(url)) {
        if (!isPlaylist(url) && !isVideoUrl(url)) return message.reply("URL Not supported!").then(msg => { setTimeout(() => msg.delete(), 3000) })
        if (isPlaylist(url)) {
          const info = await yts({ listId: extractPlaylistId(url) })
          if (info.videos.length == 0) return message.reply("No results found!").then(msg => { setTimeout(() => msg.delete(), 3000) })
          const songs = []
          for (var x = 0; x < info.videos.length; x++) {
            const video = info.videos[x]
            const song = new Song(video.title, "https://www.youtube.com/watch?v=" + video.videoId, video.seconds)
            songs.push(song)
          }
          console.log(songs)
          songqueue.addBulksongs(songs)
        }
        else if (isVideoUrl(url)) {
          console.log("ID:" + url)
          const info = await yts({ videoId: extractVideoId(url) })
          const song = new Song(info.title, info.url, info.seconds)
          songqueue.addSong(song)
        }
      }
      else {
        const info = await yts(url)
        if (info.length == 0) {
          return message.reply("No results found!").then(msg => { setTimeout(() => msg.delete(), 3000) })
        }
        console.log(info)
        const video = info.videos[0]
        const song = new Song(video.title, video.url, video.seconds)
        songqueue.addSong(song)
        message.delete().catch(console.error)
      }
      const embed = songqueue.toEmbed(hasPause, message.member)
      songqueue.message = await message.channel.send(embed);

    } catch (error) {
      console.error(error);
      message.reply(error.message).then(msg => { setTimeout(() => msg.delete(), 3000) });
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'volup') {
      if (songqueue) {
        songqueue.increaseVolume();
        await interaction.update(songqueue.toEmbed(hasPause, interaction.member));
      }
    } else if (interaction.customId === 'voldown') {
      if (songqueue) {
        songqueue.decreaseVolume();
        await interaction.update(songqueue.toEmbed(hasPause, interaction.member))
      }
    } else if (interaction.customId === 'skip') {
      if (songqueue) {
        songqueue.once("nextSong", async () => {
          await interaction.update(songqueue.toEmbed(hasPause, interaction.member))
        })
        songqueue.skipSong();
      }

    }
    else if (interaction.customId === 'pause') {
      if (songqueue) {
        songqueue.player.pause()
        hasPause = false
      }
      await interaction.update(songqueue.toEmbed(hasPause, interaction.member))
    }
    else if (interaction.customId === 'resume') {
      if (songqueue) {
        songqueue.player.unpause()
        hasPause = true
      }
      await interaction.update(songqueue.toEmbed(hasPause, interaction.member))
    }
  });

}


function isURL(str) {
  const pattern = new RegExp('^(https?:\\/\\/)?' +
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
    '((\\d{1,3}\\.){3}\\d{1,3}))' +
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
    '(\\?[;&a-z\\d%_.~+=-]*)?' +
    '(\\#[-a-z\\d_]*)?$', 'i');
  return pattern.test(str);
}

function isYoutubeUrl(url) {
  if (!isURL(url)) return false;
  const parsedUrl = new URL(url);
  return parsedUrl.hostname === 'www.youtube.com' && parsedUrl.pathname === '/watch';
}

function isPlaylist(url) {
  const playlistRegex = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?=.*v=([a-zA-Z0-9_-]+))(?=.*list=([a-zA-Z0-9_-]+)).*/;
  return playlistRegex.test(url)
}

function extractPlaylistId(url) {
  const regex = /list=([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

function extractVideoId(url) {
  const match = url.match(/(?:\?v=|&v=|youtu\.be\/)([\w-]{11})(?:\S+)?/);
  return match ? match[1] : null;
}

function isVideoUrl(url) {
  const videoUrlPattern = /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/;
  return videoUrlPattern.test(url);
}

module.exports = play