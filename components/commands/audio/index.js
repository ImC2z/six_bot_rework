require('dotenv').config();
const fs = require(`fs`);
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, AudioPlayerStatus, VoiceConnectionStatus } = require(`@discordjs/voice`);
const ytdl = require("@distube/ytdl-core");
// const ytdl = require("ytdl-core");
const play = require(`play-dl`);
const ytSearch = require(`../../../api/ytSearch`);
const loadPlaylist = require('../../../api/loadPlaylist');
const getVidDetails = require('../../../api/getVidDetails');
const { EmbedBuilder, CommandInteraction, VoiceChannel } = require('discord.js');

const cookies = [
    { name: "cookie1", value: process.env.YTcookies }
];

const agent = ytdl.createAgent(cookies);

const videoPrefixes = [
    `https://youtu.be/`,
    `https://www.youtube.com/watch?v=`
];

/**
 * Checks whether query string is a type of YT video URL.
 * @param {string} query User-inputted search query / URL
 * @returns {boolean} True if yes, otherwise no
 */
function isVideoPrefix(query) {
    return videoPrefixes.some(prefix => query.startsWith(prefix));
}

/**
 * Extracts the video ID from a YT video URL.
 * @param {string} query YouTube video link
 * @returns {string} ID of video
 * @throws Will throw error if URL is invalid (no ID is found)
 */
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

/**
 * Checks whether query string is a type of YT playlist URL.
 * @param {string} query User-inputted search query / URL
 * @returns {boolean} True if yes, otherwise false
 */
function isPlaylistPrefix(query) {
    return playlistPrefixes.some(prefix => query.startsWith(prefix));
}

/**
 * Extracts the playlist ID from a YT playlist URL.
 * @param {string} query YouTube playlist link
 * @returns {string} ID of playlist
 * @throws Will throw error if URL is invalid (no ID is found)
 */
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

/**
 * Orders program to halt/pause for specified number of milliseconds.
 * @param {number} ms Time to pause for
 * @returns
 */
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * Fisher-Yates shuffle algorithm.
 * @param {any[]} array Array of items to be shuffled
 * @returns {any[]} Shuffled array
 */
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

/**
 * Voice channel module that broadcasts YT audio.
 */
class AudioModule {
    /**
     * @param {Object} moduleInfo
     * @param {Client} moduleInfo.client Bot client
     * @param {string} moduleInfo.messageRoomId Default text message channel id
     */
    constructor({client, messageRoomId}) {
        this.client = client;
        this.messageRoomId = messageRoomId;
        this.voiceConnection = undefined;
        this.connectionChannel = undefined;
        this.constructAudioPlayer();
        this.current = undefined;
        this.queue = [];
        this.loopMode = LoopMode.None;
        this.trackedVoiceChannels = JSON.parse(fs.readFileSync(`./data/tracked_voice_channels.json`, `utf8`));
    }

    /**
     * On module intialization, creates a new Audio Player for the bot to use.
     */
    constructAudioPlayer() {
        this.audioPlayer = createAudioPlayer();
        this.audioPlayer.on('error', async (err) => {
            const errorUrl = this.current ? this.current.url : ``;
            console.error(`Error: ${errorUrl} (${err.message})`);
            console.log(err);
            // console.log("!!!!! Error event emitted (2)");
            const messageChannel = await this.client.channels.fetch(this.messageRoomId);
            await messageChannel.send(`AudioPlayer Error. Skipping ${errorUrl}...`);
        });
        this.audioPlayer.on(AudioPlayerStatus.Idle, async () => {
            // console.log("!!!!! Idle event emitted (1)");
            this.playingStatus = false;
            this.processQueue();
        });
        this.playingStatus = false;
    } 

    /**
     * Calls command functionality acccording to user request.
     * @param {CommandInteraction} interaction Command sent by user
     */
    async processCommands(interaction) {
        let putInFront = false;
        const shouldReply = true;
        switch(interaction.commandName) {
            case `vc`: await this.join(interaction, shouldReply); break;
            case `dc`: await this.leave(interaction, shouldReply); break;
            case `pt`: putInFront = true;
            case `p`: {
                await this.play(interaction, putInFront);
                break;
            }
            case `s`: await this.skip(interaction, shouldReply); break;
            case `clear`: await this.clear(interaction, shouldReply); break;
            case `loop`: await this.loop(interaction, shouldReply); break;
            case `q`: await this.displayQueue(interaction); break;
            case `sh`: await this.shuffleQueue(interaction); break;
            case `rm`: await this.removeFromQueue(interaction); break;
            case `go`: await this.remoteJoin(interaction); break;
            case `inform`: await this.informRole(interaction); break;
            case `uninformall`: await this.uninformAllRoles(interaction); break;
            case `migrate`: await this.migrate(interaction); break;
        }
    }

    /**
     * Attempts to join a specified voice channel.
     * @param {CommandInteraction} interaction Command sent by user
     * @param {boolean} shouldReply Whether the bot should reply to the interaction
     */
    async join(interaction, shouldReply) {
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

    /**
     * Handles bot's attempt to join channel and records channel info.
     * @param {VoiceChannel} channel 
     */
    handleJoin(channel) {
        if (!!this.voiceConnection) {
            this.voiceConnection.destroy();
        }
        this.voiceConnection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guildId,
            adapterCreator: channel.guild.voiceAdapterCreator
        });
        this.connectionChannel = channel;
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
                await this.leave(null, false);
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

    /**
     * Leaves the current voice channel if any, destroys connection and resets module properties.
     * @param {CommandInteraction} interaction Command sent by user
     * @param {boolean} shouldReply Whether the bot should reply to the interaction
     */
    async leave(interaction, shouldReply) {
        if (!!this.voiceConnection) {
            this.current = undefined;
            this.voiceConnection.destroy();
            delete this.voiceConnection;
            this.connectionChannel = undefined;
            await this.clear(null, false);
            await this.loop(null, false); // disable loop
            this.audioPlayer.stop(true); // triggers processQueue() via Idle state
            if (shouldReply) {
                await interaction.reply(`cya`);
            }
        } else if (shouldReply) {
            await interaction.reply(`No active voice connection found`);
        }
    }

    /**
     * Triggers every time the player reaches Idle state, and checks for next action accordingly.
     */
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
                const resource = createAudioResource(
                    ytdl(
                        this.current.url,
                        {
                            filter: 'audioonly',
                            quality: 'highestaudio',
                            highWaterMark: 1<<30,
                            agent: agent,
                            // opusEncoded: true,
                            // requestOptions: {
                            //     headers: {
                            //         cookie: process.env.YTcookies
                            //     }
                            // }
                        }
                    ), {
                        inlineVolume: true
                    }
                );
                // resource.volume.setVolume(0.08); // to save users' ears during normal convos
                // console.log(resource);
                this.audioPlayer.play(resource);
                this.playingStatus = true;
            }
        }
    }

    /**
     * Automatically attempts to join user's voice channel if current connection is undefined.
     * @param {CommandInteraction} interaction Command sent by user
     * @param {Function} callback Original play instruction
     */
    async shortcutJoin(interaction, callback) {
        await this.join(interaction, false);
        if (!!this.voiceConnection) {
            callback();
        } else {
            await interaction.reply(`Failed to join. (caller not in a voice channel)`);
        }
    }

    /**
     * Takes a user's video/playlist request and adds it appropriately to the queue, with option to shuffle.
     * @param {CommandInteraction} interaction Command sent by user
     * @param {boolean} putInFront Whether to prioritize video item(s) to front of queue
     */
    async play(interaction, putInFront) {
        if (!this.voiceConnection) {
            await this.shortcutJoin(interaction, async () => await this.play(interaction, putInFront));
        } else {
            const query = interaction.options.getString(`query`);
            const resultType = interaction.options.getString(`type`) || `video,playlist`;
            const optShuffle = interaction.options.getBoolean(`shuffle`) || false;
            if (!!query) {
                if (isVideoPrefix(query)) {
                    await this.addVideo(interaction, getVideoId(query), putInFront, optShuffle)
                    .catch(async (err) => await interaction.reply(err));
                } else if (isPlaylistPrefix(query)) {
                    await this.addPlaylist(interaction, getPlaylistId(query), putInFront, optShuffle)
                    .catch(async (err) => await interaction.reply(err));
                } else {
                    await ytSearch({query, resultType})
                    .then(async (id) => {
                        if (id.kind === `youtube#video`) { // is video
                            await this.addVideo(interaction, id.videoId, putInFront, optShuffle);
                        } else { // is playlist
                            await this.addPlaylist(interaction, id.playlistId, putInFront, optShuffle);
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
                await this.togglePause(interaction);
            }
        }
    }

    /**
     * Toggles pause status of Audio Player.
     * @param {CommandInteraction} interaction Command sent by user
     */
    async togglePause(interaction) {
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

    /**
     * Adds the video info to the queue.
     * @param {CommandInteraction} interaction Command sent by user
     * @param {string} id Video ID
     * @param {boolean} putInFront Whether to prioritize item to front of queue
     * @param {boolean} optShuffle Whether to shuffle the queue after adding item
     */
    async addVideo(interaction, id, putInFront, optShuffle) {
        try {
            await interaction.deferReply();
            const videoData = await getVidDetails(id);
            this.queue = putInFront ? [videoData, ...this.queue] : [...this.queue, videoData];
            if (optShuffle) {
                this.queue = shuffle(this.queue);
            }
            await interaction.editReply({
                content: `${optShuffle ? `(Shuffled) `: ``}Video loaded: ${videoData.url}`, 
                embeds: optShuffle ? [this.createQueueEmbed(1)] : []
            });
        } catch (err) {
            console.log(err);
            if (err === `getVidDetails.js: Video not found` || err.rawError.message !== `Unknown interaction`) {
                await interaction.editReply(`Video retrieval failed`);
            }
        }
    }

    /**
     * Adds info of all videos in playlist to the queue.
     * @param {CommandInteraction} interaction Command sent by user
     * @param {string} id Playlist ID
     * @param {boolean} putInFront  Whether to prioritize items to front of queue
     * @param {boolean} optShuffle Whether to shuffle the queue after adding items
     */
    async addPlaylist(interaction, id, putInFront, optShuffle) {
        try {
            await interaction.deferReply();
            const videosData = loadPlaylist(id);
            this.queue = putInFront ? [...videosData, ...this.queue] : [...this.queue, ...videosData];
            if (optShuffle) {
                this.queue = shuffle(this.queue);
            }
            await interaction.editReply({
                content: `${optShuffle ? `(Shuffled) `: ``}Playlist loaded: ${playlistPrefixes[0]}${id}`, 
                embeds: optShuffle ? [this.createQueueEmbed(1)] : []
            });
        } catch (err) {
            console.log(err);
            if (!err.rawError || err.rawError.message !== `Unknown interaction`) {
                await interaction.editReply(`Playlist retrieval failed`);
            }
        }
    }

    /**
     * Skips the specified number of video items, currently playing and into the queue. 
     * @param {CommandInteraction} interaction Command sent by user
     * @param {boolean} shouldReply Whether the bot should reply to the interaction
     */
    async skip(interaction, shouldReply) {
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

    /**
     * Resets the player queue to an empty array.
     * @param {CommandInteraction} interaction Command sent by user
     * @param {boolean} shouldReply Whether the bot should reply to the interaction
     */
    async clear(interaction, shouldReply) {
        this.queue = [];
        if (shouldReply) {
            await interaction.reply(`Queue cleared.`);
        }
    }

    /**
     * Switches the current queue loop mode according to user choice.
     * @param {CommandInteraction} interaction Command sent by user
     * @param {boolean} shouldReply Whether the bot should reply to the interaction
     */
    async loop(interaction, shouldReply) {
        this.loopMode = !!interaction ? interaction.options.getString(`mode`) : LoopMode.None; // disable loop if interaction not provided
        if (shouldReply) {
            switch(this.loopMode) {
                case LoopMode.None: await interaction.reply(`Loop disabled.`); break;
                case LoopMode.One: await interaction.reply(`Looping 1 only.`); break;
                case LoopMode.All: await interaction.reply(`Looping whole playlist.`); break;
            }
        }
    }

    /**
     * Creates a list of queue video items including hyperlinks.
     * @param {number} startIndex The queue item index from which to start displaying, max 20 displayed.
     * @returns {EmbedBuilder} Constructed embed, ready to be sent to a text channel
     */
    createQueueEmbed(startIndex) {
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

    /**
     * Replies to user interaction w/ the constructed queue embed.
     * @param {CommandInteraction} interaction Command sent by user
     */
    async displayQueue(interaction) {
        const startIndex = interaction.options.getInteger(`start`) || 1;
        await interaction.reply({embeds: [this.createQueueEmbed(startIndex)]});
    }

    /**
     * Shuffles the player queue with the Fisher-Yates algorithm.
     * @param {CommandInteraction} interaction Command sent by user
     */
    async shuffleQueue(interaction) {
        this.queue = shuffle(this.queue);
        await interaction.reply({content: `Shuffled queue.`, embeds: [this.createQueueEmbed(1)]});
    }

    /**
     * Removes specified items and/or ranges of items from the player queue.
     * @param {CommandInteraction} interaction Command sent by user
     */
    async removeFromQueue(interaction) {
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
        await interaction.reply(`${removeCount}${this.current === null ? ` + 1 current` : ``} video(s) removed from queue.`);
    }

    /**
     * Orders the bot to join a target voice channel w/o the need for the user to be in one.
     * @param {CommandInteraction} interaction Command sent by user
     */
    async remoteJoin(interaction) {
        const targetChannel = interaction.options.getChannel(`channel`);
        this.handleJoin(targetChannel);
        await interaction.reply(`remote hello @ \`${targetChannel.name}\``);    
    }

    /**
     * Adds a local tracking entry to monitor voice channel activity for a single role, informing role-users upon first user joining.
     * Can be stacked by users to inform multiple roles.
     * @param {CommandInteraction} interaction Command sent by user
     */
    async informRole(interaction) {
        const voiceChannel = interaction.options.getChannel(`voice`);
        const {name: voiceName, id: voiceId, guild} = voiceChannel;
        const {name: roleName, id: roleId} = interaction.options.getRole(`role`);
        const {name: textName, id: textId} = interaction.options.getChannel(`text`);
        const {name: guildName, id: guildId} = guild;
        if (!this.trackedVoiceChannels[guildId]) {
            this.trackedVoiceChannels[guildId] = {
                guildName,
                voiceChannels: {
                    [voiceId]: {
                        voiceName,
                        text: {textName, textId},
                        roles: {
                            [roleId]: roleName
                        }
                    }
                }
            };
        } else {
            if (!this.trackedVoiceChannels[guildId].voiceChannels[voiceId]) {
                this.trackedVoiceChannels[guildId].voiceChannels[voiceId] = {
                    voiceName,
                    text: {textName, textId},
                    roles: {
                        [roleId]: roleName
                    }
                };
            } else {
                this.trackedVoiceChannels[guildId].voiceChannels[voiceId].roles[roleId] = roleName;
                this.trackedVoiceChannels[guildId].voiceChannels[voiceId].text = {textName, textId};
            }
        }
        fs.writeFileSync(`./data/tracked_voice_channels.json`, JSON.stringify(this.trackedVoiceChannels, null, `\t`));
        const rolesCount = Object.keys(this.trackedVoiceChannels[guildId].voiceChannels[voiceId].roles).length;
        await interaction.reply(`Tracking \`${voiceName}\` activity @ \`${textName}\` for ${rolesCount} role(s).`);
    }

    /**
     * Removes tracking for specified voice channel regarding all roles.
     * @param {CommandInteraction} interaction Command sent by user
     */
    async uninformAllRoles(interaction) {
        const {name: voiceName, id: voiceId, guildId} = interaction.options.getChannel(`voice`);
        if (!!this.trackedVoiceChannels[guildId].voiceChannels[voiceId]) {
            delete this.trackedVoiceChannels[guildId].voiceChannels[voiceId];
            fs.writeFileSync(`./data/tracked_voice_channels.json`, JSON.stringify(this.trackedVoiceChannels, null, `\t`));
            await interaction.reply(`Untracked \`${voiceName}\` activity for all roles.`);
        } else {
            await interaction.reply(`No changes made.`);
        }
    }

    /**
     * Moves all users from bot's voice channel to another target channel.
     * @param {CommandInteraction} interaction Command sent by user
     */
    async migrate(interaction) {
        const targetChannel = interaction.options.getChannel(`destination`);
        if (!!this.connectionChannel && this.connectionChannel.guildId === targetChannel.guildId && 
                this.connectionChannel.id !== targetChannel.id) {
            const members = this.connectionChannel.members.map(a => a).filter(member => member.id !== this.client.user.id);
            this.handleJoin(targetChannel);
            for (const member of members) {
                member.voice.setChannel(targetChannel);
            }
            await interaction.reply(`Migrated ${members.length} users into \`${targetChannel.name}\`.`);
        } else {
            await interaction.reply(`Unable to migrate voice channels.`)
        }
    }

    /**
     * Module close handler.
     */
    async close() {
        await this.leave(null, false);
    }
}

module.exports = AudioModule