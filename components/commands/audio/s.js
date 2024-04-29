const { SlashCommandBuilder } = require(`discord.js`);

const data = new SlashCommandBuilder()
.setName(`s`)
.setDescription(`Skip the current video if any`)
.addIntegerOption(option => 
	option.setName(`to`)
	.setDescription(`Skip to index in queue`)
	.setRequired(false)
	.setMinValue(1)
);

module.exports = data