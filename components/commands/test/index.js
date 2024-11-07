require('dotenv').config();
const { EmbedBuilder, CommandInteraction } = require("discord.js");
const getWeather = require("../../../api/getWeather");
const searchPlaces = require('../../../api/searchPlaces');
const staticMap = require('../../../api/staticMap');

/**
 * Generic template module for general bot and test functions.
 */
class TestModule {
    /**
     * @param {Object} moduleInfo
     * @param {Client} moduleInfo.client Bot client
     * @param {string} moduleInfo.messageRoomId Default text message channel id
     */
    constructor({client, messageRoomId}) {
        this.client = client;
        this.messageRoomId = messageRoomId;
    }
    
    /**
     * Calls command functionality acccording to user request.
     * @param {CommandInteraction} interaction Command sent by user
     */
    async processCommands(interaction) {
        switch(interaction.commandName) {
            case `ping`: await this.ping(interaction); break;
            case `crashbang`: await this.crashbang(interaction); break;
            case `iatest`: await this.iatest(interaction); break;
            case `r`: await this.repeat(interaction); break;
            case `weather`: await this.weather(interaction); break;
        }
    }

    /**
     * Replies to interaction with a simple Pong! message.
     * @param {CommandInteraction} interaction Command sent by user
     */
    async ping(interaction) {
        await interaction.reply(`Pong!`);
    }

    /**
     * Pseudo-replies to interaction by deleting reply and sending a message to the interaction's channel.
     * @param {CommandInteraction} interaction Command sent by user
     */
    async crashbang(interaction) {
        await interaction.deferReply();
        await interaction.deleteReply();
        await interaction.channel.send(`*dies*`);
    }

    /**
     * Replies to interaction with acknowledgement of reception.
     * @param {CommandInteraction} interaction Command sent by user
     */
    async iatest(interaction) {
        await interaction.reply(`Interaction received!`);
    }

    /**
     * Replies to interaction with user's own message.
     * @param {CommandInteraction} interaction Command sent by user
     */
    async repeat(interaction) {
        await interaction.reply(`${interaction.options.getString(`message`)}`);
    }

    /**
     * Takes a chosen location and replies w/ temperature info retrieved from Google API.
     * @param {CommandInteraction} interaction Command sent by user
     */
    async weather(interaction) {
        await interaction.deferReply();
        const queryLocation = interaction.options.getString(`location`);
        try {
            const {
                formatted_address,
                name,
                location
            } = await searchPlaces(queryLocation);
            const {
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

    /**
     * Module close handler.
     */
    close() {

    }
}

module.exports = TestModule