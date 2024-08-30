const { SlashCommandBuilder } = require("discord.js");

const weather = new SlashCommandBuilder()
.setName(`weather`)
.setDescription(`Get the weather data for a location`)
.addStringOption(option =>
    option.setName(`location`)
    .setDescription(`Area/City name`)
    .setRequired(true)
    .setMaxLength(100)
);

module.exports = weather;