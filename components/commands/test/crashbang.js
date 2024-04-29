const { SlashCommandBuilder } = require(`discord.js`);

const data = new SlashCommandBuilder()
.setName(`crashbang`)
.setDescription(`Oh no!`)

module.exports = data