const VSUpdate = {
    firstEntry: 1,
    lastExit: 2
};

class VoiceStates {
    constructor({client, audioModule}) {
        this.client = client;
        this.audioModule = audioModule;
    }

    getEntryLeaveActions(oldVoiceState, newVoiceState) {
        const {channelId: oldId, channel: oldChannel} = oldVoiceState;
        const {channelId: newId, channel: newChannel} = newVoiceState;
        const actions = [];
        if (oldId !== newId) {
            if (!!oldChannel && oldChannel.members.size === 0) { // last exit action
                actions.push(VSUpdate.lastExit);
            }
            if (!!newChannel && newChannel.members.size === 1) { // first entry action
                actions.push(VSUpdate.firstEntry);
            }
        }
        return actions;
    }

    async onVoiceStateUpdate(oldVoiceState, newVoiceState) {
        const trackedChannels = this.audioModule.trackedVoiceChannels;
        const {channelId: oldId} = oldVoiceState;
        const {channelId: newId} = newVoiceState;
        const actions = this.getEntryLeaveActions(oldVoiceState, newVoiceState);
        if (actions.includes(VSUpdate.lastExit) && !!trackedChannels[oldId]) {
            const {voice, text} = trackedChannels[oldId];
            const textChannel = await this.client.channels.fetch(text.textId);
            await textChannel.send(`Activity ceased at \`${voice.voiceName}\`.`);
        }
        if (actions.includes(VSUpdate.firstEntry) && !!trackedChannels[newId]) {
            const {voice, roles, text} = trackedChannels[newId];
            const textChannel = await this.client.channels.fetch(text.textId);
            await textChannel.send(`Noise Activity detected at \`${voice.voiceName}\`. Alerting all ${roles.map(role => `<@&${role.roleId}>`).join(`, `)}...`);
        }
    }
}

module.exports = VoiceStates;