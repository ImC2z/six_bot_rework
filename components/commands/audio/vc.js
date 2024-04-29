const { SlashCommandBuilder } = require(`discord.js`);

const data = new SlashCommandBuilder()
.setName(`vc`)
.setDescription(`Join a voice channel`)

module.exports = data