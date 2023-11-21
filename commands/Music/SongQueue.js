const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  createAudioPlayer,
  AudioPlayerStatus,
  createAudioResource,
  StreamType,
} = require("@discordjs/voice");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const play = require("play-dl");
const EventEmitter = require("events");
class SongQueue extends EventEmitter {
  constructor(channel) {
    super();
    this.songs = [];
    this.channel = channel;
    this.connection = null;
    this.player = null;
    this.currentSong = null;
    this.resource = null;
    this.message = null;
  }

  async addSong(song) {
    this.songs.push(song);
    if (!this.player || this.player.state.status === AudioPlayerStatus.Idle) {
      await this.playNextSong();
      return undefined;
    }
  }

  async addBulksongs(songs) {
    this.songs = this.songs.concat(songs);
    if (!this.player || this.player.state.status === AudioPlayerStatus.Idle) {
      await this.playNextSong();
      return undefined;
    }
  }

  async playNextSong() {
    if (this.currentSong) {
      console.log(`Song ended: ${this.currentSong.name}`);
      this.currentSong = null;
    }
    const nextSong = this.songs.shift();
    if (nextSong) {
      console.log(`Playing next song: ${nextSong.name}`);
      this.currentSong = nextSong;
      this.emit("nextSong");
      const source = await play.stream(nextSong.url);
      this.resource = createAudioResource(source.stream, {
        inputType: source.type,
        inlineVolume: true,
      });
      this.player.play(this.resource);
      console.log(this.currentSong);
    } else {
      console.log(`Song queue is empty`);
      this.player?.stop();
      this.connection?.disconnect();
      this.connection = null;
      this.player = null;
    }
  }

  async start() {
    if (this.connection && this.player) return;
    this.connection = joinVoiceChannel({
      channelId: this.channel.id,
      guildId: this.channel.guild.id,
      adapterCreator: this.channel.guild.voiceAdapterCreator,
    });
    this.player = createAudioPlayer();
    this.connection.on(VoiceConnectionStatus.Ready, () => {
      console.log(`Connected to voice channel: ${this.channel.name}`);
    });
    this.player.on(AudioPlayerStatus.Playing, () => {
      console.log(`Started playing: ${this.currentSong?.name}`);
    });

    this.player.on("error", async (error) => {
      console.log("AudioPlayer error:" + error.message);
      await this.playNextSong();
    });
    this.player.on(AudioPlayerStatus.Idle, () => this.playNextSong());
    this.connection.subscribe(this.player);
    return undefined;
  }

  skipSong() {
    if (!this.currentSong) return;
    console.log(`Skipping song: ${this.currentSong.name}`);
    this.player?.stop();
  }
  decreaseVolume() {
    if (this.resource) {
      const vol = this.resource.volume;
      const target_vol = vol.volume - 0.25;
      vol.setVolume(target_vol < 0 ? 0 : target_vol);
    }
  }
  increaseVolume() {
    if (this.resource) {
      const vol = this.resource.volume;
      const target_vol = vol.volume + 0.25;
      vol.setVolume(target_vol > 3 ? 3 : target_vol);
    }
  }

  toEmbed(shouldAddPause, lastInteraction) {
    var description = "";
    const embed = new EmbedBuilder()
      .setTitle("Music Queue")
      .setColor("#FF0000");
    if (lastInteraction) {
      embed.setFooter({
        text: "Last interaction by " + lastInteraction.displayName,
        iconURL: lastInteraction.user.displayAvatarURL({
          format: "png",
          dynamic: true,
          size: 1024,
        }),
      });
    }
    if (this.currentSong) {
      const joinedSongs = [this.currentSong].concat(this.songs);
      for (var x = 0; x < joinedSongs.length; x++) {
        const song = joinedSongs[x];
        let str = "";
        if (song.name === this.currentSong.name) {
          str += bold(`→ ${x + 1}.`);
        } else {
          str += `${x + 1}.`;
        }
        str += ` [${song.name}](${song.url})\n`;
        if (description.length + str.length > 4080) {
          description += "...";
          break;
        } else description += str;
      }
      embed.setDescription(description);
    }
    if (this.resource) {
      const volume = this.resource.volume;
      embed.addFields([
        {
          name: "Volume:",
          value:
            (volume && volume != null
              ? (volume.volume * 100).toString()
              : "100") + "%",
        },
      ]);
    }
    const row = new ActionRowBuilder().addComponents(
      shouldAddPause == true
        ? new ButtonBuilder()
            .setCustomId("pause")
            .setLabel("⏸️ ")
            .setStyle(ButtonStyle.Primary)
        : new ButtonBuilder()
            .setCustomId("resume")
            .setLabel("▶️")
            .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("skip")
        .setLabel("Skip")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("volup")
        .setLabel("🔊")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("voldown")
        .setLabel("🔉")
        .setStyle(ButtonStyle.Secondary)
    );

    return {
      embeds: [embed],
      components: [row],
    };
  }
}

module.exports = { SongQueue };

function bold(string) {
  return "**" + string + "**";
}
