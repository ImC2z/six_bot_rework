const { SlashCommandBuilder } = require(`@discordjs/builders`);

const data = new SlashCommandBuilder()
	.setName(`crashbang`)
	.setDescription(`Oh no!`)

module.exports = data