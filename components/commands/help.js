const { SlashCommandBuilder } = require('discord.js');
const fs = require(`fs`);

const commandCategories = fs.readdirSync(`./components/commands`).filter(file => !file.endsWith(`.js`));
const categoryChoices = commandCategories.map(category => {
	return {
		name: category,
		value: category
	}
});

const format = new SlashCommandBuilder()
.setName('help')
.setDescription(`Display the help menu`)
.addStringOption(option =>
	option.setName('category')
	.setDescription('Help category')
	.setRequired(false)
	.addChoices(...categoryChoices)
);

module.exports = format