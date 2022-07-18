class TestModule {
    constructor(client) {
        this.client = client
    }

    processCommands(interaction) {
        switch(interaction.commandName) {
            case `ping`: this.ping(interaction); break;
            case `crashbang`: this.crashbang(interaction); break;
            case `iatest`: this.iatest(interaction); break;
            case `r`: this.repeat(interaction); break;
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