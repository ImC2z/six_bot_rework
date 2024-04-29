class VoiceStates {
    constructor({client, audioModule}) {
        this.client = client;
        this.audioModule = audioModule;
    }

    async onVoiceStateUpdate(oldVoiceState, newVoiceState) {
        if (oldVoiceState.channelId !== newVoiceState.channelId) {
            if (!!oldVoiceState.channelId && oldVoiceState.channel.members.size === 1 && oldVoiceState.channel.members.hasAny(this.client.user.id)) {
                await this.audioModule.leave({interaction: null, shouldReply: false});
            }
        }
    }
}

module.exports = VoiceStates;