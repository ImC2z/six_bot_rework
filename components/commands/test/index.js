class TestModule {
    constructor({client, messageRoomId}) {
        this.client = client;
        this.messageRoomId = messageRoomId;
    }

    async processCommands(interaction) {
        switch(interaction.commandName) {
            case `ping`: await this.ping(interaction); break;
            case `crashbang`: await this.crashbang(interaction); break;
            case `iatest`: await this.iatest(interaction); break;
            case `r`: await this.repeat(interaction); break;
        }
    }

    async ping(interaction) {
        await interaction.reply(`Pong!`);
    }

    async crashbang(interaction) {
        await interaction.deferReply();
        await interaction.deleteReply();
        interaction.channel.send(`*dies*`);
    }

    async iatest(interaction) {
        await interaction.reply(`Interaction received!`);
    }

    async repeat(interaction) {
        await interaction.reply(`${interaction.options.getString(`message`)}`);
    }

    close() {

    }
}

module.exports = TestModule