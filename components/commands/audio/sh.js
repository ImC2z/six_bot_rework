const { SlashCommandBuilder } = require(`discord.js`);

const data = new SlashCommandBuilder()
.setName(`sh`)
.setDescription(`Shuffle the queue`);

module.exports = data