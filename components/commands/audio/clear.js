const { SlashCommandBuilder } = require(`discord.js`);

const data = new SlashCommandBuilder()
.setName(`clear`)
.setDescription(`Clear all songs from queue`)

module.exports = data