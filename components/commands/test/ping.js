const { SlashCommandBuilder } = require(`discord.js`);

const data = new SlashCommandBuilder()
	.setName(`ping`)
	.setDescription(`Pong!`)
	.addStringOption(option =>
		option.setName(`message`)
			.setDescription(`Ping message`)
			.setRequired(false));

module.exports = data