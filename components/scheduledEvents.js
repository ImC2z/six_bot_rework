const { EmbedBuilder, GuildScheduledEventStatus, GuildScheduledEvent } = require(`discord.js`);
const AudioModule = require("./commands/audio");

/**
 * Server events module that periodically checks if any event has begun, informing users if so.
 */
class ScheduledEvents {
    /**
     * @param {Client} client Bot client
     * @param {AudioModule} audioModule Audio Module object defined from Interactions
     */
    constructor(client, audioModule) {
        this.client = client;
        this.audioModule = audioModule;
        this.onEventCreate = this.onEventCreate.bind(this);
        this.checkForEvent = this.checkForEvent.bind(this);
    }

    /**
     * Begins checking for freshly started events every 30s.
     */
    onReady() {
        setInterval(this.checkForEvent, 30_000);
    }

    /**
     * Event handler that informs relevant users about voice channel event creation if channel is tracked.
     * @param {GuildScheduledEvent} guildEvent Newly created guild event
     */
    async onEventCreate(guildEvent) {
        const trackedGuilds = this.audioModule.trackedVoiceChannels;
        const {channel, scheduledStartAt, name, description, guildId} = guildEvent;
        if (!!trackedGuilds[guildId] && !!trackedGuilds[guildId].voiceChannels[channel?.id]) {
            const {roles, text} = trackedGuilds[guildId].voiceChannels[channel.id];
            const embed = new EmbedBuilder()
            .setColor([255, 247, 0]) // #fff800
            .setTitle(name)
            .setImage(guildEvent.coverImageURL({size: 512, extension: `jpg`}))
            .setDescription(!!description ? description : null);
            const textChannel = await this.client.channels.fetch(text.textId);
            await textChannel.send({
                content: `${Object.keys(roles).map(role => `<@&${role}>`).join(` `)} VC Event created at \`${channel.name}\`, starting at <t:${Math.round(scheduledStartAt.getTime() / 1000)}:F>.`,
                embeds: [embed]
            });
        }
    }

    /**
     * Periodic function that checks tracked guilds and voice channels for freshly started events.
     */
    async checkForEvent() {
        const now = new Date();
        for (const guildId of Object.keys(this.audioModule.trackedVoiceChannels)) {
            const {voiceChannels} = this.audioModule.trackedVoiceChannels[guildId];
            const guild = await this.client.guilds.fetch(guildId);
            const {scheduledEvents} = guild;
            // console.log(Array.from(scheduledEvents.cache.values()));
            const events = Array.from(scheduledEvents.cache.values());
            const activeChannelEvents = events
            .filter(event => event.isActive())
            .reduce((total, event) => {
                total[event.channelId] = event;
                return total;
            }, {});
            // console.log(activeChannelEvents);
            const waitingEvents = events.filter(event => event.isScheduled());
            // console.log(waitingEvents);
            for (const event of waitingEvents) {
                const {channelId} = event;
                if (!!channelId && !!voiceChannels[channelId] && now >= event.scheduledStartAt) {
                    if (!!activeChannelEvents[channelId]) {
                        activeChannelEvents[channelId].setStatus(GuildScheduledEventStatus.Completed);
                    }
                    activeChannelEvents[channelId] = event;
                    event.setStatus(GuildScheduledEventStatus.Active);
                    // const {voiceName, text, roles} = voiceChannels[channelId];
                    // const textChannel = await this.client.channels.fetch(text.textId);
                    // await textChannel.send(`${Object.keys(roles).map(role => `<@&${role}>`).join(` `)} VC Event started at \`${voiceName}\`.`)
                }
            }
        }
    }
}

module.exports = ScheduledEvents;