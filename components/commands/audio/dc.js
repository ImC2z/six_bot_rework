const { SlashCommandBuilder } = require(`discord.js`);

const data = new SlashCommandBuilder()
.setName(`dc`)
.setDescription(`Leave the current voice channel`)

module.exports = data