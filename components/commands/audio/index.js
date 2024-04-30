require('dotenv').config();
const fs = require(`fs`);
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, AudioPlayerStatus, VoiceConnectionStatus } = require(`@discordjs/voice`);
const ytdl = require("@distube/ytdl-core");
const play = require(`play-dl`);
const ytSearch = require(`../../../api/ytSearch`);
const loadPlaylist = require('../../../api/loadPlaylist');
const getVidDetails = require('../../../api/getVidDetails');
const { EmbedBuilder } = require('discord.js');

const cookies = [
    { name: "cookie1", value: process.env.YTcookies }
];

const agent = ytdl.createAgent(cookies);

// play.setToken({
//     youtube: {
//         cookie: process.env.YTcookies
//     }
// });

const videoPrefixes = [
    `https://youtu.be/`,
    `https://www.youtube.com/watch?v=`
];

function isVideoPrefix(query) {
    return videoPrefixes.some(prefix => query.startsWith(prefix));
}

function getVideoId(query) {
    const vidIdExtract = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ok = vidIdExtract.exec(query);
    if (ok) {
        return ok[1];
    } else {
        throw `Video RegEx fail: no id found`;
    }
}

const playlistPrefixes = [
    `https://www.youtube.com/playlist?list=`,
    `https://youtube.com/playlist?list=`
];

function isPlaylistPrefix(query) {
    return playlistPrefixes.some(prefix => query.startsWith(prefix));
}

function getPlaylistId(query) {
    const playlistIdExtract = /^.*(?:youtu.be\/|list=)([^#\&\?]+).*/;
    const ok = playlistIdExtract.exec(query);
    if (ok) {
        return ok[1];
    } else {
        throw `Playlist RegEx fail: no id found`;
    }
}

const LoopMode = {
    "None": "none",
    "One": "one",
    "All": "all"
};

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
}

class AudioModule {
    constructor({client, messageRoomId}) {
        this.client = client;
        this.messageRoomId = messageRoomId;
        this.voiceConnection = undefined;
        this.constructAudioPlayer();
        this.current = undefined;
        this.queue = [];
        this.loopMode = LoopMode.None;
        this.trackedVoiceChannels = JSON.parse(fs.readFileSync(`./data/tracked_voice_channels.json`, `utf8`));
    }

    constructAudioPlayer() {
        this.audioPlayer = createAudioPlayer();
        this.audioPlayer.on('error', async (err) => {
            const errorUrl = this.current ? this.current.url : ``;
            console.error(`Error: ${errorUrl} (${err.message})`);
            // console.log("!!!!! Error event emitted (2)");
            const messageChannel = await this.client.channels.fetch(this.messageRoomId);
            await messageChannel.send(`AudioPlayer Error. Skipping ${errorUrl}...`);
            // await this.skip({interaction: null, shouldReply: false});
            // await this.leave({interaction: null, shouldReply: false});
        });
        this.audioPlayer.on(AudioPlayerStatus.Idle, async () => {
            // console.log("!!!!! Idle event emitted (1)");
            this.playingStatus = false;
            this.processQueue();
        });
        this.playingStatus = false;
    } 

    async processCommands(interaction) {
        let putInFront = false;
        const shouldReply = true;
        switch(interaction.commandName) {
            case `vc`: await this.join({interaction, shouldReply}); break;
            case `dc`: await this.leave({interaction, shouldReply}); break;
            case `pt`: putInFront = true;
            case `p`: {
                await this.play({interaction, putInFront});
                break;
            }
            case `s`: await this.skip({interaction, shouldReply}); break;
            case `clear`: await this.clear({interaction, shouldReply}); break;
            case `loop`: await this.loop({interaction, shouldReply}); break;
            case `q`: await this.displayQueue({interaction}); break;
            case `sh`: await this.shuffleQueue({interaction}); break;
            case `rm`: await this.removeFromQueue({interaction}); break;
            case `go`: await this.remoteJoin({interaction}); break;
            case `inform`: await this.informRole({interaction}); break;
            case `uninformall`: await this.uninformAllRoles({interaction}); break;
        }
    }

    async join({interaction, shouldReply}) {
        const targetChannel = interaction.member.voice.channel;
        if (!!targetChannel) {
            this.handleJoin(targetChannel);
            if (shouldReply) {
                await interaction.reply(`hello @ \`${targetChannel.name}\``);
            }
        } else if (shouldReply) {
            await interaction.reply(`Failed to join a voice channel`);
        }
    }

    handleJoin(channel) {
        this.voiceConnection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guildId,
            adapterCreator: channel.guild.voiceAdapterCreator
        });
        this.voiceConnection.subscribe(this.audioPlayer);
        this.voiceConnection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
            try {
                await Promise.race([
                    entersState(this.voiceConnection, VoiceConnectionStatus.Signalling, 10_000),
                    entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 10_000),
                ]);
                // Seems to be reconnecting to a new channel - ignore disconnect
            } catch (err) {
                // Seems to be a real disconnect which SHOULDN'T be recovered from
                console.log(`Disconnected`);
                await this.leave({interaction: null, shouldReply: false});
            }
        });
        this.voiceConnection.on("error", async (err) => {
            console.log(`Voice Connection Error:`);
            console.log(err);
            if (!!this.voiceConnection) {
                while (this.voiceConnection && !this.voiceConnection.disconnect()) {
                    await sleep(5000);   
                }
                // leave handled by voiceConnection.on(Disconnected)
            }
        });
    }

    async leave({interaction, shouldReply}) {
        if (!!this.voiceConnection) {
            this.current = undefined;
            this.voiceConnection.destroy();
            delete this.voiceConnection;
            // console.log(this.voiceConnection);
            this.clear({interaction: null, shouldReply: false});
            this.loop({interaction: null, shouldReply: false}); // disable loop
            this.audioPlayer.stop(true); // triggers processQueue() via Idle state
            if (shouldReply) {
                await interaction.reply(`cya`);
            }
        } else if (shouldReply) {
            await interaction.reply(`No active voice connection found`);
        }
    }

    processQueue() {
        if (!this.playingStatus) { // dont interrupt current videos
            switch (this.loopMode) {
                case LoopMode.One: {
                    if (!this.current) {
                        this.current = this.queue.shift();
                    }
                    break;
                }
                case LoopMode.All: {
                    if (!!this.current) {
                        this.queue.push(this.current);
                    }
                }
                case LoopMode.None: {
                    this.current = this.queue.shift();
                }
            }
            if (!!this.current) {
                this.audioPlayer.play(createAudioResource(ytdl(
                    this.current.url,
                    {
                        filter: 'audioonly',
                        quality: 'highestaudio',
                        highWaterMark: 1<<62,
                        agent: agent,
                        // opusEncoded: true,
                        // encoderArgs: ['-af', `bass=g=${this.current.b},treble=g=${this.current.t}`],
                        // requestOptions: {
                        //     headers: {
                        //         cookie: process.env.YTcookies
                        //     }
                        // }
                    }
                )));
                this.playingStatus = true;
            }
        }
    }

    async shortcutJoin({interaction, callback}) {
        await this.join({interaction, shouldReply: false});
        if (!!this.voiceConnection) {
            callback();
        } else {
            await interaction.reply(`Failed to join a voice channel`);
        }
    }

    async play({interaction, putInFront}) {
        if (!this.voiceConnection) {
            await this.shortcutJoin({
                interaction, 
                callback: async () => await this.play({interaction, putInFront})
            });
        } else {
            const query = interaction.options.getString(`query`);
            const resultType = interaction.options.getString(`type`) || `video,playlist`;
            const optShuffle = interaction.options.getBoolean(`shuffle`) || false;
            if (!!query) {
                if (isVideoPrefix(query)) {
                    await this.addVideo({interaction, id: getVideoId(query), putInFront, optShuffle})
                    .catch(async (err) => await interaction.reply(err));
                } else if (isPlaylistPrefix(query)) {
                    await this.addPlaylist({interaction, id: getPlaylistId(query), putInFront, optShuffle})
                    .catch(async (err) => await interaction.reply(err));
                } else {
                    await ytSearch({query, resultType})
                    .then(async (id) => {
                        if (id.kind === `youtube#video`) { // is video
                            await this.addVideo({interaction, id: id.videoId, putInFront, optShuffle});
                        } else { // is playlist
                            await this.addPlaylist({interaction, id: id.playlistId, putInFront, optShuffle});
                        }
                    })
                    .catch(async (err) => {
                        console.log(err);
                        await interaction.reply(err)
                    });
                }
                this.processQueue();
                // console.log(this.current)
            } else {
                await this.togglePause({interaction});
            }
        }
    }

    async togglePause({interaction}) {
        const pauseSuccess = this.audioPlayer.pause(true);
        if (pauseSuccess) {
            await interaction.reply(`Paused.`);
        } else {
            const unpauseSuccess = this.audioPlayer.unpause();
            // console.log(this.current);
            if (unpauseSuccess) {
                await interaction.reply(`Unpaused.`);
            } else {
                await interaction.reply(`No resource playing.`);
            }
        }
    }

    async addVideo({interaction, id, putInFront, optShuffle}) {
        try {
            await interaction.deferReply();
            const videoData = await getVidDetails(id);
            this.queue = putInFront ? [videoData, ...this.queue] : [...this.queue, videoData];
            if (optShuffle) {
                this.queue = shuffle(this.queue);
            }
            await interaction.editReply({
                content: `${optShuffle ? `(Shuffled) `: ``}Video loaded: ${videoData.url}`, 
                embeds: optShuffle ? [this.createQueueEmbed({startIndex: 1})] : []
            });
        } catch (err) {
            console.log(err);
            if (err === `getVidDetails.js: Video not found` || err.rawError.message !== `Unknown interaction`) {
                await interaction.editReply(`Video retrieval failed`);
            }
        }
    }

    async addPlaylist({interaction, id, putInFront, optShuffle}) {
        try {
            await interaction.deferReply();
            const videosData = await loadPlaylist(id);
            this.queue = putInFront ? [...videosData, ...this.queue] : [...this.queue, ...videosData];
            if (optShuffle) {
                this.queue = shuffle(this.queue);
            }
            await interaction.editReply({
                content: `${optShuffle ? `(Shuffled) `: ``}Playlist loaded: ${playlistPrefixes[0]}${id}`, 
                embeds: optShuffle ? [this.createQueueEmbed({startIndex: 1})] : []
            });
        } catch (err) {
            console.log(err);
            if (!err.rawError || err.rawError.message !== `Unknown interaction`) {
                await interaction.editReply(`Playlist retrieval failed`);
            }
        }
    }

    async skip({interaction, shouldReply}) {
        const skipTo = (!!interaction && interaction.options.getInteger(`to`)) || 1;
        if (this.playingStatus) {
            if (this.loopMode === LoopMode.One && shouldReply) {
                // do nothing
                await interaction.reply(`Skipped to: \`${this.current.title}\` (replay)`);
            } else {
                const skippedList = [this.current, ...this.queue.slice(0, skipTo - 1)]; // this.current is always skipped
                this.queue.splice(0, skippedList.length - 1); // -1 as this.current doesnt belong in this.queue yet is counted in skippedList
                this.current = skippedList[skippedList.length - 1]; // set this.current = last item of skippedList for processQueue() to shift
                if (this.loopMode === LoopMode.All) {
                    this.queue = [...this.queue, ...skippedList.slice(0, skippedList.length - 1)];
                }
                const next = this.queue[0] || (this.loopMode === LoopMode.All && this.current);
                if (shouldReply) {
                    if (!!next) {
                        await interaction.reply(`Skipped to: \`${next.title}\``);
                    } else {
                        await interaction.reply(`Skipped all.`)
                    }
                }
            }
            this.audioPlayer.stop(true);
        } else if (shouldReply) {
            await interaction.reply(`Nothing to skip.`);
        }
    }

    async clear({interaction, shouldReply}) {
        this.queue = [];
        if (shouldReply) {
            await interaction.reply(`Queue cleared.`);
        }
    }

    async loop({interaction, shouldReply}) {
        this.loopMode = !!interaction ? interaction.options.getString(`mode`) : LoopMode.None; // disable loop if interaction not provided
        if (shouldReply) {
            switch(this.loopMode) {
                case LoopMode.None: await interaction.reply(`Loop disabled.`); break;
                case LoopMode.One: await interaction.reply(`Looping 1 only.`); break;
                case LoopMode.All: await interaction.reply(`Looping whole playlist.`); break;
            }
        }
    }

    createQueueEmbed({startIndex}) {
        const displayCount = this.queue.length - startIndex + 1;
        return new EmbedBuilder()
        .setColor([255, 247, 0]) // #fff800
        // .setTitle(`Queue`)
        .addFields(
            ...!!this.current ? [{
                name: `Now playing`,
                value: `[${this.current.title}](${this.current.url})`
            }] : [],
            ...displayCount > 0 ? [{
                name: `Queue`,
                value: this.queue.map((vidData, index) => `${index + 1}. [${vidData.title}](${vidData.url})\n`)
                        .filter((_, index) => startIndex - 1 <= index)
                        .slice(0, 10)
                        .join(``)
            }] : [],
            ...displayCount > 10 ? [{
                name: `​`,
                value: this.queue.map((vidData, index) => `${index + 1}. [${vidData.title}](${vidData.url})\n`)
                        .filter((_, index) => startIndex - 1 <= index)
                        .slice(10, 20)
                        .join(``)
            }] : [],
            {
                name: `​`, 
                value: `*(${this.queue.length} video${this.queue.length !== 1 ? `s`: ``} in queue); looping ${this.loopMode}*`
            }
        );
    }

    async displayQueue({interaction}) {
        const startIndex = interaction.options.getInteger(`start`) || 1;
        // const queueMessage = 
        //         (!!this.current ? `Now playing: \`${this.current.title}\`\n` : ``) + 
        //         this.queue.map((vidData, index) => `${index + 1}. \`${vidData.title}\`\n`)
        //         .filter((_, index) => startIndex - 1 <= index)
        //         .slice(0, 20)
        //         .join(``) + 
        //         `*(${this.queue.length} video${this.queue.length !== 1 ? `s`: ``} in queue); looping ${this.loopMode}*`;
        // await interaction.reply(queueMessage);
        await interaction.reply({embeds: [this.createQueueEmbed({startIndex})]});
    }

    async shuffleQueue({interaction}) {
        this.queue = shuffle(this.queue);
        await interaction.reply({content: `Shuffled queue.`, embeds: [this.createQueueEmbed({startIndex: 1})]});
    }

    async removeFromQueue({interaction}) {
        const iterateNums = (x, y) => x < y ? Array(y-x+1).fill(x).map((curr, i) => curr + i) : Array(x-y+1).fill(y).map((curr, i) => curr + i);
        // create array range from 2 ints: iterateNums(1, 3) -> [1,2,3]
        let removeCount = 0;
        const removals = interaction.options.getString(`removals`).match(/(\d+(?:-\d+)?)/g);
        // console.log(removals);
        if (!!removals) {
            removals.forEach(removal => {
                if (!isNaN(removal) && parseInt(removal) <= this.queue.length) {
                    if (parseInt(removal) === 0) {
                        if (!!this.current) {
                            this.current = null;
                        }
                    } else {
                        this.queue.splice(parseInt(removal)-1, 1, null); // replace target with null
                        removeCount++;
                    }
                } else if (removal.includes(`-`)) {
                    const indices = removal.split(`-`);
                    const fullRange = iterateNums(...indices.map(pos => parseInt(pos)));
                    fullRange.forEach(pos => {
                        if (pos <= this.queue.length) {
                            if (pos === 0) {
                                if (!!this.current) {
                                    this.current = null;
                                }
                            } else {
                                this.queue.splice(pos-1, 1 , null); // replace target with null
                                removeCount++;
                            }
                        }
                    });
                }
            });
        }
        this.queue = this.queue.filter(x => !!x); // remove all null
        if (this.current === null) {
            this.audioPlayer.stop();
        }
        await interaction.reply(/* {content:  */`${removeCount}${this.current === null ? ` + 1 current` : ``} video(s) removed from queue.`/* , 
                embeds: [this.createQueueEmbed({startIndex: 1})]} */);
    }

    async remoteJoin({interaction}) {
        const targetChannel = interaction.options.getChannel(`channel`);
        this.handleJoin(targetChannel);
        await interaction.reply(`remote hello @ \`${targetChannel.name}\``);    
    }

    async informRole({interaction}) {
        const voiceChannel = interaction.options.getChannel(`voice`);
        const {name: voiceName, id: voiceId} = voiceChannel;
        const {name: roleName, id: roleId} = interaction.options.getRole(`role`);
        const {name: textName, id: textId} = interaction.options.getChannel(`text`) || interaction.channel;
        if (!this.trackedVoiceChannels[voiceId]) {
            this.trackedVoiceChannels[voiceId] = {
                guild: voiceChannel.guild.name,
                voice: {voiceName, voiceId},
                text: {textName, textId},
                roles: [{roleName, roleId}]
            }
        } else {
            if (!this.trackedVoiceChannels[voiceId].roles.some(roleInfo => roleInfo.roleId === roleId)) {
                this.trackedVoiceChannels[voiceId].roles.push({roleName, roleId});
            }
            this.trackedVoiceChannels[voiceId].text = {textName, textId} // override old channel
        }
        fs.writeFileSync(`./data/tracked_voice_channels.json`, JSON.stringify(this.trackedVoiceChannels, null, `\t`));
        await interaction.reply(`Tracking \`${voiceName}\` activity @ \`${textName}\` for ${this.trackedVoiceChannels[voiceId].roles.length} role(s).`)
    }

    async uninformAllRoles({interaction}) {
        const {name: voiceName, id: voiceId} = interaction.options.getChannel(`voice`);
        if (!!this.trackedVoiceChannels[voiceId]) {
            delete this.trackedVoiceChannels[voiceId];
            await interaction.reply(`Untracked \`${voiceName}\` activity for all roles.`);
        } else {
            await interaction.reply(`No changes made.`);
        }
    }

    async close() {
        await this.leave({interaction: null, shouldReply: false});
    }
}

module.exports = AudioModule