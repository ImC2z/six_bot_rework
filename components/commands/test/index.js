require('dotenv').config();
const { EmbedBuilder } = require("discord.js");
const getWeather = require("../../../api/getWeather");
const searchPlaces = require('../../../api/searchPlaces');
const staticMap = require('../../../api/staticMap');

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
            case `weather`: await this.weather({interaction}); break;
        }
    }

    async ping(interaction) {
        await interaction.reply(`Pong!`);
    }

    async crashbang(interaction) {
        await interaction.deferReply();
        await interaction.deleteReply();
        await interaction.channel.send(`*dies*`);
    }

    async iatest(interaction) {
        await interaction.reply(`Interaction received!`);
    }

    async repeat(interaction) {
        await interaction.reply(`${interaction.options.getString(`message`)}`);
    }

    async weather({interaction}) {
        await interaction.deferReply();
        const queryLocation = interaction.options.getString(`location`);
        try {
            const {
                formatted_address,
                name,
                location
            } = await searchPlaces(queryLocation);
            const {
                // locationName,
                temp,
                feels_like,
                temp_min,
                temp_max
            } = await getWeather(location);
            const mapThumbnailURL = staticMap(location);
            const replyContent = new EmbedBuilder()
            .setTitle(`${name} (${formatted_address})`)
            .setColor([255, 247, 0]) // #fff800
            .setThumbnail(mapThumbnailURL)
            .addFields(
                { 
                    name: `Temperature (°C)`, 
                    value: `- Actual: ${temp}
- Feels like: ${feels_like}
- Min: ${temp_min}
- Max: ${temp_max}`
                }
            );
            await interaction.editReply({embeds: [replyContent]});
        } catch (err) {
            await interaction.editReply(err.message);
            console.log(err);
        }
    }

    close() {

    }
}

module.exports = TestModule