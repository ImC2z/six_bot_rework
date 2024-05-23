const { EmbedBuilder, GuildScheduledEventStatus } = require(`discord.js`);

class ScheduledEvents {
    constructor({client, audioModule}) {
        this.client = client;
        this.audioModule = audioModule;
    }

    onReady() {
        setInterval(async () => await this.checkForEvent(), 30_000);
    }

    async onEventCreate(guildEvent) {
        const trackedGuilds = this.audioModule.trackedVoiceChannels;
        const {channel, scheduledStartAt, name, description, guildId} = guildEvent;
        if (!!trackedGuilds[guildId] && !!trackedGuilds[guildId].voiceChannels[channel.id]) {
            const {roles, text} = trackedGuilds[guildId].voiceChannels[channel.id];
            const embed = new EmbedBuilder()
            .setColor([255, 247, 0]) // #fff800
            .setTitle(name)
            .setImage(guildEvent.coverImageURL({size: 512, extension: `jpg`}))
            .setDescription(!!description ? description : null);
            const textChannel = await this.client.channels.fetch(text.textId);
            await textChannel.send({
                content: `${Object.keys(roles).map(role => `<@&${role}>`).join(` `)} VC Event created at \`${channel.name}\`, starting at ${scheduledStartAt}.`,
                embeds: [embed]
            });
        }
    }

    async checkForEvent() {
        const now = new Date();
        for (const guildId of Object.keys(this.audioModule.trackedVoiceChannels)) {
            const {voiceChannels} = this.audioModule.trackedVoiceChannels[guildId];
            const guild = await this.client.guilds.fetch(guildId);
            const {scheduledEvents} = guild;
            for (const event of scheduledEvents.cache.values()) {
                if (!!event.channelId && !!voiceChannels[event.channelId] && now >= event.scheduledStartAt && event.isScheduled()) {
                    event.setStatus(GuildScheduledEventStatus.Active);
                    const {voiceName, text, roles} = voiceChannels[event.channelId];
                    const textChannel = await this.client.channels.fetch(text.textId);
                    await textChannel.send(`${Object.keys(roles).map(role => `<@&${role}>`).join(` `)} VC Event started at \`${voiceName}\`.`)
                }
            }
        }
    }
}

module.exports = ScheduledEvents;