const { SlashCommandBuilder } = require(`discord.js`);

const data = new SlashCommandBuilder()
.setName(`rm`)
.setDescription(`Remove a video from queue`)
.addStringOption(option =>
	option.setName(`removals`)
	.setDescription(`format (e.g. 0, 1, 3-4, 6)`)
	.setRequired(true)
);

module.exports = data