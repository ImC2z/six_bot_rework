const { joinVoiceChannel, createAudioPlayer } = require(`@discordjs/voice`)

class AudioModule {
    constructor(client) {
        this.client = client;
    }

    join(interaction) {

    }

    leave(interaction) {

    }

    close() {

    }
}

module.exports = AudioModule