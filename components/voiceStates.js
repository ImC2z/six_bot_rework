const VSUpdate = {
    firstEntry: 1,
    lastExit: 2,
    penultimateExit: 3
};

class VoiceStates {
    constructor({client, audioModule}) {
        this.client = client;
        this.audioModule = audioModule;
        this.onVoiceStateUpdate = this.onVoiceStateUpdate.bind(this);
    }

    getEntryLeaveActions(oldVoiceState, newVoiceState) {
        const {channelId: oldId, channel: oldChannel} = oldVoiceState;
        const {channelId: newId, channel: newChannel} = newVoiceState;
        const actions = [];
        if (oldId !== newId) {
            if (!!oldChannel) { // last exit action
                if (oldChannel.members.size === 0) {
                    actions.push(VSUpdate.lastExit);
                } else if (oldChannel.members.size === 1) {
                    actions.push(VSUpdate.penultimateExit);
                }
            }
            if (!!newChannel && newChannel.members.size === 1) { // first entry action
                actions.push(VSUpdate.firstEntry);
            }
        }
        return actions;
    }

    async onVoiceStateUpdate(oldVoiceState, newVoiceState) {
        const {channelId: oldId, channel: oldChannel} = oldVoiceState;
        const {channelId: newId} = newVoiceState;
        const actions = this.getEntryLeaveActions(oldVoiceState, newVoiceState);
        for (const guildId of Object.keys(this.audioModule.trackedVoiceChannels)) {
            const {voiceChannels} = this.audioModule.trackedVoiceChannels[guildId];
            if (actions.includes(VSUpdate.lastExit) && !!voiceChannels[oldId]) {
                const {voiceName, text} = voiceChannels[oldId];
                const textChannel = await this.client.channels.fetch(text.textId);
                await textChannel.send(`Activity ceased at \`${voiceName}\`.`);
            } else if (actions.includes(VSUpdate.penultimateExit) && oldChannel.members.hasAny(this.client.user.id)) {
                this.audioModule.leave({interaction: null, shouldReply: false});
            }
            if (actions.includes(VSUpdate.firstEntry) && !!voiceChannels[newId]) {
                const {voiceName, roles, text} = voiceChannels[newId];
                const textChannel = await this.client.channels.fetch(text.textId);
                await textChannel.send(`Noise Activity detected at \`${voiceName}\`. Alerting all ${Object.keys(roles).map(role => `<@&${role}>`).join(`, `)}...`);
            }
        }
    }
}

module.exports = VoiceStates;