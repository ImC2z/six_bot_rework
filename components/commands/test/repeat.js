const { SlashCommandBuilder } = require(`discord.js`);

const data = new SlashCommandBuilder()
	.setName(`r`)
	.setDescription(`Repeat a message`)
	.addStringOption(option =>
		option.setName(`message`)
			.setDescription(`Message to repeat`)
			.setRequired(true));

module.exports = data