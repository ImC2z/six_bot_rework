const { SlashCommandBuilder } = require(`@discordjs/builders`);

const data = new SlashCommandBuilder()
	.setName(`iatest`)
	.setDescription(`Test interaction detection`)

module.exports = data