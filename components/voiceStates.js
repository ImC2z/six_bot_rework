const VSUpdate = {
    leave: -1,
    lastLeave: 0,
    firstEnter: 1,
    enter: 2,
    misc: 3
};

class VoiceStates {
    constructor({client, audioModule}) {
        this.client = client;
        this.audioModule = audioModule;
    }

    getUpdateType(oldVoiceState, newVoiceState) {
        const {channel: oldChannel, channelId: oldId} = oldVoiceState;
        const {channel: newChannel, channelId: newId} = newVoiceState;
        if (oldId !== newId) {
            if (!oldId) { // enter
                return newChannel.members.size === 1 ? VSUpdate.firstEnter : VSUpdate.enter;
            } else if (!newId) { // leave
                return oldChannel.members.size === 0 ? VSUpdate.lastLeave : VSUpdate.leave;
            }
        }
        return VSUpdate.misc;
    }

    async onVoiceStateUpdate(oldVoiceState, newVoiceState) {
        const channelList = this.audioModule.trackedVoiceChannels;
        const {channel: oldChannel, channelId: oldId} = oldVoiceState;
        const {channel: newChannel, channelId: newId} = newVoiceState;
        // if (oldId !== newId) {
        //     if (!!oldId && oldChannel.members.size === 1 && oldChannel.members.hasAny(this.client.user.id)) {
        //         await this.audioModule.leave({interaction: null, shouldReply: false});
        //     }
        // }
        switch(this.getUpdateType(oldVoiceState, newVoiceState)) {
            case VSUpdate.firstEnter: {
                if (!!channelList[newId]) {
                    const {voice, roles, text} = channelList[newId];
                    const textChannel = await this.client.channels.fetch(text.textId);
                    await textChannel.send(`Noise Activity detected at \`${voice.voiceName}\`. Alerting all ${roles.map(role => `<@&${role.roleId}>`).join(`, `)}...`);
                }
                break;
            }
            case VSUpdate.leave: {
                if (oldChannel.members.size === 1 && oldChannel.members.hasAny(this.client.user.id)) {
                    await this.audioModule.leave({interaction: null, shouldReply: false});
                }
                break;
            }
            case VSUpdate.lastLeave: {
                if (!!channelList[oldId]) {
                    const {voice, text} = channelList[oldId];
                    const textChannel = await this.client.channels.fetch(text.textId);
                    await textChannel.send(`Activity ceased at \`${voice.voiceName}\`.`);
                }
                break;
            }
        }
    }
}

module.exports = VoiceStates;