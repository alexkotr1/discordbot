const { createAudioPlayer } = require('@discordjs/voice');

class Song {
  constructor(name, url, duration) {
    this.name = name;
    this.url = url;
    this.duration = duration;
    this.player = createAudioPlayer();
  }
}

module.exports = { Song };
