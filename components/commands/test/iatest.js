const { SlashCommandBuilder } = require(`discord.js`);

const data = new SlashCommandBuilder()
	.setName(`iatest`)
	.setDescription(`Test interaction detection`)

module.exports = data